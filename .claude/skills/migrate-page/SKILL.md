---
name: migrate-page
description: Migrate a page to the UI primitive system following the standard workflow
---

# Migrate Page to UI Primitives

For each page migration, follow this checklist in order:

## 1. Explore

- Read the target page component and list every UI element (buttons, inputs, cards, badges, modals).
- Note current Tailwind classes and any inline styles.

## 2. Plan

- Map each element to a UI primitive from `src/components/ui/`.
- Flag flex/sizing concerns: apply `flex-1` to **wrappers**, never to inner `<input>` or `<button>` elements.
- Identify any missing primitives that need to be created.

## 3. Implement

- Swap raw HTML elements for UI primitives.
- Preserve all existing functionality (event handlers, conditional rendering, data flow).
- Use design system tokens from `src/app/globals.css` — no hardcoded colors.

## 4. Self-Review

- [ ] `aria-labelledby` on all modals and dialogs
- [ ] Hover states present and visually correct
- [ ] Focus ring visible on interactive elements
- [ ] No layout regressions (flex/grid alignment)
- [ ] `text-white` on primary buttons (not `text-on-primary`)
- [ ] Responsive behavior preserved

## 5. Build

```bash
wsl.exe bash -lc "source ~/.nvm/nvm.sh && cd ~/projects/finna-renewer && npm run build"
```

Fix any type or build errors before proceeding.

## 6. Commit

- Draft a concise commit message describing what was migrated.
- Commit directly to `main` and push.
