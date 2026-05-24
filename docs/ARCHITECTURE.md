# Architecture

## What this is

Finna Renewer is a web app that automatically renews Oulu Finna library loans before they're due. Users register, link their Finna credentials (encrypted at rest), and the system renews loans on a weekly cron schedule. Notifications go out via web push and Discord webhooks.

## System diagram

```
Browser (PWA)
  ├─ Landing page (static)
  ├─ Auth pages (login/register)
  └─ Dashboard (server components + client interactivity)
       ├─ View loans (fetched live from Finna)
       ├─ Manual renew
       ├─ Settings (credentials, notifications, preferences)
       └─ Renewal history (from DB)

Vercel Serverless
  ├─ Next.js App Router (pages + API routes)
  ├─ Auth.js v5 (JWT sessions, Credentials + OAuth providers)
  ├─ Server Actions (mutations)
  └─ Cron: /api/cron/renew (Mondays 6 AM UTC)
       └─ For each user with auto_renew_enabled:
            1. Decrypt credentials (AES-256-GCM)
            2. Login to Finna (HTTP + cookie management)
            3. Fetch loans, filter by cutoff
            4. POST renewal form
            5. Log results to DB
            6. Notify via Discord + web push

Neon PostgreSQL (serverless)
  └─ 8 tables: users, accounts, sessions, verification_tokens,
     library_credentials, user_settings, push_subscriptions, renewal_logs

External
  ├─ outi.finna.fi (Oulu library portal — scraping target)
  ├─ Discord API (webhook notifications)
  └─ Web Push (VAPID-based push notifications)
```

## Data flow: renewal cycle

```
Cron trigger (Monday 6 AM UTC)
  → Authenticate via CRON_SECRET bearer token
  → Query all users WHERE auto_renew_enabled = true
  → For each user:
      → Decrypt library credentials from DB
      → HTTP GET login page → extract CSRF token
      → HTTP POST credentials → get session cookies
      → HTTP GET /MyResearch/CheckedOut → parse loan table
      → Filter: loan.dueDate < cutoff (midnight of now + N + 1 days)
      → If loans to renew:
          → HTTP POST renewal form (csrf + selectAll + loan IDs)
          → Parse response for per-loan success/failure
      → Insert renewal_log row (status, details JSON)
      → Send Discord embed (if webhook configured)
      → Send web push (if subscriptions exist, auto-clean stale)
```

## Security model

| Layer               | Mechanism                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| Auth                | Auth.js v5, JWT sessions, bcrypt (12 rounds) for passwords                   |
| Credentials at rest | AES-256-GCM, per-record random IV, key from env var                          |
| Route protection    | Next.js middleware checks session for /dashboard/_, /settings/_, /history/\* |
| Cron auth           | Bearer token (CRON_SECRET)                                                   |
| CSRF                | Finna's own CSRF tokens extracted and submitted back                         |
| Secrets             | All in env vars, never committed (.env.local gitignored)                     |

## Database schema

8 tables, all user-owned tables cascade on user delete:

- **users** — id, name, email, hashedPassword, image, emailVerified
- **accounts** — OAuth provider accounts (Google, GitHub)
- **sessions** — Auth.js sessions (kept for OAuth, JWT used for credentials)
- **verification_tokens** — Email verification (future use)
- **library_credentials** — encryptedUsername, encryptedPassword, iv, authTag, browserCookie
- **user_settings** — auto_renew_enabled, notify_enabled, renew_days_before (1-14), discord_webhook_url
- **push_subscriptions** — endpoint, p256dh, auth (Web Push protocol)
- **renewal_logs** — status, message, loansChecked, loansRenewed, details (JSONB)

## Key technical choices

See [DECISIONS.md](./DECISIONS.md) for the reasoning behind each.

## File map

```
src/
├── app/
│   ├── (auth)/           Auth layout: login, register
│   ├── (dashboard)/      Dashboard layout: dashboard, history, settings
│   ├── api/
│   │   ├── auth/         NextAuth route handler
│   │   ├── cron/renew/   Vercel cron endpoint
│   │   └── push/         Push subscription API
│   ├── globals.css        Design system tokens
│   ├── layout.tsx         Root layout (fonts, PWA meta)
│   ├── page.tsx           Landing page
│   └── offline/           PWA offline fallback
├── components/
│   ├── auth/              Login/register forms
│   ├── dashboard/         Dashboard content, link prompt
│   ├── history/           Renewal history list
│   ├── settings/          Settings form sections
│   ├── shared/            Navigation (sidebar + mobile)
│   ├── ui/                Design system primitives
│   ├── push-manager.tsx   Push notification subscribe/unsubscribe
│   └── pwa-register.tsx   Service worker registration
├── lib/
│   ├── auth.ts            Auth.js configuration
│   ├── db/
│   │   ├── index.ts       Drizzle client (Neon serverless)
│   │   └── schema.ts      All table definitions
│   ├── utils.ts           cn(), daysUntilDue(), formatFinnishDate()
│   └── validations.ts     Zod schemas
└── server/
    ├── actions/            Server actions (auth, library, loans, settings)
    ├── finna/              Finna HTTP client, login, loan parsing, renewal
    └── services/           Encryption, Discord, push notifications, renewal engine
```
