# Design System — "Reading Room"

An editorial, literary system: ink-on-paper warmth, a serif display voice,
and one committed garnet accent (a book spine / library stamp). Gold is
reserved for earned delight. Ships a full **dual theme** — Reading Room
(light) and Dusk (dark).

Tokens live in `src/app/globals.css`. Runtime CSS vars are declared under
`:root` (light) and `.dark` (Dusk); `@theme inline` binds the Tailwind color
utilities to them, so every `bg-primary` / `text-ink` class re-themes for
free. Dark mode is class-based via `next-themes` (`@custom-variant dark`).

> **Theme-aware foreground rule.** A single hue can't read on both a light
> and a dark surface. The `*-deep` tokens (`primary-deep`, `success-deep`,
> `warning-deep`, `error-deep`, `info-deep`) **flip per theme** — a deep
> shade in light, a light shade in Dusk — so colored *text/icons on a soft
> or tinted background* always pass contrast. Use `*-deep` for foreground on
> tints; use the base color only as a fill or as foreground on the canvas.

---

## Typography

Paired on a contrast axis: a serif display against a sans body.

| Role    | Font           | Usage                                       |
| ------- | -------------- | ------------------------------------------- |
| Display | **Fraunces**   | Headings, page titles, hero, card titles    |
| Body    | Inter          | Paragraphs, labels, descriptions, UI, data  |
| Mono    | JetBrains Mono | Barcodes, usernames, technical values       |

Loaded via `next/font/google` in `src/app/layout.tsx` (Fraunces with
`opsz` + `SOFT` axes, `font-optical-sizing: auto`). Fixed rem scale
(`display-xl 56` → `micro 12`); headings weight 480, `letter-spacing
-0.02em` (h1 −0.025em), line-height 1.1. Use `text-balance` on headings,
`text-pretty` on long prose.

---

## Color

Strategy: **committed accent on a restrained paper/ink base.** Garnet
carries primary actions, current selection, and status accents (≤10–15% of
any surface). Warmth comes from type, accent, and illustration — never from
a cream body background.

All values are OKLCH. Representative light-theme anchors:

| Role          | Token                          | Light (OKLCH)            |
| ------------- | ------------------------------ | ------------------------ |
| Brand fill    | `primary`                      | `0.47 0.16 24` (garnet)  |
| Brand fg      | `primary-deep`                 | `0.36 0.14 24`           |
| Brand wash    | `primary-soft`                 | `0.93 0.042 26`          |
| Accent        | `accent` / `accent-soft`       | `0.66 0.11 72` (gold)    |
| Canvas        | `canvas`                       | `0.992 0.003 80`         |
| App bg        | `surface-soft`                 | `0.975 0.004 80`         |
| Headings      | `ink`                          | `0.22 0.01 55`           |
| Body          | `charcoal`                     | `0.30 0.012 50`          |
| Meta          | `slate` / `steel` / `stone`    | `0.46 / 0.51 / 0.62`     |
| Hairline      | `hairline(-soft/-strong)`      | `0.90 0.006 75`          |

Dusk re-declares every token (deep warm-charcoal canvas, lifted garnet,
glowing surfaces). Semantic roles — `success` (sage), `warning` (ochre),
`error` (scarlet), `info` (ink-blue) — each ship `-soft` (tint) and `-deep`
(theme-flipping foreground). Editorial **tints** (`tint-peach/rose/mint/
lavender/sky/yellow/cream`) keep their names for the `Card` API but are
recolored to muted paper/ink washes that invert sensibly in Dusk.

**Contrast (verified, both themes):** body ≥12.8:1, meta `steel` ≥4.5:1,
badges 6.1–8.9:1, primary buttons ≥6.9:1, accent text (`primary-deep`)
≥11:1. All ≥ WCAG AA.

---

## Motion

Powered by **`motion`** (Framer Motion, `motion/react`); shared variants in
`src/lib/motion.ts` mirror the CSS ease tokens. Every animation is gated on
`useReducedMotion` / the global `prefers-reduced-motion` block.

- **Page transitions** — route-group `template.tsx` → `PageTransition`
  (fade + 8px rise, 0.4s).
- **Nav** — active indicator slides via shared `layoutId` (sidebar + mobile).
- **Lists** — staggered reveal (`staggerContainer`/`staggerItem`), plus the
  CSS `.stagger` utility for server-rendered lists.
- **Stats** — `AnimatedNumber` counts up on scroll-into-view.
- **Landing** — scroll-reveal sections (`whileInView`, once).
- **Theme toggle** — sun/moon crossfade-rotate.
- Curves: ease-out only (quart/quint/expo). No bounce, no elastic.

---

## Components (`src/components/ui/`)

- **Button** — `primary` (garnet pill), `secondary` (outlined pill), `ghost`,
  `accent` (gold), `danger`, `link`. Sizes `sm/md/lg/icon`. `text-on-primary`
  on fills.
- **Card** — `base` / `elevated` / `flat` + editorial tints
  (`peach/rose/mint/lavender/sky/yellow`). Sub-parts: Header/Title/
  Description/Content/Footer.
- **Input** — 44px, label + error state, primary focus ring.
- **Badge** — `default/success/warning/error/info/purple/pill`; semantic
  variants use `*-deep` text on `*-soft` fills.
- **Toggle** — switch with label/description, hidden input for forms.
- **ThemeToggle** — light/Dusk switch (mounted-guarded for SSR).
- **Tabs** — `layoutId` pill indicator, optional count badges (used on
  Account: Holds / Fines).
- **AnimatedNumber**, **PageTransition**, **Skeleton / LoanRowSkeleton**.

## Illustrations (`src/components/shared/illustrations.tsx`)

Token-driven inline SVG (auto-theming): `ExLibris` (brand mark),
`BookshelfIllustration`, `ReadingRoomScene` (landing hero),
`AllCaughtUpIllustration`, `QuietShelfIllustration`, `OfflineIllustration`,
`SuccessSeal`, and onboarding spots (`SpotLinkCard` / `SpotWatchDates` /
`SpotAutoRenew`). Icons: lucide-react only.

---

## Principles

1. **Confirm safety at a glance** — status color + due-date hierarchy first.
2. **Editorial warmth from type & accent**, not a tinted body background.
3. **Delight at earned moments** (renewal success, empty shelves, first run).
4. **One vocabulary everywhere** — same loan-card anatomy, badge meanings,
   button shapes on every screen, in both themes.
5. **`*-deep` for foreground on tints** — the rule that keeps colored text
   legible across light and Dusk.
