# StatusTimeline Component API

The `StatusTimeline` component provides a vertical, accessible, and collapsible timeline for tracking lifecycle stages in bookings and escrows. It includes a **Milestones mode** toggle that filters to show only high-signal events, useful for auditors and quick-scan reviews, and **branching support** for parallel events (e.g., dispute + refund proceeding independently) with rejoin markers when they converge.

## Props

| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `items` | `TimelineNode[]` | Yes | Array of timeline nodes (items and/or branch groups) to display. |

## Types

### TimelineItem (individual event)

```typescript
type TimelineItem = {
  id: string;
  title: string;
  status: "pending" | "completed" | "failed" | "warning";
  timestamp: string;
  actor?: string;
  details?: string;
  isCurrent?: boolean;
  isMilestone?: boolean;
};
```

### TimelineBranchGroup (parallel fork)

```typescript
type TimelineBranchGroup = {
  type: "branch-group";
  id: string;
  label: string;          // Fork label (e.g. "Dispute Initiated")
  branches: TimelineItem[][];  // Each inner array is one parallel track
  rejoinLabel?: string;   // Convergence label (e.g. "Case Closed")
};
```

### TimelineNode (union)

```typescript
type TimelineNode = TimelineItem | TimelineBranchGroup;
```

## Branching

The timeline supports rendering parallel event tracks via `TimelineBranchGroup`. Each branch group:

- Renders a **fork indicator** (amber dot with GitFork icon) at the branching point.
- Displays a **fork label** (e.g. "Dispute Initiated") and branch count.
- Renders each parallel track as a **sub-timeline** with its own vertical line, offset from the main timeline.
- Each branch has a **"Branch N" heading** and a lighter connector line showing the divergence from the main timeline.
- When `rejoinLabel` is provided, a **rejoin marker** (emerald dot with GitMerge icon) is rendered after all branches, indicating convergence.
- **Keyboard navigation**: Arrow keys (Left/Right, Up/Down) cycle focus between parallel branches within a group.
- Milestones filtering works across branches: in milestones-only mode, branches that contain no milestone items are hidden entirely.

### Branch Accessibility

- Each branch group has `role="group"` with an `aria-label` describing the fork point.
- Each individual branch container has `tabIndex={0}`, `role="group"`, and an `aria-label` listing its events.
- Rejoin markers have `role="region"` with an `aria-label` (e.g. "Rejoin: Case Closed").
- Branch containers are focusable and show visible focus rings for keyboard-only users.

## Milestones Mode

When at least one timeline item (including items inside branches) has `isMilestone: true`, the component renders a **toggle switch** (`role="switch"`) labeled "Milestones only".

- **Toggle on**: Only items with `isMilestone: true` are displayed. Branch groups that contain no milestone items are hidden entirely.
- **Toggle off** (default): All items are displayed.
- **Scroll position** is preserved when toggling modes.
- **Screen reader announcement**: A polite `aria-live="polite"` region announces the mode change.
- **Milestone badge**: Each milestone item shows a "Milestone" chip inline next to the title.
- **Toggle hidden**: The toggle is not rendered when no items (including those inside branches) have `isMilestone` set.

### Accessibility (WCAG 2.1 AA)

- The toggle uses `role="switch"` with `aria-checked` for correct ARIA semantics.
- The toggle has a dynamic `aria-label` that changes with state.
- Mode changes are announced via `role="status"` with `aria-live="polite"`.
- All interactive elements have visible focus rings.
- The timeline uses semantic `<ol>` with `role="list"`.
- Current step is marked with `aria-current="step"`.
- Branch groups use `role="group"` with descriptive `aria-label`.
- Branch containers are focusable and navigable via arrow keys.

## Usage Examples

### Basic (no branching)

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

### With branching and rejoin

```tsx
import { StatusTimeline } from "@/components/dashboard/status-timeline";
import type { TimelineNode } from "./timeline-types";

const items: TimelineNode[] = [
  {
    id: "1",
    title: "Payment Received",
    status: "completed",
    timestamp: "2026-06-30 09:00 AM",
  },
  {
    type: "branch-group",
    id: "dispute-branch",
    label: "Dispute Initiated",
    branches: [
      [
        {
          id: "dispute-review",
          title: "Dispute Under Review",
          status: "warning",
          timestamp: "2026-06-30 10:00 AM",
        },
        {
          id: "dispute-resolved",
          title: "Dispute Resolved",
          status: "completed",
          timestamp: "2026-06-30 12:00 PM",
          isMilestone: true,
        },
      ],
      [
        {
          id: "refund-processing",
          title: "Refund Processing",
          status: "pending",
          timestamp: "2026-06-30 10:30 AM",
        },
      ],
    ],
    rejoinLabel: "Case Closed",
  },
  {
    id: "2",
    title: "Rating Submitted",
    status: "completed",
    timestamp: "2026-06-30 01:00 PM",
  },
];

<StatusTimeline items={items} />
```

## Edge cases

- **Three-way branches**: Three or more branches render correctly with individual vertical lines and connector lines.
- **Empty branches**: A branch group with an empty `branches` array renders gracefully (fork label visible, no branch items).
- **Branches without rejoin**: When `rejoinLabel` is omitted, branches end without a convergence marker.
- **Milestones across branches**: Milestones filter applies to items inside branches; branches with no milestones are hidden in milestones-only mode.
- **RTL**: The timeline respects the document direction via relative positioning.
- **Dark mode**: All colours use project design tokens compatible with the dark theme.
