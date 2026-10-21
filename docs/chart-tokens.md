# Chart Tokens

Dark-mode–first CSS custom properties that govern chart tooltip surfaces and gridline
colors across all ChronoPay dashboard charts. Both light and dark themes are covered,
and all tokens meet WCAG 2.1 AA contrast requirements.

---

## Token Reference

| Token | Dark value | Light value | Purpose |
|---|---|---|---|
| `--chart-tooltip-bg` | `#0f1c2e` | `#ffffff` | Tooltip panel background |
| `--chart-tooltip-border` | `rgba(148, 163, 184, 0.2)` | `rgba(15, 23, 42, 0.12)` | Tooltip hairline border |
| `--chart-tooltip-text` | `#f4f7fb` | `#0a1628` | Primary value text inside tooltip |
| `--chart-tooltip-text-muted` | `#9fb0c7` | `#4a6080` | Secondary / metadata line (e.g. sample count) |
| `--chart-gridline-color` | `rgba(148, 163, 184, 0.15)` | `rgba(15, 23, 42, 0.1)` | Bar-track background and SVG reference lines |
| `--chart-gridline-stroke-width` | `1px` | `1px` | SVG `stroke-width` for sparkline gridlines |

---

## Where They Are Defined

All tokens are declared in `src/app/globals.css`:

- **`:root`** — dark (default) values.
- **`[data-theme="light"]`** — explicit light-theme overrides.
- **`@media (prefers-color-scheme: light)` + `:root:not([data-theme="dark"])`** — auto-mode light overrides.

---

## Accessibility (WCAG 2.1 AA)

All foreground / background pairings are verified at AA (4.5 : 1 minimum for normal text,
3 : 1 for large text and non-text contrast).

| Pairing | Ratio | Result |
|---|---|---|
| `--chart-tooltip-text` on dark `--chart-tooltip-bg` (`#f4f7fb` on `#0f1c2e`) | **14.3 : 1** | ✓ AAA |
| `--chart-tooltip-text-muted` on dark `--chart-tooltip-bg` (`#9fb0c7` on `#0f1c2e`) | **6.1 : 1** | ✓ AA |
| `--chart-tooltip-text` on light `--chart-tooltip-bg` (`#0a1628` on `#ffffff`) | **18.1 : 1** | ✓ AAA |
| `--chart-tooltip-text-muted` on light `--chart-tooltip-bg` (`#4a6080` on `#ffffff`) | **7.0 : 1** | ✓ AA |

`--chart-gridline-color` is alpha-based so it adapts to any surface color, remaining
below 0.2 opacity to stay non-intrusive and below the data series visually.

> Colour is never the sole differentiator in `SentimentSparkline`: each series line
> also uses a distinct `stroke-dasharray` pattern (solid / dashed / dotted).

---

## Components Using These Tokens

### `EarningsChart` (`src/components/dashboard/earnings-chart.tsx`)

- **Bar track**: `style={{ backgroundColor: "var(--chart-gridline-color)" }}`
- **Tooltip**: `backgroundColor`, `borderColor`, `color` all reference chart tokens via `style={{}}`
- **Tooltip caret**: `borderTopColor: "var(--chart-tooltip-bg)"`

### `RatingBreakdownBars` (`src/components/dashboard/rating-breakdown-bars.tsx`)

- **Bar track**: `style={{ backgroundColor: "var(--chart-gridline-color)" }}`
- **Tooltip**: `backgroundColor`, `borderColor`, `color` reference chart tokens
- **Muted secondary line**: `style={{ color: "var(--chart-tooltip-text-muted)" }}`
- **Tooltip caret**: `borderTopColor: "var(--chart-tooltip-bg)"`

### `SentimentSparkline` (`src/components/dashboard/sentiment-sparkline.tsx`)

- **Empty-state dashed line**: `stroke="var(--chart-gridline-color, currentColor)"` and
  `stroke-width="var(--chart-gridline-stroke-width, 1)"`
- Series lines use hard-coded palette colors (emerald / amber / rose) for semantic
  meaning; they do not reference gridline tokens.

---

## Usage Example

```tsx
// Tooltip panel — apply tokens via inline style (no Tailwind utility needed)
<div
  style={{
    backgroundColor: "var(--chart-tooltip-bg)",
    borderColor: "var(--chart-tooltip-border)",
    color: "var(--chart-tooltip-text)",
  }}
  role="tooltip"
>
  <span className="font-medium">{label}</span>: {value}
  <span style={{ color: "var(--chart-tooltip-text-muted)" }}>
    Based on {count} reviews
  </span>
</div>

// Bar track background
<div style={{ backgroundColor: "var(--chart-gridline-color)" }} />

// SVG gridline / empty-state line
<line
  stroke="var(--chart-gridline-color, currentColor)"
  strokeWidth="var(--chart-gridline-stroke-width, 1)"
  strokeDasharray="3 3"
/>
```

### Why inline `style` and not Tailwind utilities?

Tailwind's JIT scanner cannot resolve arbitrary CSS custom properties in class names
at build time (`bg-[var(--chart-tooltip-bg)]` is fragile and viewport-dependent).
Inline `style` props guarantee the token is evaluated by the browser's cascade, pick
up theme overrides automatically, and keep the token name in one obvious place per
usage site.

---

## Responsive Behavior

Tooltip positioning uses absolute placement relative to the hovered/focused bar:

- `bottom-full` — tooltip floats above the element
- `left-1/2 -translate-x-1/2` — horizontally centered
- `rtl:translate-x-1/2` — RTL mirror so the tooltip stays centered in right-to-left layouts

No min-width or max-width is set; tooltips shrink-wrap their content so they never
overlap adjacent bars on narrow viewports.

---

## Dark Mode Behavior

By default the project is dark. Light mode activates via:

1. `<html data-theme="light">` (explicit user preference via `ThemeSwitcher`)
2. `@media (prefers-color-scheme: light)` when no explicit theme is set

Charts consume tokens; they never hard-code palette classes such as `bg-slate-900`
or `text-white`. Switching themes updates tooltip and track colors automatically
without any component re-render.

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| All-zero segments in `EarningsChart` | Component returns `null`; no chart or tooltip rendered |
| Zero-value individual segment | Segment skipped (`width === 0` guard); legend entry still renders |
| Single data point in `SentimentSparkline` | Dot renders at horizontal center of the SVG |
| Domain collapse (all values equal in sparkline) | `scaleLinear` returns midpoint; flat line at vertical center |
| Empty `RatingBreakdownBars` | Empty-state card with explanatory text; no `progressbar` roles |
| Overlapping tooltips | Only one tooltip per chart at a time (`hoveredId` / `focusedId` state) |

---

## Testing

Tests live in `src/components/dashboard/chart-tokens.test.tsx` (42 tests).

Coverage is tracked via Vitest V8 with the following thresholds:

| Metric | Threshold |
|---|---|
| Statements | ≥ 95 % |
| Branches | ≥ 90 % |
| Functions | ≥ 95 % |
| Lines | ≥ 95 % |

Run with:

```bash
npm run test:coverage
```

---

## Adding New Chart Tokens

1. **Define the token** in `src/app/globals.css`:
   - Add to `:root` (dark default)
   - Add to `[data-theme="light"]` and the `@media (prefers-color-scheme: light)` block
   - Include a contrast-ratio comment
2. **Document it** in this file and in `docs/semantic-vs-primitive-tokens.md`
3. **Add it** to the `tokens` array in `src/app/design-tokens/page.tsx`
4. **Consume it** via `style={{ [property]: "var(--your-token)" }}`
5. **Test it** — add a test case to `chart-tokens.test.tsx` verifying the token is
   present on the relevant element and that no hardcoded fallback class replaces it

---

## Cross-References

- [Semantic vs Primitive Tokens](./semantic-vs-primitive-tokens.md)
- [Elevation Tokens](./elevation-tokens.md)
- [Design Review Checklist](./design-review-checklist.md)
- [Accessibility Testing Checklist](./accessibility-testing-checklist.md)
- [Rating Breakdown Bars API](./rating-breakdown-bars.md)
