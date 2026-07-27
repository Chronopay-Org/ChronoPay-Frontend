# StatusTimeline Component API

The `StatusTimeline` component provides a vertical, accessible, and collapsible timeline for tracking lifecycle stages in bookings and escrows.

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
};
```

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
  },
  {
    id: "2",
    title: "Escrow Funded",
    status: "pending",
    timestamp: "2026-06-30 11:00 AM",
    actor: "Escrow Agent",
    isCurrent: true,
  },
];

<StatusTimeline items={items} />
```
