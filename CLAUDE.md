# Finna Renewer

Multi-user web app that auto-renews Oulu Finna library loans. Users register, link encrypted Finna credentials, and loans due within N days get renewed weekly via Vercel Cron.

## Stack

Next.js 15 (App Router) · TypeScript · Auth.js v5 (JWT sessions) · Drizzle ORM · Neon PostgreSQL · Tailwind v4 · Vercel

## Development

```bash
# All commands run inside WSL (not Git Bash — see GOTCHAS.md)
wsl.exe bash -lc "source ~/.nvm/nvm.sh && cd ~/projects/finna-renewer && npm run dev"
wsl.exe bash -lc "source ~/.nvm/nvm.sh && cd ~/projects/finna-renewer && npm run build"

# Database (must source .env.local manually — drizzle-kit doesn't auto-load it)
wsl.exe bash -lc "cd ~/projects/finna-renewer && source ~/.nvm/nvm.sh && set -a && source .env.local && set +a && npx drizzle-kit push"
wsl.exe bash -lc "cd ~/projects/finna-renewer && source ~/.nvm/nvm.sh && set -a && source .env.local && set +a && npx drizzle-kit studio"
```

## Critical invariants

1. **Cutoff logic** (`src/server/services/renewal-engine.ts`): Cutoff is midnight of day N+1, not `now + N*86400000`. This handles same-day edge cases. Do not simplify.
2. **Credential encryption** (`src/server/services/encryption.ts`): AES-256-GCM with per-record random IV. The `(encryptedData, iv, authTag)` triple must stay together. ENCRYPTION_KEY is 64-char hex (32 bytes).
3. **Finnish date format**: Finna uses `DD.M.YYYY HH.MM` (dots in time, not colons). The regex in `src/server/finna/loans.ts` handles this.
4. **JWT sessions**: Auth.js Credentials provider requires JWT, not database sessions. See `src/lib/auth.ts`.

## Code style

- Pragmatic, semantic, zero-tech-debt code. Clean enough that a new developer reads it and understands intent immediately.
- No comments explaining *what* — only *why* when non-obvious. Well-named identifiers carry the what.
- No premature abstractions. Three similar lines beats a premature helper.
- No dead code, no backwards-compat shims, no feature flags for hypothetical futures.
- If a trade-off is made, document it in `docs/DECISIONS.md`.

## Key files

| Path | Purpose |
|------|---------|
| `src/server/services/renewal-engine.ts` | Core business logic — the renewal orchestrator |
| `src/server/finna/` | Finna HTTP scraping (login, loans, renew) |
| `src/server/services/encryption.ts` | AES-256-GCM encrypt/decrypt |
| `src/lib/auth.ts` | Auth.js config (providers, JWT callbacks) |
| `src/lib/db/schema.ts` | All 8 database tables |
| `src/app/globals.css` | Design system tokens (@theme) |
| `src/components/ui/` | Design system primitives (button, card, input, badge, toggle) |
| `middleware.ts` | Route protection (auth guard) |
| `vercel.json` | Cron schedule (Monday 6 AM UTC) |

## Documentation

| File | What |
|------|------|
| `GOTCHAS.md` | Environment + framework pitfalls. Check here first when something breaks. |
| `docs/ARCHITECTURE.md` | System diagram, data flow, security model, file map |
| `docs/DECISIONS.md` | ADRs — why each technical choice was made |
| `docs/DESIGN-SYSTEM.md` | Colors, typography, component variants |

## Branches

| Branch | Content |
|--------|---------|
| `main` | Next.js web app (production) |
| `go-discord-setup` | Original Go CLI + Discord bot |
| `background` | Reverse-engineering notes, project context docs |

## Environment variables

Required in `.env.local` (and Vercel dashboard):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `AUTH_SECRET` — Auth.js signing secret
- `ENCRYPTION_KEY` — 64-char hex for AES-256-GCM
- `CRON_SECRET` — Bearer token for cron endpoint
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — Web Push public key
- `VAPID_PRIVATE_KEY` — Web Push private key
- `VAPID_SUBJECT` — mailto: for VAPID

Optional:
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth
