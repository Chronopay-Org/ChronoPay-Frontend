# Review Sentiment Chip Filter

Design-system documentation for the `SentimentChipFilter` and `SentimentSparkline` components introduced in [#265](https://github.com/Chronopay-Org/ChronoPay-Frontend/issues/265).

---

## Overview

The sentiment chip filter lets buyers and sellers quickly triage reviews by sentiment bucket — **Positive**, **Mixed**, or **Critical** — with an **All** catch-all. A compact sparkline to the right communicates how each sentiment bucket has trended over the past N periods.

```
Filter  [All 74]  [▲ Positive 48]  [— Mixed 17]  [▼ Critical 9]  ╷ trend ╷ Pos/Mix/Crit
```

---

## Components

### `SentimentChipFilter`

**Location:** `src/components/dashboard/sentiment-chip-filter.tsx`

The primary consumer-facing component. Renders the chip row and, optionally, the sparkline + legend.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `counts` | `SentimentCounts` | required | Review counts per bucket (`positive`, `mixed`, `critical`). The `all` count is their sum. |
| `trendData` | `SentimentDataPoint[]` | required | Ordered (oldest → newest) time-series for the sparkline. Pass `[]` to hide the sparkline. |
| `onChange` | `(bucket: SentimentBucket) => void` | `undefined` | Callback fired when the active bucket changes. Use this to drive derived state in the parent (e.g. a filtered list). |
| `paramKey` | `string` | `"sentiment"` | URL search-param key used to persist the active bucket. Override when multiple filters coexist on the same page. |
| `className` | `string` | `""` | Extra Tailwind classes applied to the outer wrapper `div`. |

#### Types (from `src/components/dashboard/types.ts`)

```ts
type SentimentBucket = "all" | "positive" | "mixed" | "critical";

type SentimentCounts = {
  positive: number;
  mixed: number;
  critical: number;
};

type SentimentDataPoint = {
  period: string;   // ISO date string, e.g. "2026-07-20"
  positive: number;
  mixed: number;
  critical: number;
};
```

#### Basic usage

```tsx
import { Suspense } from "react";
import { SentimentChipFilter } from "@/components/dashboard/sentiment-chip-filter";

// Inside a "use client" component:
<Suspense fallback={null}>
  <SentimentChipFilter
    counts={{ positive: 48, mixed: 17, critical: 9 }}
    trendData={myTrendSeries}
    onChange={(bucket) => setActiveBucket(bucket)}
  />
</Suspense>
```

> **Suspense is required.** `SentimentChipFilter` calls `useSearchParams()` which must be wrapped in a Suspense boundary in the Next.js App Router.

#### Inside a `PanelShell`

Pass the component to the `action` prop to place it in the panel header:

```tsx
<PanelShell
  title="Reviews"
  action={
    <Suspense fallback={null}>
      <SentimentChipFilter
        counts={reviewSentimentCounts}
        trendData={reviewSentimentTrend}
        onChange={setActiveBucket}
      />
    </Suspense>
  }
>
  {/* filtered review list */}
</PanelShell>
```

See `src/components/dashboard/reviews-panel.tsx` for the full reference integration.

---

### `SentimentSparkline`

**Location:** `src/components/dashboard/sentiment-sparkline.tsx`

A standalone inline-SVG sparkline. No external chart library is required. Can be used independently of `SentimentChipFilter`.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `SentimentDataPoint[]` | required | Series data, oldest → newest. Pass `[]` to show the empty-state placeholder. |
| `width` | `number` | `96` | SVG width in px. |
| `height` | `number` | `32` | SVG height in px. |
| `series` | `Array<"positive" \| "mixed" \| "critical">` | all three | Which series lines to render. |
| `label` | `string` | auto-generated | Overrides the auto-generated `aria-label` and `<title>`. |
| `className` | `string` | `""` | Extra classes on the `<svg>` element. |

#### Empty state

When `data` is empty a dashed horizontal line is rendered as a low-signal placeholder. The SVG retains its `role="img"` and aria-label so screen readers understand the state.

```tsx
<SentimentSparkline data={[]} width={88} height={28} />
```

#### Standalone usage

```tsx
import { SentimentSparkline } from "@/components/dashboard/sentiment-sparkline";

<SentimentSparkline
  data={reviewSentimentTrend}
  width={120}
  height={36}
  label="8-week sentiment trend"
/>
```

---

## URL state

The active bucket is persisted to the `?sentiment=` search param via `router.replace` (no new history entry per click, so the back button is not polluted). The param is removed when the user returns to "all".

```
/dashboard                     → all (default)
/dashboard?sentiment=positive  → positive filter active
/dashboard?sentiment=mixed     → mixed filter active
/dashboard?sentiment=critical  → critical filter active
```

Invalid or unrecognised param values silently fall back to `"all"`.

When multiple `SentimentChipFilter` instances share a page, provide a unique `paramKey` for each:

```tsx
<SentimentChipFilter paramKey="buyer-sentiment" … />
<SentimentChipFilter paramKey="seller-sentiment" … />
```

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Group semantics | `<div role="group" aria-labelledby="…">` with a visible "Filter" label |
| Toggle state | `aria-pressed="true/false"` on each chip button |
| Keyboard navigation | `ArrowRight` / `ArrowDown` → next chip; `ArrowLeft` / `ArrowUp` → previous; `Home` → first; `End` → last; wraps at boundaries |
| Filter announcements | `<LiveRegion aria-live="polite">` announces the new bucket and count on every change (e.g. "Filtered to positive sentiment — 48 reviews") |
| Non-colour differentiation | Each chip carries a distinct icon (List / ThumbsUp / Minus / ThumbsDown); sparkline lines use both colour **and** stroke-dash patterns (solid / dashed / dotted) |
| Focus ring | `.focus-ring-cyan` utility — 2 px offset + 2 px cyan-300 ring, visible against all themed backgrounds |
| Image semantics | `SentimentSparkline` uses `role="img"`, `aria-label`, and `<title>` so screen readers describe it as an image rather than exposing raw SVG paths |
| RTL support | `dir="auto"` on the wrapper div; chip layout uses `flex-wrap` so it reflows correctly in right-to-left documents |
| Reduced motion | Framer Motion's `useReducedMotion` pattern is not applicable here (no animations); SVG rendering is static |

---

## Theming

The component uses the design-system CSS custom properties defined in `src/app/globals.css`. It works on both the default dark surface and the `[data-theme="light"]` light surface without any code changes.

### Sentiment colour palette

| Bucket | Active border | Active background | Text | Sparkline stroke |
|--------|--------------|-------------------|------|-----------------|
| All | `cyan-300/50` | `cyan-300/15` | `cyan-100` | — |
| Positive | `emerald-400/50` | `emerald-400/15` | `emerald-100` | `#34d399` (solid) |
| Mixed | `amber-400/50` | `amber-400/15` | `amber-100` | `#fbbf24` (dashed `4 2`) |
| Critical | `rose-400/50` | `rose-400/15` | `rose-100` | `#f87171` (dotted `1.5 2`) |

These align with the existing `Tone` system used by `StatusChip`, `SocialProofBadge`, and `MetricCard`.

---

## Responsive behaviour

| Breakpoint | Layout |
|------------|--------|
| `< sm` (< 640 px) | Chips wrap; sparkline drops to a second row stacked below the chips |
| `≥ sm` | Chips and sparkline sit in a single horizontal row, separated by a thin divider |

---

## Data wiring

Sample production-ready data is exported from `src/components/dashboard/dashboard-data.ts`:

```ts
import {
  reviewSentimentCounts,   // SentimentCounts
  reviewSentimentTrend,    // SentimentDataPoint[] — 8-week series
} from "@/components/dashboard/dashboard-data";
```

Replace these with real API data when the backend review endpoint is available.

---

## Testing

Both components have dedicated test files:

| File | Cases |
|------|-------|
| `src/components/dashboard/sentiment-chip-filter.test.tsx` | 50 + test cases — rendering, URL state, click, keyboard nav, announcements, edge cases, a11y attrs |
| `src/components/dashboard/sentiment-sparkline.test.tsx` | 30 + test cases — empty state, normal render, series filtering, SVG structure, edge cases (single point, domain collapse), accessibility |

Run with:

```bash
npm run test:unit
# or with coverage
npm run test:coverage
```

`next/navigation` is mocked via `vi.mock("next/navigation", …)` so no Next.js runtime is needed in the test environment.

---

## Design-review playground

Live swatches (dark surface, light surface, low-signal empty state) and a standalone sparkline showcase are available at:

```
/design-review
```

Scroll to the **Sentiment Chip Filter** section.

---

## Related

- `src/app/components/ui/status-chip.tsx` — base chip pattern this component follows
- `src/components/dashboard/panel-shell.tsx` — host panel; the `action` prop is the injection point
- `src/components/common/LiveRegion.tsx` — reusable polite announcement utility
- `docs/design-review-checklist.md` — general WCAG / responsive checklist
- `docs/empty-state-guidelines.md` — low-signal empty-state patterns
