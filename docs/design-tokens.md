# Design Tokens

This guide is the canonical reference for the design tokens defined in `src/app/globals.css`. Use these values for new components unless a product-specific exception is documented.

## Token principles

- Prefer semantic CSS variables over raw hex values or magic numbers.
- Use the smallest token that conveys the correct hierarchy and state.
- Preserve accessibility: text and controls must keep a minimum WCAG 2.1 AA contrast ratio.
- Support both dark and light themes with the same intent and a clear fallback path.

## Color

| Token | Value (dark) | Value (light) | Usage |
| --- | --- | --- | --- |
| `--background` | `#07111f` | `#f0f5fb` | App background |
| `--foreground` | `#f4f7fb` | `#0a1628` | Primary text |
| `--surface` | `rgba(11, 23, 40, 0.82)` | `rgba(255, 255, 255, 0.88)` | Default cards |
| `--surface-strong` | `rgba(10, 20, 36, 0.96)` | `rgba(255, 255, 255, 0.98)` | Elevated panels |
| `--border-subtle` | `rgba(148, 163, 184, 0.14)` | `rgba(15, 23, 42, 0.10)` | Dividers and subtle borders |
| `--border-strong` | `rgba(125, 211, 252, 0.22)` | `rgba(8, 145, 178, 0.28)` | Accent borders |
| `--accent` | `#6ee7f9` | `#0891b2` | Primary actions |
| `--accent-strong` | `#22d3ee` | `#06b6d4` | Hover and active states |
| `--success` | `#34d399` | `#059669` | Success states |
| `--danger` | `#f87171` | `#dc2626` | Error states |
| `--muted` | `#9fb0c7` | `#4a6080` | Secondary text |

### Color do/don't

- Do use semantic tokens such as `var(--accent)` and `var(--surface)` so theme changes remain consistent.
- Do ensure semantic contrast is checked on both dark and light themes.
- Don't hard-code `#fff` or `#0f172a` inside product components when a token already exists.
- Don't use color alone to represent meaning when an icon, label, or status text can add clarity.

## Space

| Token | Value | Usage |
| --- | --- | --- |
| `--space-1` | `0.25rem` | Micro spacing |
| `--space-2` | `0.5rem` | Tight component gaps |
| `--space-3` | `0.75rem` | Compact UI gaps |
| `--space-4` | `1rem` | Standard spacing |
| `--space-5` | `1.25rem` | Card element padding |
| `--space-6` | `1.5rem` | Section detail spacing |
| `--space-8` | `2rem` | Group separation |
| `--space-10` | `2.5rem` | Major layout padding |
| `--space-12` | `3rem` | Large sections |
| `--space-16` | `4rem` | Hero and shell spacing |

### Space do/don't

- Do use the spacing scale to preserve rhythm across cards, rows, and modals.
- Do align stacked content to the nearest token rather than adding arbitrary offsets.
- Don't mix 12px, 14px, and 18px values in the same layout when a token already applies.
- Don't rely on padding values to hide layout shifts or inconsistent spacing.

## Radius

| Token | Value | Usage |
| --- | --- | --- |
| `--radius-xs` | `8px` | Small controls |
| `--radius-sm` | `12px` | Buttons and compact cards |
| `--radius-md` | `24px` | Default card radius |
| `--radius-lg` | `28px` | Panel surfaces |
| `--radius-xl` | `32px` | Elevated surface radius |

### Radius do/don't

- Do keep corners consistent within the same component family.
- Do use `--radius-md` for dense card surfaces and `--radius-xl` for glass or modal treatment.
- Don't create a custom radius when the component is a standard card, panel, or sheet.
- Don't mix large radii and thin borders in a way that reduces perceived hierarchy.

## Motion

| Token | Value | Usage |
| --- | --- | --- |
| `--motion-duration-fast` | `150ms` | Button hover and micro interactions |
| `--motion-duration-base` | `200ms` | Standard state transitions |
| `--motion-duration-slow` | `320ms` | Layer and panel transitions |
| `--motion-ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | Most UI transitions |
| `--motion-ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Confirmations and directional motion |

### Motion do/don't

- Do respect `prefers-reduced-motion: reduce` when implementing animation.
- Do keep movement subtle and directional to reinforce focus and hierarchy.
- Don't animate layout-heavy properties on every state change when a fade or transform is enough.
- Don't create decorative motion that competes with reading or form completion.

## Typography

| Token | Value | Usage |
| --- | --- | --- |
| `--font-size-xs` | `0.75rem` | Metadata and labels |
| `--font-size-sm` | `0.875rem` | Secondary text |
| `--font-size-md` | `1rem` | Base body copy |
| `--font-size-lg` | `1.125rem` | Supporting headings |
| `--font-size-xl` | `1.5rem` | Section headings |
| `--font-size-2xl` | `2rem` | Prominent headings |
| `--font-weight-regular` | `400` | Body copy |
| `--font-weight-medium` | `500` | Labels and controls |
| `--font-weight-semibold` | `600` | Strong labels |
| `--font-weight-bold` | `700` | Heading emphasis |
| `--line-height-body` | `1.5` | Default reading rhythm |
| `--line-height-tight` | `1.25` | Dense and compact labels |
| `--line-height-loose` | `1.75` | Spacious display content |

### Typography do/don't

- Do keep type scale consistent across cards, tables, and navigation.
- Do use semantic text sizes for labels, body, and headings instead of ad hoc pixel values.
- Don't skip heading levels or mix multiple font weights to imply arbitrary meaning.
- Don't use low-contrast text on accent surfaces without verifying readability.

## Usage examples

```css
.card {
  border-radius: var(--radius-md);
  padding: var(--space-5);
  background: var(--surface);
  box-shadow: var(--elevation-1);
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard);
}

.button-primary {
  background: var(--accent);
  color: var(--foreground);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  font-weight: var(--font-weight-semibold);
}
```

## Related documentation

- [Design Review Checklist](./design-review-checklist.md)
- [Semantic vs Primitive Tokens](./semantic-vs-primitive-tokens.md)
- [Chart Tokens](./chart-tokens.md)
- [Elevation Tokens](./elevation-tokens.md)

## Implementation note

The CSS variables in `src/app/globals.css` are the source of truth. This document is meant to make those values discoverable and reviewable during implementation and design QA.
