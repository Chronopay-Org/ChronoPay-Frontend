# Rating Breakdown Bars

## Overview

The `RatingBreakdownBars` component renders a stacked list of per-criterion
average ratings with proportional horizontal bars. Each row shows the criterion
label, a numeric average (1–5 scale), and a bar whose fill width reflects the
average. Hovering or focusing a bar reveals a tooltip disclosing the sample size
(review count) used to compute that criterion's average.

## When to use

- On the **supplier profile** to show how a supplier scores across dimensions
  like Communication, Expertise, Timeliness, Value, and Clarity.
- In any **review summary** where a single star average is not granular enough.

## Visual design

| Aspect          | Guideline                                                                      |
| --------------- | ------------------------------------------------------------------------------ |
| Bar colours     | Sequential palette from `bg-teal-400` → `bg-cyan-400` → `bg-sky-400` → `bg-blue-400` → `bg-indigo-400` |
| Track           | `bg-slate-800/50` dark, `bg-slate-200/60` light                               |
| Bar height      | 16px (`h-4`), full-width rounded-full                                         |
| Gap between rows| `gap-2.5` (10px)                                                               |
| Label width     | `w-[7ch]` — enough for short criterion names, truncates with ellipsis         |
| Score width     | `w-[3ch]` — right-aligned, tabular-nums                                       |
| Tooltip         | Follows the EarningsChart tooltip pattern — dark bg, sharp arrow, fade-in     |

## Accessibility (WCAG 2.1 AA)

- Each bar is a `role="progressbar"` with `aria-valuenow`, `aria-valuemin=1`,
  `aria-valuemax=5`, and a descriptive `aria-label` that includes the score
  **and** the review count.
- Hover/focus interaction: each bar is keyboard-focusable (`tabIndex={0}`).
  The tooltip appears on both hover and focus, and can be dismissed with the
  `Escape` key.
- Dimming: other rows dim to `opacity-40` when one is active — this provides a
  non-colour-only visual distinction. Screen-reader users are unaffected because
  the `aria-label` stays unchanged.
- Overall stat: the heading and the overall score value are linked via
  `aria-labelledby` so assistive technology can associate them.
- Empty state: when `criteria` is `[]`, a descriptive text block is rendered
  instead of an empty list.

## Responsive

- Each row uses flexbox with a fixed label width (`w-[7ch]`) and a flexible
  bar (`flex-1 min-w-0`), so the bar fills available horizontal space.
- RTL: the bar and tooltip positions adapt automatically via Tailwind's
  `rtl:` variants.
- Density: inherits the surrounding container's padding and spacing.

## Dark mode / Light mode

- The track uses `bg-slate-800/50 dark:bg-slate-800/50 bg-slate-200/60` so it
  switches between dark and light backgrounds automatically.
- Bar colours are solid `bg-*-400` classes that work equally well on both
  backgrounds (tested contrast ratios > 3:1 against track).

## Example usage

```tsx
import { RatingBreakdownBars } from "@/components/dashboard";
import { ratingBreakdown } from "@/components/dashboard/dashboard-data";

<PanelShell title="Rating Breakdown">
  <RatingBreakdownBars
    criteria={ratingBreakdown}
    overallRating={4.6}
    overallCount={42}
  />
</PanelShell>
```

## Edge cases covered

| Case                  | Behaviour                                                              |
| --------------------- | ---------------------------------------------------------------------- |
| Empty `criteria`      | Shows "No rating data available yet" placeholder                      |
| Single criterion      | One bar at full width; tooltip uses singular "1 review"              |
| Single review         | Tooltip says "Based on 1 review" (not "1 reviews")                   |
| Zero-value average    | Bar width is 0% (hidden bar), but label and score still render        |
| Many criteria (> 5)   | Bars continue vertically; labels wrap naturally                       |
| Keyboard focus chain  | Tab through bars, Escape dismisses tooltip                            |
| Reduced motion        | Transition animations are skipped (motion-reduce:reduce)             |
| RTL direction         | Bar fills from right; tooltip arrow correctly centred                 |

## Implementation notes

- Reuses the same tooltip and dimming patterns as `EarningsChart` for visual
  consistency.
- Colour palette is sequential (teal → indigo), creating a natural visual
  hierarchy without relying on colour alone.
- The component is self-contained with no external dependencies beyond
  `clsx` and React.
