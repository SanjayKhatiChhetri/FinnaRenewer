---
name: checkpoint
description: Quick WIP commit without build verification
---

# /checkpoint — Quick Save

Stage and commit current work-in-progress without running the build. Use this mid-task when you want a save point but aren't ready to ship.

## Steps

1. Run `git status` and `git diff` to see what changed.
2. Stage relevant files (never `.env*`, `node_modules/`, `screenshots/`).
3. Commit with a short descriptive message prefixed with `wip:`. Use a HEREDOC for the message. Include the co-authored-by trailer.

## Important

- No build step — this is intentionally fast.
- No push — checkpoints stay local until `/ship`.
- Never use `git add -A`.
