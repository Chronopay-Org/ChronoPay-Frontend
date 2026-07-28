import type { NotificationItem } from "./types";

export const notifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Slot booked: Product strategy call",
    description: "A buyer booked your Tuesday 10:00-11:30 slot.",
    timestamp: "2 min ago",
    read: false,
    tone: "success",
  },
  {
    id: "notif-2",
    title: "Payout completed",
    description: "1,240 XLM has been released to your wallet.",
    timestamp: "1 hour ago",
    read: false,
    tone: "success",
  },
  {
    id: "notif-3",
    title: "Booking confirmation needed",
    description: "Buyer is waiting for you to confirm the UX review session.",
    timestamp: "3 hours ago",
    read: false,
    tone: "warning",
  },
  {
    id: "notif-4",
    title: "Escrow release failed",
    description: "The contract rejected the release. Contact support.",
    timestamp: "5 hours ago",
    read: true,
    tone: "error",
  },
  {
    id: "notif-5",
    title: "New review received",
    description: "Alex Rivera left a 5-star review on your coaching session.",
    timestamp: "1 day ago",
    read: true,
    tone: "info",
  },
  {
    id: "notif-6",
    title: "Rate limit warning",
    description: "You're approaching 90% of your daily booking limit.",
    timestamp: "2 days ago",
    read: true,
    tone: "warning",
  },
];
