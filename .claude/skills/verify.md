---
name: verify
description: Run build and report pass/fail status
---

# /verify — Build Check

Run the Next.js build to verify the project compiles without errors.

## Steps

1. Run `wsl.exe bash -lc "source ~/.nvm/nvm.sh && cd ~/projects/finna-renewer && npm run build"`.
2. Report result: pass or fail.
3. If it fails, read the error output and identify the failing file(s) and line(s). Suggest fixes but don't apply them unless asked.
