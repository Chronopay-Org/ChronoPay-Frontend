# StatusTimeline Component API

The `StatusTimeline` component renders an accessible ordered timeline for dispute, booking, and escrow events. It supports milestone filtering and now includes a dedicated mediator-assigned card for dispute workflows.

## Props

| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `items` | `TimelineItem[]` | Yes | Ordered timeline items to display. |

## Timeline item structure

```ts
type MediatorAssignmentDetails = {
  name: string;
  responseSlaLabel?: string;
  responseDueLabel?: string;
  slaProgress?: number;
  directMessageHref?: string;
  directMessageLabel?: string;
};

type TimelineItem = {
  id: string;
  title: string;
  status: "pending" | "completed" | "failed" | "warning";
  timestamp: string;
  variant?: "default" | "mediator_assigned";
  actor?: string;
  details?: string;
  mediator?: MediatorAssignmentDetails;
  isCurrent?: boolean;
  isMilestone?: boolean;
};
```

## Mediator-assigned block

When a timeline item uses `variant: "mediator_assigned"` and provides a `mediator` object, the entry renders a card with:

- Mediator name
- Response SLA label
- Due-date label
- Direct-message action
- Progress meter for SLA elapsed time

The component announces mediator assignment changes through a polite live region so screen-reader users hear the update without moving focus.

## Milestones mode

When at least one item has `isMilestone: true`, the timeline shows a `role="switch"` toggle.

- Off: all timeline events are shown.
- On: only milestone entries are shown.
- Scroll position is preserved across the filter change.
- A polite live region announces the mode change.

## Accessibility notes

- Uses semantic `<ol>` markup for the event list.
- Marks the active step with `aria-current="step"`.
- Uses `role="switch"` and `aria-checked` for milestone filtering.
- Announces mediator assignment and filter changes through `role="status"`.
- Exposes the SLA bar as a `progressbar` with `aria-valuetext`.
- Direct-message CTA and detail toggles use visible focus states.

## Responsive and RTL behavior

- The mediator card stacks its action below the summary on narrow screens.
- The timeline uses logical spacing (`ms-*`, `border-s`) so it mirrors cleanly in RTL layouts.
- Long mediator names and due-date labels wrap without overlapping the CTA.

## Manual review notes

- Reassignment: supply a newer `mediator_assigned` item and the latest one is announced.
- No SLA: omit `responseSlaLabel` or `slaProgress` and the card falls back to neutral copy.
- Dark mode: the card uses the same slate/cyan contrast system as the rest of the dashboard.
