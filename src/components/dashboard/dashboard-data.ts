import type {
  BookingStage,
  Metric,
  QuickAction,
  Slot,
  WalletSnapshot,
} from "./types";

export const metrics: Metric[] = [
  {
    label: "Available hours this week",
    value: "18.5h",
    detail: "4 slots open across consulting, coaching, and onboarding.",
    tone: "positive",
  },
  {
    label: "Wallet balance",
    value: "1,240 XLM",
    detail: "Up 8.4% since the last payout window closed.",
    tone: "neutral",
  },
  {
    label: "Bookings in progress",
    value: "12",
    detail: "3 need confirmation before Tuesday, April 1.",
    tone: "warning",
  },
  {
    label: "Conversion rate",
    value: "74%",
    detail: "Strong demand on weekday afternoons this cycle.",
    tone: "positive",
  },
];

export const slots: Slot[] = [
  {
    id: "slot-1",
    title: "Product strategy call",
    dateLabel: "Tue, Apr 1",
    timeRange: "10:00-11:30",
    demand: "6 interested buyers",
    rate: "120 XLM / hr",
    status: "Healthy",
    isNextAvailable: true,
  },
  {
    id: "slot-2",
    title: "UX design review",
    dateLabel: "Wed, Apr 2",
    timeRange: "14:00-15:00",
    demand: "2 open offers",
    rate: "95 XLM / hr",
    status: "Tight",
  },
  {
    id: "slot-3",
    title: "Founder office hours",
    dateLabel: "Thu, Apr 3",
    timeRange: "09:00-10:00",
    demand: "Waitlist enabled",
    rate: "140 XLM / hr",
    status: "Busy",
  },
];

export const wallet: WalletSnapshot = {
  connection: "connected",
  address: "GCDQ7M3F6JH2K4N8Q5RLP9TZB3YH4W8F1S7N6U0X2A5V8E1C",
  balance: "1,240 XLM",
  pending: "180 XLM",
  nextPayout: "Friday, April 4",
  status: "Synced 2 minutes ago",
};

export const bookingStages: BookingStage[] = [
  { label: "Reserved", value: 12 },
  { label: "Confirmed", value: 8 },
  { label: "Completed", value: 5 },
];

export const quickActions: QuickAction[] = [
  {
    title: "List new slot",
    description: "Open a fresh availability block with default pricing.",
    href: "/dashboard",
    tone: "positive",
    icon: "Plus",
  },
  {
    title: "Review wallet",
    description: "Check payout timing, escrow, and pending transfers.",
    href: "/dashboard",
    tone: "neutral",
    icon: "Wallet",
  },
  {
    title: "Confirm bookings",
    description: "Resolve the three requests waiting on your approval.",
    href: "/dashboard",
    tone: "warning",
    icon: "CheckCircle",
  },
];
