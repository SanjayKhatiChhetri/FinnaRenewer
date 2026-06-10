# Design

Visual system captured from `src/app/globals.css` (@theme tokens) and `src/components/ui/*`. Tailwind v4; tokens are the single source of truth — never hard-code values that exist here.

## Theme

Light, warm-neutral product UI. White canvas (`#ffffff`) over a soft warm surface (`#fafaf9`), Notion-style pastel tints for feature/stat surfaces, one purple brand accent. No dark mode (yet).

## Color

| Role | Token | Value |
|---|---|---|
| Brand / primary actions | `--color-primary` | `#5645d4` |
| Primary hover | `--color-primary-hover` | `#4534b3` |
| Primary tint | `--color-primary-soft` | `#e6e0f5` |
| Canvas (cards) | `--color-canvas` | `#ffffff` |
| App background | `--color-surface-soft` | `#fafaf9` |
| Recessed surface | `--color-surface` | `#f6f5f4` |
| Ink (headings) | `--color-ink` | `#1a1a1a` |
| Body text | `--color-charcoal` | `#37352f` |
| Secondary text | `--color-slate` | `#5d5b54` |
| Tertiary/meta | `--color-steel` | `#787671` |
| Borders | `--color-hairline` | `#e5e3df` |
| Success | `--color-success` | `#1aae39` |
| Warning | `--color-warning` | `#dd5b00` |
| Error | `--color-error` | `#e03131` |

Pastel tints (`--color-tint-{peach,rose,mint,lavender,sky,yellow,cream}`) carry stat cards, feature cards, and status banners. Accent stays ≤10% of any screen (restrained strategy); status colors mean the same thing everywhere (success=safe, warning=due soon, error=overdue).

## Typography

- **Display** (`--font-display`): Space Grotesk — headings, page titles. Geometric character carries the bookish-friendly voice.
- **Body** (`--font-body`): Inter — UI text, labels, data.
- **Mono** (`--font-mono`): JetBrains Mono — usernames, barcodes.

Fixed rem scale (product register): `display-xl 3.5rem → display-lg 3rem → display 2.25rem → heading-1 1.75rem → heading-2 1.5rem → heading-3 1.25rem → body-lg 1.125rem → body 1rem → body-sm .875rem → caption .8125rem → micro .75rem`. Headings: weight 500, letter-spacing −0.02 to −0.03em, line-height 1.2. Body line-height 1.55.

## Spacing & Shape

Tailwind built-in scale for padding/margin/gap. Radii: `xs 4 / sm 6 / md 8 / lg 12 / xl 16 / 2xl 20 / pill`. Cards use `lg`; buttons are pill (primary/danger) or `md` (secondary/ghost). Shadows `xs→xl` are soft Notion-style elevation; cards rest at none/`xs`, lift to `md` on hover.

## Motion

Tokens: `--ease-out-quart/quint/expo`. No bounce/elastic, ever.

- Feedback (press, toggle): 100–150ms. Buttons: `active:scale-[0.97]`, hover shadow-lift.
- State changes (hover, reveal): 200ms, `ease-out-quart`.
- Entrances: `.animate-fade-up` (500ms quint) + `.stagger` (`--i` index, 45ms/item, capped ~500ms total) for lists; `.animate-scale-in` (180ms) for inline feedback.
- Skeletons: `.skeleton` shimmer, not spinners-in-content.
- Global `prefers-reduced-motion: reduce` collapses all motion. Required on any new animation.

## Components

`src/components/ui/`: Button (primary/secondary/ghost/danger/link × sm/md/lg/icon), Card (base/elevated/flat + pastel variants × padding none/sm/md/lg), Badge (semantic variants), Input, Toggle. Icons: lucide-react only, 3.5–5 h/w sizes, stroke style — no mixed icon families.

Loan-card anatomy (the product's signature row): cover image left, status dot + title, badge with days-left, metadata row (icons + micro text), dates + inline Renew action. Reuse this anatomy for any loan-like list.

## Layout

App shell: fixed sidebar nav (240px, `surface` bg) + scrollable content column (max-w ~3xl, generous top padding). Mobile: nav collapses to bottom/hamburger pattern. Stat rows: 3-col grid. Z-index scale: `--z-dropdown 10 → sticky 20 → modal-backdrop 30 → modal 40 → toast 50 → tooltip 60` — never arbitrary values.
