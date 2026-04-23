# finna-renewer — Claude context

## What this is
A single-binary Go CLI that logs into the Oulu Finna library portal, checks which loans are due soon, renews them automatically, and posts a Discord embed with the result. Designed to run as a GitHub Actions cron job or locally.

## File map
| File | Role |
|---|---|
| `main.go` | Entry point. Login → fetch loans → filter → renew → notify |
| `config.go` | Loads `.env` + env vars into `Config` struct |
| `lonas.go` | `fetchLoans`, `parseDueDate`, `Loan` struct, `DaysUntilDue` |
| `login.go` | Finna login (POST with Cloudflare-aware headers), session helpers |
| `renew.go` | `renewAll`, `buildRenewalForm`, `parseRenewalResponse` |
| `notify.go` | Discord embed builders (`buildUpcomingEmbed`, `buildRenewalEmbed`, `buildErrorEmbed`) |
| `http_client.go` | `doRequestWithRetry`, shared HTTP helpers |

## Key types
```go
type Config struct {
    FinnaID, FinnaPassword, FinnaCookie string
    DiscordWebhookURL                   string
    RenewDaysBefore                     int  // default 7
    DryRun, HealthCheck                 bool
}

type Loan struct {
    ID, Title string
    DueDate   time.Time
}

type RenewalResult struct {
    Loan       Loan
    Success    bool
    NewDueDate time.Time
    ErrMsg     string
}
```

## Critical invariants
- **Cutoff is midnight of day N+1** (not `now + N days`). Finna due times are always 23:59; using an exact timestamp cutoff wrongly excludes items due on the boundary day.
  ```go
  cutoff := time.Date(now.Year(), now.Month(), now.Day()+cfg.RenewDaysBefore+1, 0, 0, 0, 0, now.Location())
  ```
- **`parseDueDate` uses `time.Parse`** (UTC). Due dates from Finna are Finnish time (EET/EEST). This is a known minor issue — timezone offset is small enough not to cause renewal misses in practice, but beware if comparing near midnight.
- **`dueDateFormat = "2.1.2006 15.04"`** — note dot separator in time (Finnish format).
- **`dueDateRegex`** matches `DD.M.YYYY HH.MM` anywhere in text — needed because goquery concatenates sibling text nodes without spaces (e.g. `"23.59Renewal Successful"`).

## Go format string gotcha
Go's `time.Format` uses reference-time tokens. `"2.1.2006 15:04"` is correct for display. Never write `"2.1.2006 23:59"` — `"23"` is parsed as day+12h-hour token and produces garbage output.

## Environment variables
| Var | Required | Default | Description |
|---|---|---|---|
| `FINNA_ID` | yes | — | Finna username |
| `FINNA_PASSWORD` | yes | — | Finna password |
| `FINNA_COOKIE` | no | — | Browser cookie string (helps bypass Cloudflare) |
| `DISCORD_WEBHOOK_URL` | no | — | Discord webhook for notifications |
| `RENEW_DAYS_BEFORE` | no | `7` | Renew items due within N days |
| `DRY_RUN` | no | `false` | Simulate renewal without POSTing |
| `HEALTHCHECK` | no | `false` | Reserved for future use |

## Build & run
```bash
# Build (run inside WSL)
PATH=/usr/local/go/bin:$PATH go build ./...

# From PowerShell on Windows
wsl -e bash -lc "cd ~/projects/finna-renewer && PATH=/usr/local/go/bin:\$PATH go build ./..."

# Run
./finna-renewer
```

## Discord flow
- `len(toRenew) == 0` → `buildUpcomingEmbed` (blue, check-in, shows all loans + items needing renewal)
- `len(toRenew) > 0` → renew then `buildRenewalEmbed` (green/yellow/red based on success rate)
- Any fatal error → `buildErrorEmbed` (red)

## Folders to ignore
- `Reverse-engineering/` — HTML/XHR reference snapshots used during initial development. Not part of the app.
