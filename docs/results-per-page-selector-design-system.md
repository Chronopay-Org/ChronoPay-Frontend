# Results-Per-Page Selector — Design System Documentation

> **Component:** `ResultsPerPageSelector` + `usePageSize`
> **Path:** `src/components/marketplace/results-per-page-selector.tsx`
> **Closest cousins:** `MapViewToggle` (segmented control pattern), `SentimentChipFilter` (URL-state pattern), `useMapView` (localStorage pattern)
> **Status:** WCAG 2.1 AA passed ✓

## Overview

The **Results-Per-Page Selector** is a segmented control placed at the
bottom of the marketplace search results that lets buyers tune how many
suppliers are shown per page (12 / 24 / 48 by default). It exists so that:

- Power users can scan more cards per page without infinite-scrolling.
- Mobile users can opt-in to a smaller card count to reduce scroll fatigue.
- The choice **survives navigation** (URL-deep-linkable) **and** sessions
  (per-user via `localStorage`), so a buyer on a desktop + a tablet sees
  the same density.

The selector is implementation-agnostic about **how** the page is rendered.
It exposes `value` + `setValue` so the same driver powers today’s
slice-the-catalogue rendering and any future pagination *or* infinite-scroll
variant — both flows consume the same `usePageSize()` hook and therefore
**stay in sync by construction**.

## Files

| File | Purpose |
|---|---|
| `src/components/marketplace/results-per-page-selector.tsx` | Component + `usePageSize` hook |
| `src/components/marketplace/index.ts` | Barrel export for the marketplace module |
| `src/__tests__/results-per-page-selector.test.tsx` | Vitest specs (≥95 % coverage) |
| `docs/results-per-page-selector-design-system.md` | This document |

## API

### `usePageSize()`

```ts
import { usePageSize } from "@/components/marketplace/results-per-page-selector";

const { value, setValue, options } = usePageSize();
```

| Option | Type | Default | Description |
|---|---|---|---|
| `options` | `readonly number[]` | `[12, 24, 48]` | Allowed page sizes |
| `defaultValue` | `number` | `24` | Fallback when nothing else is set |
| `storageKey` | `string` | `"chronopay-marketplace-page-size"` | `localStorage` key |
| `paramKey` | `string` | `"page-size"` | URL search-param key |

| Return | Type | Description |
|---|---|---|
| `value` | `number` | The current effective page size |
| `setValue` | `(n: number) => void` | Persists to `localStorage` and updates the URL |
| `options` | `readonly number[]` | Echo back of the configured options |

#### Source-of-truth precedence (mount → render)

On the very first render the hook reads, in order:

1. **URL search-param** (e.g. `?page-size=24`) — supports deep links,
   social sharing, and back-button updates from any prior visit.
2. **`localStorage`** — falls back to the buyer’s last choice when the URL
   has no param.
3. **`defaultValue`** — the middle of `options` by convention (`24`).

After mount, the URL is treated as the live source of truth. If the URL
changes via `router.replace()` or the back button, the hook re-renders
with the new value. `localStorage` is written **on every** `setValue` so
that the next visit *without* a URL param still gets the same size.

### `<ResultsPerPageSelector />`

```tsx
import {
  ResultsPerPageSelector,
  usePageSize,
} from "@/components/marketplace/results-per-page-selector";

function MarketplaceResults(props) {
  const { value, setValue } = usePageSize();
  const visible = props.items.slice(0, value);

  return (
    <>
      <ul>{visible.map(/* … */)}</ul>
      <Suspense fallback={null}>
        <ResultsPerPageSelector
          value={value}
          onChange={setValue}
          totalCount={props.items.length}
        />
      </Suspense>
    </>
  );
}
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | required | Currently selected page size (controlled) |
| `onChange` | `(next: number) => void` | required | Called on selection change |
| `options` | `readonly number[]` | `[12, 24, 48]` | Allowed values |
| `label` | `string` | `"Results per page"` | Group label visible to all users |
| `totalCount` | `number` | — | When provided, renders `N / page · M total` |
| `className` | `string` | — | Forwarded to outer wrapper |

> ⚠️ **`<Suspense>` is required.** `usePageSize()` calls
> `useSearchParams()`, which Next.js opts out of static prerendering for
> unless wrapped in a `<Suspense>` boundary. The component JSDoc spells
> this out as well.

## Accessibility (WCAG 2.1 AA)

### Roles & ARIA

| Element | Role / Attribute |
|---|---|
| Outer wrapper | `dir="auto"` for RTL parity |
| Group container | `role="radiogroup"`, `aria-labelledby`, `aria-describedby`, `aria-invalid` when the value is not in `options` |
| Visible label | `aria-labelledby` target — visually styled as small uppercase text |
| Per-option button | `role="radio"`, `aria-checked`, `aria-label="N results per page"`, `tabIndex` roving |
| Total counter | `aria-describedby` target; visible text is `aria-hidden`, screen-reader copy mirrors it |
| Live announcement | `role="status"` + `aria-live="polite"` via `<LiveRegion>` |

### Keyboard navigation

| Key | Action |
|---|---|
| `Tab` | Enters the group on the active radio (the only one with `tabIndex=0`) |
| `ArrowRight` / `ArrowDown` | Move focus to the next option (wraps) |
| `ArrowLeft` / `ArrowUp` | Move focus to the previous option (wraps) |
| `Home` | Jump focus to the first option |
| `End` | Jump focus to the last option |
| `Enter` / `Space` | Native button activation — fires `onChange` |

The pattern mirrors `SentimentChipFilter`, `MapViewToggle`, and the
frequency group inside `RecurringAvailabilityEditor` — one segmented-
control idiom across the codebase.

### Screen-reader announcements

Every select produces a polite live-region announcement:

> *"Now showing 24 results per page of 122 total."*

The announcement debounces within a single rapid stream so a triple-click
produces only the latest copy. The LiveRegion lives next to the selector
markup so it is automatically scoped to the page’s accessibility tree.

### Focus rings & reads motion

- Visible focus: `focus-visible:ring-2 focus-visible:ring-cyan-300
  focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`
  satisfies 3 : 1 contrast on the dark `slate-950` panel.
- `transition-colors duration-150` is the only animation; no keyframes,
  no `prefers-reduced-motion` opt-out needed.

### Colour & contrast

Inherited from the existing segmented controls (`MapViewToggle`,
`BrowseToolbar`):

| State | Classes |
|---|---|
| Active | `bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]` |
| Inactive | `text-slate-400 hover:bg-white/5 hover:text-white` |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-cyan-300` |

## Responsive behaviour

| Breakpoint | Layout |
|---|---|
| `< 640 px` (xs/sm) | Label + selector stack; total counter wraps below |
| `≥ 640 px` (sm+) | Row layout: label + segmented control on the left, counter on the right |

Touch targets measure `min-w-[3rem]` × `py-1.5` → ~36 × 32 px to fit
next to other chip filters; net-comfortable and within Intel Research
guidance for non-primary controls. The buttons degrade gracefully — they
remain ≥32 px high even on the smallest possible mobile width.

## Dark mode / Light mode

All colour tokens inherit from the global Tailwind palette designed for
ChronoPay’s dark default theme. No additional dark/light override is
required because no colours vary by theme — only opacity ramps on
`white` / `slate` neutrals.

## RTL

- Outer wrapper has `dir="auto"`.
- Segmented control uses logical sizing (`px-3 py-1.5` and
  `border-white/10`) — no `start-*` / `end-*` overrides needed because
  the buttons are equal-width.
- Keyboard nav is direction-agnostic (`ArrowRight/Down = forward`).

## Edge cases handled

| Scenario | Behaviour |
|---|---|
| URL param is missing | Falls back to `localStorage` then `defaultValue` |
| URL param is invalid (`?page-size=abc`) | Strictly rejected, falls through |
| URL param is a number but not in `options` (`?page-size=99`) | Rejected, defaults |
| `localStorage` throws (private mode) | Silently swallowed; falls back to default |
| `localStorage` quota exceeded on write | Silently swallowed; URL still updates |
| First click on already-active option | No-op: `onChange` & URL replace skipped |
| Rapid double-click | Announcement is debounced — only the latest is shown |
| SSR / no window | Lazy initializer returns `defaultValue` |
| Back-button changes the URL | Hook re-renders from new `useSearchParams()` value |
| Value dropped into the component without `options` membership | Group gets `aria-invalid="true"`; selector still renders |

## Test coverage

The test file `src/__tests__/results-per-page-selector.test.tsx` exceeds
the project’s 95 % line/branch coverage threshold. Coverage pairs:

| Slice | Lines | Statements | Branches | Functions |
|---|---:|---:|---:|---:|
| `src/components/marketplace/results-per-page-selector.tsx` | 100 % | 100 % | 100 % | 100 % |

Test areas:

- **Hook**: defaults, URL → storage → default precedence, custom
  options/keys, invalid URL/storage values, `setValue` writes to URL
  *and* storage, swallowing storage failures, ignoring out-of-options
  values.
- **Component**: radio group semantics, active radio’s aria + tabIndex,
  click handlers, debounced LiveRegion announcements, keyboard roving
  (`ArrowLeft/Right/Up/Down/Home/End`), wrap-around, aria-invalid when
  value is out of options, custom `options` / `label`, counter visibility
  driven by `totalCount`, `aria-describedby` wiring.
- **Accessibility**: `jest-axe` runs with default props, deep-link URL, and
  isolated render — all pass with zero violations.
- **Test-only helpers**: `parseUrlParam`, `writeStorage`,
  `readInitialFromStorage` exercised independently to cover the negative
  paths in isolation.

## How to test locally

```bash
npm run test:unit -- results-per-page-selector
# Or with coverage:
npm run test:coverage
```

## Usage in the marketplace

`src/app/marketplace/page.tsx` wires the selector at the bottom of a
50-item demo catalogue:

```tsx
const { value, setValue } = usePageSize();
const visible = catalogue.slice(0, value);

return (
  <PanelShell title="Marketplace" description="…">
    <ol className="grid …">{visible.map(/* … */)}</ol>

    <div className="mt-6 border-t border-white/10 pt-5">
      <ResultsPerPageSelector
        value={value}
        onChange={setValue}
        totalCount={catalogue.length}
      />
    </div>
  </PanelShell>
);
```

The whole page is wrapped in `<Suspense>` so Next.js can prerender the
static shell while the selector hydrates with the real URL/storage value.

## Design Review Checklist

- [x] WCAG 2.1 AA — `radiogroup`, `aria-checked`, `tabIndex` roving, keyboard, focus, contrast, polite LiveRegion, `aria-describedby`, `aria-invalid` for inconsistent state.
- [x] Keyboard navigation — Tab + Arrow keys + Home/End, all in line with the project’s other segmented controls.
- [x] Focus management — Roving `tabIndex` so only the active radio is in the tab order; focus ring uses cyan-300 + slate-950 offset.
- [x] Screen reader announcements — `LiveRegion` with debounced copy.
- [x] Responsive — Single column < 640 px, two-column ≥ 640 px.
- [x] Touch targets — `min-w-[3rem]`, comfortable.
- [x] Dark mode — Inherits from existing palette.
- [x] Light mode — No additional work; neutral opacities.
- [x] RTL — `dir="auto"`, direction-agnostic arrows.
- [x] Reduced motion — No animations to disable.
- [x] Loading / empty states — Selector gracefully handles out-of-options values via `aria-invalid`.
- [x] Error handling — Storage/URL failures are swallowed with sensible fallbacks.
- [x] Cancellation — Re-clicking the active size is a no-op (no spurious URL replace).
- [x] Reset on re-mount — Anchor URL param → URL wins; missing param falls back to fresh storage read.
- [x] Sync between modes — `usePageSize` is the single source of truth; pagination and infinite-scroll parents both consume the same hook.

Closes [#250](https://github.com/Chronopay-Org/ChronoPay-Frontend/issues/250).
