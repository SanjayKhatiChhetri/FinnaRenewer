# Design System

Blend of Notion's pastel warmth and Cohere's typographic clarity.
Tokens are defined in `src/app/globals.css` via Tailwind v4 `@theme`.

---

## Typography

| Role    | Font           | Usage                                     |
| ------- | -------------- | ----------------------------------------- |
| Display | Space Grotesk  | Hero headings, page titles, card titles   |
| Body    | Inter          | Paragraphs, labels, descriptions, UI text |
| Mono    | JetBrains Mono | Code snippets, technical values           |

### Scale

| Token             | Size | Use                          |
| ----------------- | ---- | ---------------------------- |
| `text-display-xl` | 56px | Hero headline                |
| `text-display-lg` | 48px | h1 base                      |
| `text-display`    | 36px | h2 base                      |
| `text-heading-1`  | 28px | h3 base                      |
| `text-heading-2`  | 24px | h4 base                      |
| `text-heading-3`  | 20px | h5, card titles              |
| `text-body-lg`    | 18px | Lead paragraphs              |
| `text-body`       | 16px | Default body                 |
| `text-body-sm`    | 14px | Secondary text, descriptions |
| `text-caption`    | 13px | Labels, badges, metadata     |
| `text-micro`      | 12px | Fine print                   |

Display headings use `letter-spacing: -0.02em` and `font-weight: 500`.

---

## Color palette

### Brand

| Token           | Hex     | Usage                                  |
| --------------- | ------- | -------------------------------------- |
| `primary`       | #5645d4 | Buttons, links, active states          |
| `primary-hover` | #4534b3 | Button hover                           |
| `primary-deep`  | #3a2a99 | Emphasized text on primary backgrounds |
| `primary-soft`  | #e6e0f5 | Selection highlight, light badges      |
| `on-primary`    | #ffffff | Text on primary backgrounds            |

### Surfaces (Notion warm whites)

| Token            | Hex     | Usage                      |
| ---------------- | ------- | -------------------------- |
| `canvas`         | #ffffff | Page background            |
| `surface`        | #f6f5f4 | Card backgrounds, sections |
| `surface-soft`   | #fafaf9 | Body background            |
| `surface-raised` | #ffffff | Elevated cards             |

### Text (warm charcoals, not pure black)

| Token      | Hex     | Usage               |
| ---------- | ------- | ------------------- |
| `ink`      | #1a1a1a | Headings            |
| `charcoal` | #37352f | Body text (default) |
| `slate`    | #5d5b54 | Secondary text      |
| `steel`    | #787671 | Tertiary text       |
| `stone`    | #a4a097 | Disabled text       |
| `muted`    | #bbb8b1 | Placeholder text    |

### Pastel tints (Notion-inspired feature cards)

| Token           | Hex     | Usage              |
| --------------- | ------- | ------------------ |
| `tint-peach`    | #ffe8d4 | Warm highlight     |
| `tint-rose`     | #fde0ec | Error-soft cards   |
| `tint-mint`     | #d9f3e1 | Success-soft cards |
| `tint-lavender` | #e6e0f5 | Primary-soft cards |
| `tint-sky`      | #dcecfa | Info-soft cards    |
| `tint-yellow`   | #fef7d6 | Warning-soft cards |
| `tint-cream`    | #f8f5e8 | Neutral highlight  |

### Semantic

| Token     | Hex     | Usage                        |
| --------- | ------- | ---------------------------- |
| `success` | #1aae39 | Confirmed, renewed           |
| `warning` | #dd5b00 | Due soon                     |
| `error`   | #e03131 | Failed, overdue              |
| `info`    | #5865f2 | Informational (Discord blue) |

---

## Components

### Button (`src/components/ui/button.tsx`)

Variants via CVA:

- **primary**: Purple pill, white text. Main CTA.
- **secondary**: Outlined, rounded-md. Secondary actions.
- **ghost**: No background, hover tint. Tertiary actions.
- **danger**: Red pill. Destructive actions.
- **link**: Text-only, underline on hover.

Sizes: `sm` (32px), `md` (40px), `lg` (48px), `icon` (40x40).

### Card (`src/components/ui/card.tsx`)

Variants:

- **base**: White + border. Default container.
- **elevated**: White + shadow. Lifted sections.
- **flat**: Surface background. Recessed areas.
- **Pastel tints**: `peach`, `rose`, `mint`, `lavender`, `sky`, `yellow`. Feature highlights.

Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

### Input (`src/components/ui/input.tsx`)

44px height, full-width, with label and error state. Focus ring uses `primary` color.

### Badge (`src/components/ui/badge.tsx`)

Inline status indicators. Variants: `default`, `success`, `warning`, `error`, `info`, `purple`, `pill`.

### Toggle (`src/components/ui/toggle.tsx`)

Switch with label + description. Hidden `<input>` for form submission compatibility.

---

## Design principles

1. **Warm, not cold**: Notion-style warm grays (#37352f) instead of pure gray (#333). Surfaces have a slight warmth.
2. **Flat elevation**: Minimal shadows. Use color (pastels) and borders for hierarchy, not drop shadows.
3. **Pill CTAs**: Primary buttons are fully rounded (pill shape). Secondary buttons use rounded-md.
4. **Pastel semantics**: Feature cards use pastel tints to convey meaning (mint = success, sky = info, lavender = brand).
5. **Typography hierarchy**: Display font (Space Grotesk) for headings creates visual contrast with body font (Inter).
