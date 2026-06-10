# Architecture Decision Records

Decisions made during development, with context. When you revisit a decision, update the record — don't delete it.

---

## ADR-001: Next.js over standalone Go binary

**Decision**: Replace Go CLI + Discord bot with a Next.js 15 web app.

**Context**: The Go version was a single-user CLI that ran as a cron job and notified via Discord. To support multiple users, we needed auth, a database, a UI, and per-user configuration. Building that in Go would mean choosing a web framework, templating, ORM, and auth library — all with less ecosystem support than the JS/TS world.

**Consequence**: The Go code is preserved on the `go-discord-setup` branch. The Finna scraping logic was ported 1:1 to TypeScript (cheerio replaces goquery, fetch replaces net/http). The Discord notification format is identical.

**Trade-off**: Serverless cold starts on Vercel add ~1-2s latency to the first request. The Go binary had zero cold start. Acceptable because the cron job runs once/week and users interact through a browser (not latency-sensitive).

---

## ADR-002: Neon PostgreSQL over SQLite/Turso

**Decision**: Use Neon serverless PostgreSQL.

**Context**: Vercel serverless functions are stateless — no persistent filesystem. SQLite requires a file. Turso (libSQL) was an option but adds a vendor dependency. Neon is Vercel's recommended PostgreSQL provider, has a generous free tier, and works with standard Drizzle ORM PostgreSQL drivers.

**Consequence**: Connection via `@neondatabase/serverless` (HTTP-based, no TCP socket needed). Cold-start friendly.

**Trade-off**: Slight query latency (~10-50ms) compared to SQLite. Irrelevant for this use case.

---

## ADR-003: JWT sessions over database sessions

**Decision**: Use `session: { strategy: "jwt" }` in Auth.js.

**Context**: Auth.js v5 Credentials provider does not support database session strategy. It silently fails to create session rows. We discovered this when registration succeeded but auto-sign-in didn't redirect to dashboard. See GOTCHAS.md for details.

**Consequence**: Sessions are stateless JWTs stored in cookies. We cannot server-side revoke individual sessions. The `sessions` table still exists (used by OAuth providers if configured) but credentials-based logins don't write to it.

**Trade-off**: No server-side session revocation. Acceptable because this is a personal tool, not a multi-tenant SaaS. If session revocation becomes needed, switch to a hybrid approach (JWT for credentials, database for OAuth) or add a token blocklist.

---

## ADR-004: AES-256-GCM for credential encryption

**Decision**: Encrypt Finna usernames and passwords at rest with AES-256-GCM.

**Context**: We must store library credentials to log in on the user's behalf during cron jobs. Storing plaintext is unacceptable. Hashing (like bcrypt) is one-way — we need the original value back. Symmetric encryption with a server-side key is the standard approach.

**Implementation**: Each credential row stores `(encryptedData, iv, authTag)`. The IV is a random 12-byte value generated per encryption. The key is a 256-bit hex string from `ENCRYPTION_KEY` env var.

**Trade-off**: If the ENCRYPTION_KEY leaks, all credentials are compromised. Mitigation: key is only in Vercel env vars and local .env.local (gitignored). Key rotation would require re-encrypting all rows — not implemented yet.

**Future**: If the app scales, consider per-user encryption keys derived from user passwords (envelope encryption). This adds complexity but means a server compromise doesn't expose all credentials.

---

## ADR-005: Tailwind v4 custom design system

**Decision**: Use Tailwind CSS v4 with `@theme` directive for a custom design system blending Notion pastels and Cohere typography.

**Context**: The user wanted "pastel features from Notion design and typography from Cohere design." Rather than importing a component library (shadcn, Radix), we built a minimal design system with CVA (class-variance-authority) for component variants.

**Components**: button (primary/secondary/ghost/danger/link), card (base/elevated/flat + pastel tints), input, badge, toggle. All use design tokens from `globals.css`.

**Trade-off**: No accessibility primitives (focus traps, aria patterns) that come with Radix/shadcn. Acceptable for current scope. If the app adds modals, dropdowns, or complex interactive patterns, adopt Radix primitives and wire them to our design tokens.

**Gotcha**: Tailwind v4 `@theme` namespaces map directly to utility classes. Custom `--spacing-*` values collide with `max-w-*`, `w-*`, etc. See GOTCHAS.md. We removed the overlapping custom spacing values.

**Update (ADR-009)**: The Notion-pastel + Cohere-typography direction was replaced by the "Reading Room" editorial system. The CVA component approach and `@theme` token model are unchanged.

---

## ADR-006: Dual notification channels (Discord + Web Push)

**Decision**: Support both Discord webhooks and Web Push notifications.

**Context**: The Go version used Discord exclusively. Discord is great for desktop users who live in Discord, but not everyone does. Web Push works on phones and desktops without requiring a third-party app. Both are optional per-user.

**Implementation**: Discord webhooks are stored per-user in `user_settings`. Web Push subscriptions use the standard VAPID protocol with subscriptions in `push_subscriptions` table. Stale endpoints (404/410) are auto-cleaned.

**Trade-off**: Two notification code paths to maintain. Low complexity since both are fire-and-forget.

---

## ADR-007: Cheerio for HTML scraping

**Decision**: Use cheerio (server-side jQuery) for parsing Finna HTML.

**Context**: Finna has no public API. The Go version used goquery (Go's equivalent). Cheerio is the direct TypeScript analog — same CSS selector API, same parsing model.

**Trade-off**: Scraping is fragile. If Finna redesigns their checkout page, parsing breaks. Mitigation: the scraping code is isolated in `src/server/finna/` — any fix is localized. The selectors (`.myresearch-row`, `.alert-success`, etc.) are documented in the parsing functions.

**Future**: If Finna ever ships an API, replace the scraping layer while keeping the rest of the renewal engine intact.

---

## ADR-008: Weekly cron over real-time monitoring

**Decision**: Run renewals once per week (Monday 6 AM UTC) via Vercel Cron.

**Context**: The Go version also ran weekly. Library loans typically have 28-day terms. Checking once/week with a 7-day-before-due threshold catches everything with margin.

**Trade-off**: If a loan has <7 days remaining when first borrowed, it might not be renewed until the next cycle. The `renew_days_before` setting (1-14) mitigates this — users with short-term loans can increase the threshold.

**Future**: Vercel Cron on Hobby plan only supports 1 cron job. If we need daily checks, either upgrade the plan or have users trigger manual renewals from the dashboard (already implemented).

---

## ADR-009: "Reading Room" editorial rebrand

**Decision**: Replace the purple-SaaS + Notion-pastel look with an editorial "Reading Room" identity — serif display (Fraunces), a committed garnet accent (book-spine / library-stamp), gold for earned delight, on a restrained paper/ink base.

**Context**: The old UI was clean but generic; its purple `#5645d4` and geometric sans could have been any SaaS tool and didn't express the brand `PRODUCT.md` calls for — "a warm, bookish library companion." The user asked for a full transformation of color, type, and feel.

**Consequence**: New OKLCH token palette; Fraunces + Inter + JetBrains Mono. The `@theme` token model and CVA components are reused, so most surfaces re-themed for free.

**Trade-off**: Brand color identity changed wholesale (no migration path for users used to purple). Accepted — it's a personal tool and the brief was explicit. Avoided the AI cream-band reflex by carrying warmth through type/accent/illustration, not a tinted body bg.

---

## ADR-010: Dual theme via next-themes + theme-flipping `*-deep` tokens

**Decision**: Ship light (Reading Room) + dark (Dusk) themes using `next-themes` (class strategy, system default) and Tailwind v4 `@custom-variant dark`. Tokens are runtime CSS vars under `:root` / `.dark`, bound through `@theme inline`.

**Context**: One accent hue can't read as foreground on both a light and a dark surface. Colored text on `*-soft` / tinted backgrounds washed out (e.g. error-on-error-soft measured ~2.3:1).

**Consequence**: Added `*-deep` foreground tokens (`primary/success/warning/error/info`) that **flip per theme** — deep shade in light, light shade in Dusk. Foreground-on-tint always uses `*-deep`; base colors are fills or foreground-on-canvas only. All text verified ≥ WCAG AA in both themes.

**Trade-off**: Two values per semantic role to maintain, and a discipline rule contributors must follow (documented in DESIGN-SYSTEM.md). `next-themes` adds one dependency and requires `suppressHydrationWarning` on `<html>`.

**Gotcha**: `@theme inline` *inlines* token values into utilities and does **not** emit matching `:root` custom properties — so runtime `getComputedStyle(var(--color-*))` reads can be misleading. Verify contrast against the rendered utility color, not the namespaced var.

---

## ADR-011: `motion` library for animation

**Decision**: Add `motion` (Framer Motion, `motion/react`) for page transitions, `layoutId` nav indicators, list stagger, scroll reveals, stat count-ups, and the theme-toggle.

**Context**: The brief wanted rich, first-class motion. CSS keyframes alone can't do shared-element (`layoutId`) transitions, spring physics, or scroll-linked reveals cleanly.

**Consequence**: Shared variants in `src/lib/motion.ts` mirror the CSS ease tokens. Every animation is gated on `useReducedMotion`; the global `prefers-reduced-motion` block remains the backstop.

**Trade-off**: One client-side dependency (~adds to First Load JS on animated routes). Accepted for the UX gain; static/server components are unaffected.
