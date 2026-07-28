# StatusTimeline Component API

The `StatusTimeline` component provides a vertical, accessible, and collapsible timeline for tracking lifecycle stages in bookings and escrows. It includes a **Milestones mode** toggle that filters to show only high-signal events, useful for auditors and quick-scan reviews.

## Props

| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `items` | `TimelineItem[]` | Yes | Array of timeline items to display. |

## TimelineItem Structure

```typescript
type TimelineItem = {
  id: string;
  title: string;
  status: "pending" | "completed" | "failed" | "warning";
  timestamp: string;
  actor?: string; // Optional: The entity responsible for this step
  details?: string; // Optional: Granular information or metadata
  isCurrent?: boolean; // Optional: Highlights this step as active
  isMilestone?: boolean; // Optional: Flags this event as a high-signal milestone for the milestones-only filter
};
```

## Milestones Mode

When at least one timeline item has `isMilestone: true`, the component renders a **toggle switch** (`role="switch"`) labeled "Milestones only".

- **Toggle on**: Only items with `isMilestone: true` are displayed.
- **Toggle off** (default): All items are displayed.
- **Scroll position** is preserved when toggling modes.
- **Screen reader announcement**: A polite `aria-live="polite"` region announces the mode change.
- **Milestone badge**: Each milestone item shows a "Milestone" chip inline next to the title.
- **Empty state**: If no milestones match the filter, an empty state is shown with a link to show all events.
- **Toggle hidden**: The toggle is not rendered when no items have `isMilestone` set.

### Accessibility (WCAG 2.1 AA)

- The toggle uses `role="switch"` with `aria-checked` for correct ARIA semantics.
- The toggle has a dynamic `aria-label` that changes with state.
- Mode changes are announced via `role="status"` with `aria-live="polite"`.
- All interactive elements have visible focus rings.
- The timeline uses semantic `<ol>` with `role="list"`.
- Current step is marked with `aria-current="step"`.

## Usage Example

```tsx
import { StatusTimeline } from "@/components/dashboard/status-timeline";

const items = [
  {
    id: "1",
    title: "Order Placed",
    status: "completed",
    timestamp: "2026-06-30 10:00 AM",
    actor: "Buyer",
    details: "Order #12345 confirmed.",
    isMilestone: true,
  },
  {
    id: "2",
    title: "Escrow Funded",
    status: "pending",
    timestamp: "2026-06-30 11:00 AM",
    actor: "Escrow Agent",
    isCurrent: true,
  },
  {
    id: "3",
    title: "Rating Submitted",
    status: "completed",
    timestamp: "2026-06-30 12:00 PM",
    actor: "Buyer",
  },
];

<StatusTimeline items={items} />
```

### Milestones-mode behavior with this example

- Item "Order Placed" is a milestone, item "Rating Submitted" is not.
- With milestones mode **off**: All 3 items shown.
- With milestones mode **on**: Only "Order Placed" and "Escrow Funded" shown.
- The milestone badge "Milestone" appears on "Order Placed".
- Screen reader announces "Showing milestones only" on toggle.
