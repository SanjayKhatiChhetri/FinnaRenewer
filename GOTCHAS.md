# Gotchas

Known environment, tooling, and framework pitfalls.
When you hit something weird, check here first. If it's not here, add it.

---

## Environment: WSL + Windows boundary

### UNC path not supported by CMD.EXE
**Symptom**: `npx` or `npm` commands fail with "UNC path not supported" when run from Git Bash on a WSL filesystem path (`//wsl.localhost/...`).
**Cause**: Git Bash shells out to CMD.EXE for some operations, and CMD doesn't support UNC paths.
**Fix**: Run the command through WSL instead:
```bash
wsl.exe bash -lc "cd ~/projects/finna-renewer && npx drizzle-kit push"
```

### esbuild platform mismatch
**Symptom**: `@esbuild/linux-x64 is installed but needs @esbuild/win32-x64` (or vice versa).
**Cause**: `npm install` ran inside WSL (Linux binaries), but `npx`/`node` ran from Windows. Platform-specific native modules don't cross the boundary.
**Fix**: Always run `npm install` and `npm run <script>` from the **same** environment. For this project, that means WSL:
```bash
wsl.exe bash -lc "source ~/.nvm/nvm.sh && cd ~/projects/finna-renewer && npm install"
```

### Node.js via nvm in WSL
**Symptom**: `node: command not found` inside `wsl.exe bash -c "..."`.
**Cause**: nvm loads via `.bashrc` which is only sourced for login shells.
**Fix**: Use `bash -lc` (login shell) or source nvm explicitly:
```bash
wsl.exe bash -lc "source ~/.nvm/nvm.sh && node --version"
```

### rm -rf fails on node_modules from Windows
**Symptom**: `rm: cannot remove 'node_modules/.bin/...': Input/output error` when deleting from Git Bash.
**Cause**: WSL symlinks in `.bin/` can't be removed through the Windows filesystem layer.
**Fix**: Delete from within WSL:
```bash
wsl.exe bash -c "rm -rf ~/projects/finna-renewer/node_modules"
```

---

## Framework: Next.js + Auth.js + Tailwind

### Auth.js Credentials provider requires JWT sessions
**Symptom**: Registration or login succeeds (user created in DB) but redirect to dashboard fails — user lands on login page instead.
**Cause**: Auth.js v5 Credentials provider does NOT create database session rows. The `database` session strategy silently fails.
**Fix**: Use `session: { strategy: "jwt" }` in the NextAuth config. The session callback receives `{ session, token }` (not `{ session, user }`).
```typescript
// WRONG
session: { strategy: "database" }
callbacks: { session({ session, user }) { ... } }

// RIGHT
session: { strategy: "jwt" }
callbacks: {
  jwt({ token, user }) { if (user) token.id = user.id; return token; },
  session({ session, token }) { session.user.id = token.id as string; return session; }
}
```

### Tailwind v4 @theme namespace collisions
**Symptom**: `max-w-3xl` resolves to 40px instead of 48rem; layout breaks with single-word lines.
**Cause**: Custom `--spacing-3xl: 2.5rem` in `@theme` overrides Tailwind v4's built-in `max-w-3xl` utility. Tailwind v4 uses `--spacing-*` for width/max-width scales.
**Fix**: Don't define `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`, `--spacing-2xl`, `--spacing-3xl`, `--spacing-4xl` in `@theme`. Tailwind's built-in 4px-base spacing already covers these. Only define semantic aliases like `--spacing-section` or `--spacing-hero` that won't collide.

### drizzle-kit doesn't load .env.local
**Symptom**: `drizzle-kit push` fails with "Either connection url or host are required".
**Cause**: drizzle-kit doesn't auto-load `.env.local`. Next.js does, but drizzle-kit runs outside Next.js.
**Fix**: Source the env file before running:
```bash
set -a && source .env.local && set +a && npx drizzle-kit push
```
Or export DATABASE_URL inline:
```bash
DATABASE_URL='postgresql://...' npx drizzle-kit push
```

---

## Business Logic

### Renewal cutoff is end-of-day, not now + N days
**Symptom**: Loans due "today" at 23:59 might not get renewed if the cron runs at 06:00.
**Cause**: Naive `now + N days` comparison misses same-day edge cases.
**Fix**: Cutoff is midnight of day N+1 — meaning "due within the next N full days":
```typescript
const cutoff = new Date(
  now.getFullYear(), now.getMonth(),
  now.getDate() + renewDaysBefore + 1,
  0, 0, 0  // midnight
);
```
This is intentional and tested. Do not simplify to `Date.now() + days * 86400000`.

### Finnish date format uses dots, not colons
**Symptom**: Due dates parse as Invalid Date.
**Cause**: Finna returns dates like `18.5.2026 14.30` (dot separator in time, not colon).
**Fix**: The regex in `loans.ts` handles this: `/(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{2}\.\d{2})/`. Do not "fix" the time separator to colons without testing against real Finna HTML.

### Node.js fetch loses cookies on redirects (SESSION_EXPIRED)
**Symptom**: Library card shows "Connected" but all operations fail with `SESSION_EXPIRED`.
**Cause**: `fetch()` with `redirect: "follow"` does NOT preserve `Set-Cookie` headers from intermediate 302 responses. Finna's login POST responds with a 302 that carries the session cookie — that cookie is silently lost. Go's `http.Client` with a cookie jar preserves these automatically, which is why the Go version worked.
**Fix**: Use `redirect: "manual"` for the login POST, extract cookies from the 302 response's `Set-Cookie` header, then check the `Location` header for success/failure. Do not follow the redirect — we only need the cookies.
```typescript
// WRONG — loses session cookie from 302
const resp = await fetch(url, { redirect: "follow" });

// RIGHT — captures session cookie
const resp = await fetch(url, { redirect: "manual" });
const cookies = extractCookiesFromHeaders(resp.headers);
```
