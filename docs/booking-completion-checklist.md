# Booking Completion Checklist

## Overview

The `BookingChecklist` component is a persistent step-by-step tracker that shows which booking actions are done, in-progress, blocked, or skipped. It gives users a clear picture of how far they are before wallet handoff.

**Component location:** `src/components/dashboard/booking-checklist.tsx`  
**Types:** `src/components/dashboard/types.ts` — `ChecklistStep`, `ChecklistStepStatus`, `ChecklistSummary`  
**Sample data:** `src/components/dashboard/dashboard-data.ts` — `bookingChecklistSteps`

## Design goals

- **Persistent awareness:** Always visible on desktop (sticky column); summarised and expandable on mobile.
- **Step hierarchy:** Five distinct statuses — `done`, `active`, `blocked`, `skipped`, `pending` — each with its own icon and tone.
- **Accessible:** WCAG 2.1 AA — semantic list, `aria-current="step"`, live announcements for status changes, visible focus rings.
- **Responsive:** Sticky panel on `≥ lg`; collapsible disclosure on mobile.
- **Dark-mode first:** Inherits ChronoPay slate/cyan tokens; no separate light palette needed.

## Component API

```tsx
import {
  BookingChecklist,
  deriveChecklistSummary,
  type ChecklistStep,
  type ChecklistStepStatus,
  type ChecklistSummary,
} from "@/components/dashboard";

<BookingChecklist
  eyebrow="Booking flow"
  title="Completion checklist"
  steps={bookingChecklistSteps}
  onStepClick={(step) => navigate(`/booking/${step.id}`)}
/>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `"Booking checklist"` | Panel heading |
| `eyebrow` | `string` | — | Optional eyebrow label above the title |
| `steps` | `ChecklistStep[]` | required | Ordered list of checklist steps |
| `onStepClick` | `(step: ChecklistStep) => void` | — | Called when an interactive step row is clicked. If omitted, rows are purely presentational |
| `withCard` | `boolean` | `true` | Wraps in a card shell (border, backdrop-blur). Set to `false` when embedding inside an existing card |
| `defaultCollapsed` | `boolean` | `true` | Whether the step list starts collapsed on mobile |
| `className` | `string` | `""` | Extra CSS classes applied to the outermost element |

### `ChecklistStep` type

```typescript
type ChecklistStep = {
  id: string;                    // Stable identifier (React key + ARIA id anchor)
  label: string;                 // Human-readable step label
  status: ChecklistStepStatus;   // "done" | "active" | "blocked" | "skipped" | "pending"
  description?: string;          // Optional helper copy beneath the label
  optional?: boolean;            // When true, skipped steps count toward progress
};
```

### `ChecklistStepStatus` values

| Status | Icon | Tone | When to use |
| --- | --- | --- | --- |
| `done` | ✓ filled circle | Emerald | Step successfully completed |
| `active` | Spinning loader | Cyan | Step currently in progress |
| `blocked` | Warning triangle | Amber | Step cannot proceed until a dependency resolves |
| `skipped` | Minus circle | Slate (muted) | Optional step the user or system has bypassed |
| `pending` | Empty circle | Slate (dim) | Step not yet reached |

### `deriveChecklistSummary` helper

```typescript
import { deriveChecklistSummary } from "@/components/dashboard";

const summary = deriveChecklistSummary(steps);
// { total, done, active, blocked, skipped, pending, progress }
```

`progress` is a `0–1` value. `done` steps and `skipped` **optional** steps both count toward progress; non-optional skipped steps do not.

## Accessibility notes

| Concern | Implementation |
| --- | --- |
| List semantics | `<ol role="list">` → each step is `<li role="listitem">` |
| Current step | Active step row carries `aria-current="step"` |
| Interactive rows | `<button type="button">` for interactive steps; `<div>` for non-interactive ones |
| Labels | Every row has `aria-labelledby` + optional `aria-describedby` from step label/description ids |
| Progress bar | `role="progressbar" aria-valuenow aria-valuemin aria-valuemax aria-label` |
| Live updates | `role="status" aria-live="polite" aria-atomic="true"` announces when a step status changes |
| Mobile toggle | `aria-expanded` + `aria-controls` on the collapse/expand button |
| Icons | All icons are `aria-hidden="true"` |
| Focus rings | Cyan `focus-visible:ring-2` on interactive rows and the mobile toggle |

### axe / manual checks

- No unlabelled controls; the list section uses `aria-labelledby` from the panel heading.
- `aria-setsize` / `aria-posinset` are intentionally omitted from step rows — they are only valid on specific ARIA roles. Positional context is conveyed correctly by the native `<ol>/<li>` structure.
- Contrast: tones match `StatusChip` palette (≥ 4.5:1 on dark backgrounds).
- Dark mode: inherits ChronoPay slate/cyan tokens; no additional overrides needed.
- RTL: flex layout with `gap` + logical padding; no hard-coded left/right assumptions.

## Responsive layout

| Viewport | Behaviour |
| --- | --- |
| `< lg` (mobile) | Renders as a collapsible disclosure. Header always visible; step list toggles open/closed via the chevron button. `defaultCollapsed=true` by default. |
| `≥ lg` (desktop) | `position: sticky; top: 1.5rem` inside a parent grid column. Step list always visible. |

Panel padding follows the ChronoPay convention: `px-4 sm:px-5 xl:px-6`.

## Usage examples

### Dashboard panel (default)

```tsx
<BookingChecklist
  eyebrow="Booking flow"
  title="Completion checklist"
  steps={bookingChecklistSteps}
  defaultCollapsed={false}
/>
```

### Inside a larger booking view with navigation

```tsx
<BookingChecklist
  title="Your booking steps"
  steps={steps}
  onStepClick={(step) => {
    if (step.status === "active" || step.status === "blocked") {
      router.push(`/bookings/${bookingId}/${step.id}`);
    }
  }}
  defaultCollapsed={false}
/>
```

### Embedded without card chrome

```tsx
<PanelShell title="Booking">
  {/* other content */}
  <BookingChecklist steps={steps} withCard={false} />
</PanelShell>
```

### Empty / loading state

Pass an empty array to `steps` for a graceful empty state. The progress bar shows 0% and the done/total pill shows `0/0`.

```tsx
<BookingChecklist steps={[]} />
```

## Step status transitions (typical booking flow)

```
Reserved    →  done
Confirmed   →  done
Escrow      →  active  →  done
Deliver     →  blocked →  active →  done
Rate        →  pending →  skipped (optional) or done
Release     →  pending →  active  →  done
```

## Integration with `bookingTimeline`

`BookingChecklist` and `StatusTimeline` are complementary:

- `StatusTimeline` shows the chronological event log with timestamps and actors.
- `BookingChecklist` shows the actionable step list with current status and blocking reasons.

Use both together to give users both audit history and next-step clarity.

## Testing

- Unit: `src/components/dashboard/booking-checklist.test.tsx`
- Coverage: **100%** statements, branches, functions, and lines
- Includes: axe accessibility tests for all major render states

```bash
npm run test:unit
npm run lint && npm run build
```

### Edge cases covered

| Scenario | Test |
| --- | --- |
| Empty step list | Renders gracefully, shows `0/0`, progress 0% |
| All steps done | 100% label, emerald pill, progress 1 |
| Skipped optional steps | Count toward progress |
| Skipped non-optional steps | Do not count toward progress |
| No `onStepClick` | Rows render as `<div>`, no spurious buttons |
| Pending steps | Never interactive regardless of `onStepClick` |
| Status change | `aria-live` region announces the change |
| Initial render | No announcement on mount |
| `withCard=false` | Card classes absent from outer element |
| Mobile collapse | `aria-expanded` toggled correctly |
