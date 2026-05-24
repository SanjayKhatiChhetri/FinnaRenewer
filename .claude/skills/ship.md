---
name: ship
description: Build, commit, and push changes in one command
---

# /ship — Build + Commit + Push

Run the full shipping pipeline: typecheck/build, stage changes, commit with a good message, and push to GitHub.

## Steps

1. **Build check** — Run `wsl.exe bash -lc "source ~/.nvm/nvm.sh && cd ~/projects/finna-renewer && npm run build"`. If it fails, stop and fix errors before continuing.

2. **Stage & diff** — Run `git status` and `git diff --staged` and `git diff` in parallel to see what changed. Also run `git log --oneline -5` for commit message style reference.

3. **Commit** — Write a concise commit message (1-2 sentences) that describes *why*, not *what*. Follow this repo's existing style. End the message with the co-authored-by trailer. Stage only relevant files (no `.env`, no `node_modules/`, no `screenshots/`). Use a HEREDOC for the message.

4. **Push** — Run `git push origin main`.

If there are no changes to commit, say so and stop.

## Important

- Always work directly on `main` — never create branches.
- Never skip GPG signing. If it fails, ask the user.
- Never use `git add -A` — stage specific files.
- If the build fails, fix the errors and retry once. If it fails again, stop and report.
