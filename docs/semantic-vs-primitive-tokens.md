# Semantic vs Primitive Tokens

## Overview

This document maps ChronoPay semantic design tokens to their primitive values across themes. It includes an interactive viewer component (`<SemanticTokenMap />`) that engineers can reference when picking the right token level for a new component.

**Component location:** `src/app/components/semantic-token-map.tsx`
**Design system page:** `/design-system/tokens`

## Why Two Levels?

- **Semantic tokens** describe intent (`--background`, `--accent`, `--danger`).
- **Primitive values** are the actual raw colors, distances, or timing values (`#07111f`, `24px`).

Using the semantic layer keeps the app themeable. When you need to inspect the real value for a given theme, this viewer shows the mapping side-by-side.

## How to Read the Viewer

The viewer presents every token as a row with **side-by-side dark and light swatches** so engineers can compare how a single semantic token resolves across themes at a glance.

| Column | Meaning |
|---|---|
| **Semantic Token** | CSS custom property name. Copy this into `var(--token)`. Sticky on horizontal scroll. |
| **Dark Swatch + Value** | Visual preview and raw primitive value for the dark theme. Highlighted when Dark is selected. |
| **Light Swatch + Value** | Visual preview and raw primitive value for the light theme. Highlighted when Light is selected. |
| **Category** | Grouping: `color`, `typography`, `layout`, `shell`. |
| **Description** | Where the token is typically consumed. |
| **Actions** | Copy semantic name to clipboard. |

## Filtering & Themes

- **Theme toggle:** `Dark` (default), `Light`, and `Auto` (following `prefers-color-scheme`). The selected theme's values are emphasized; the other theme's values appear muted.
- **Category filter:** Filter by `color`, `typography`, `layout`, or `shell`.
- **Copy affordance:** Each row has a Copy button that copies the semantic token name (e.g. `--accent`).

## Accessibility Notes

- The viewer uses a `<table>` element with `scope="col"` for headers and `role="region"` for the mapping region.
- Screen readers announce theme changes via `role="status"` with `aria-live="polite"`.
- Focus-visible rings follow the existing `focus-ring-cyan` utility.
- Reduced motion is respected (no motion is introduced by this component).
- The table includes `dir="ltr"` for explicit RTL compatibility.
- All decorative swatches are marked `aria-hidden="true"`.

## Responsive Behavior

- The table uses horizontal scroll on narrow viewports while keeping the first column (`semantic`) sticky via `position: sticky` and a backdrop blur.
- Category filter and theme toggle wrap naturally on mobile.
- Minimum table width is `720px` to prevent column collapse.

## Token List

### Color

| Semantic Token | Dark Value | Light Value | Notes |
|---|---|---|---|
| `--background` | `#07111f` | `#f0f5fb` | Page background |
| `--foreground` | `#f4f7fb` | `#0a1628` | Primary text |
| `--surface` | `rgba(11, 23, 40, 0.82)` | `rgba(255, 255, 255, 0.88)` | Card background |
| `--surface-strong` | `rgba(10, 20, 36, 0.96)` | `rgba(255, 255, 255, 0.98)` | Elevated surface |
| `--border-subtle` | `rgba(148, 163, 184, 0.14)` | `rgba(15, 23, 42, 0.10)` | Default border |
| `--border-strong` | `rgba(125, 211, 252, 0.22)` | `rgba(8, 145, 178, 0.28)` | Accent border |
| `--accent` | `#6ee7f9` | `#0891b2` | Primary accent |
| `--accent-strong` | `#22d3ee` | `#06b6d4` | Strong accent |
| `--accent-warm` | `#f59e0b` | `#d97706` | Warm accent |
| `--success` | `#34d399` | `#059669` | Success state |
| `--danger` | `#f87171` | `#dc2626` | Error state |
| `--muted` | `#9fb0c7` | `#4a6080` | Muted / disabled text |

### Typography / Helper Text

| Semantic Token | Dark Value | Light Value | Notes |
|---|---|---|---|
| `--helper-text-color` | `rgb(203 213 225)` | `rgb(30 58 138)` | Default helper text |
| `--helper-text-color-muted` | `rgb(148 163 184)` | `rgb(71 85 105)` | Quiet helper text |
| `--helper-text-color-emphasis` | `rgb(207 250 254 / 0.8)` | `rgb(8 145 178 / 0.9)` | Emphasized helper text |

### Layout / Radius

| Semantic Token | Dark Value | Light Value | Notes |
|---|---|---|---|
| `--radius-md` | `24px` | `24px` | Default card radius |
| `--radius-lg` | `28px` | `28px` | Panel radius |
| `--radius-xl` | `32px` | `32px` | Elevated surface radius |

### Shell

| Semantic Token | Dark Value | Light Value | Notes |
|---|---|---|---|
| `--shell-header-bg` | `rgba(7, 17, 31, 0.4)` | `rgba(240, 245, 251, 0.75)` | Header background |
| `--shell-text` | `#f4f7fb` | `#0a1628` | Shell primary text |
| `--shell-text-muted` | `#9fb0c7` | `#4a6080` | Shell secondary text |

## Cross-References

- [Copy Button Standard](./copy-button-standard.md)
- [Overlay & Modal Checklist](./overlay-checklist.md)
- [Design Review Checklist](./design-review-checklist.md)
- [Toast Feedback System](./toast-feedback-system.md)

## References

- CSS Custom Properties: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables
- Tailwind v4 Theme: https://tailwindcss.com/docs/theme
- WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/