package main

import (
    "errors"
    "fmt"
    "log"
    "net/http"
    "time"
)

// Main flow:
//   1. Load config
//   2. Login
//   3. Fetch loans (with auto session refresh)
//   4. Determine which loans need renewal
//   5. Renew (or dry-run)
//   6. Notify Discord
func main() {
    cfg := mustLoadConfig()

    log.Println("▶ Starting Finna renewer…")

    // ───────────────────────────────────────────────────────────────
    // LOGIN
    // ───────────────────────────────────────────────────────────────
    log.Println("▶ Logging in to Oula Finna…")
    client, err := login(cfg)
    if err != nil {
        notifyError(cfg, fmt.Errorf("login failed: %w", err))
        log.Fatalf("login error: %v", err)
    }
    log.Println("  Login successful.")

    // ───────────────────────────────────────────────────────────────
    // FETCH LOANS (with auto session refresh)
    // ───────────────────────────────────────────────────────────────
    loans, csrf, err := fetchLoansWithRetry(cfg, client)
    if err != nil {
        notifyError(cfg, err)
        log.Fatalf("fetch error: %v", err)
    }
    log.Printf("  Found %d loans.", len(loans))

    // ───────────────────────────────────────────────────────────────
    // DETERMINE WHICH LOANS NEED RENEWAL
    // ───────────────────────────────────────────────────────────────
    now := time.Now()
    cutoff := time.Date(now.Year(), now.Month(), now.Day()+cfg.RenewDaysBefore+1, 0, 0, 0, 0, now.Location())
    var toRenew []Loan

    for _, l := range loans {
        if l.DueDate.IsZero() {
            continue
        }
        if !l.DueDate.After(cutoff) {
            toRenew = append(toRenew, l)
        }
    }

    // ───────────────────────────────────────────────────────────────
    // NOTHING TO RENEW → send check‑in embed
    // ───────────────────────────────────────────────────────────────
    if len(toRenew) == 0 {
        log.Printf("  No loans due within %d days — nothing to renew.", cfg.RenewDaysBefore)

        if cfg.DiscordWebhookURL != "" {
            embed := buildUpcomingEmbed(loans, cfg.RenewDaysBefore)
            if err := sendDiscord(cfg, embed); err != nil {
                log.Printf("  Discord error: %v", err)
            }
        }
        return
    }

    // ───────────────────────────────────────────────────────────────
    // RENEW LOANS
    // ───────────────────────────────────────────────────────────────
    log.Printf("  %d loan(s) due within %d days — renewing…", len(toRenew), cfg.RenewDaysBefore)
    for _, l := range toRenew {
        log.Printf("    • %s (due %s, %d days)",
            truncate(l.Title, 50),
            l.DueDate.Format("2.1.2006 15:04"),
            l.DaysUntilDue(),
        )
    }

    results, err := renewAll(cfg, csrf, loans, client)
    if err != nil {
        notifyError(cfg, err)
        log.Fatalf("renewal error: %v", err)
    }

    // Log results to terminal
    for _, r := range results {
        if r.Success {
            log.Printf("  ✅ %s → was %s → now %s",
                truncate(r.Loan.Title, 50),
                r.Loan.DueDate.Format("2.1.2006 15:04"),
                r.NewDueDate.Format("2.1.2006 15:04"),
            )
        } else {
            log.Printf("  ❌ %s — %s",
                truncate(r.Loan.Title, 50),
                r.ErrMsg,
            )
        }
    }

    // ───────────────────────────────────────────────────────────────
    // SEND DISCORD NOTIFICATION
    // ───────────────────────────────────────────────────────────────
    if cfg.DiscordWebhookURL != "" {
        embed := buildRenewalEmbed(results)
        if err := sendDiscord(cfg, embed); err != nil {
            log.Printf("  Discord error: %v", err)
        } else {
            log.Println("  Discord notification sent.")
        }
    }
}

// fetchLoansWithRetry calls fetchLoans and, if the session has expired,
// performs a fresh login and retries once.
func fetchLoansWithRetry(cfg Config, client *http.Client) ([]Loan, string, error) {
    log.Println("▶ Fetching loans…")

    loans, csrf, err := fetchLoans(cfg, client)
    if err == nil {
        return loans, csrf, nil
    }

    if !errors.Is(err, ErrSessionExpired) {
        return nil, "", err
    }

    // Session expired → re-login
    log.Println("  Session expired — re-logging in…")
    newClient, loginErr := login(cfg)
    if loginErr != nil {
        return nil, "", fmt.Errorf("re-login failed: %w", loginErr)
    }

    // Replace cookie jar
    client.Jar = newClient.Jar

    return fetchLoans(cfg, client)
}

// notifyError sends an error embed to Discord if configured.
func notifyError(cfg Config, err error) {
    if cfg.DiscordWebhookURL == "" {
        return
    }
    embed := buildErrorEmbed(err)
    if terr := sendDiscord(cfg, embed); terr != nil {
        log.Printf("  (Discord error notification also failed: %v)", terr)
    }
}
