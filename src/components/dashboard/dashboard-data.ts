import type {
  Metric,
  QuickAction,
  Slot,
  Supplier,
  WalletSnapshot,
  TimelineItem,
  SentimentCounts,
  SentimentDataPoint,
} from "./types";
import type { TimelineItem, KycTimelineEntry, KycPromptPanel } from "./timeline-types";
import { BADGE_PRESETS } from "./social-proof-badge";
import type { DayAvailability } from "./availability-strip";

/** localStorage key — set when the user clears onboarding sample rows. */
export const SAMPLES_CLEARED_STORAGE_KEY =
  "chronopay.onboarding.samplesCleared";

/** localStorage key — set when the user skips or finishes the guided tour. */
export const TOUR_DISMISSED_STORAGE_KEY =
  "chronopay.onboarding.tourDismissed";

export const SAMPLE_TOOLTIP =
  "This row is sample data for new users. Clear samples when you are ready to use your own listings.";

export const metrics: Metric[] = [
  {
    label: "Available hours this week",
    value: "18.5h",
    detail: "4 slots open across consulting, coaching, and onboarding.",
    tone: "positive",
    isSample: true,
  },
  {
    label: "Wallet balance",
    value: "1,240 XLM",
    detail: "Up 8.4% since the last payout window closed.",
    tone: "neutral",
    isSample: true,
  },
  {
    label: "Bookings in progress",
    value: "12",
    detail: "3 need confirmation before Tuesday, April 1.",
    tone: "warning",
    isSample: true,
  },
  {
    label: "Conversion rate",
    value: "74%",
    detail: "Strong demand on weekday afternoons this cycle.",
    tone: "positive",
    isSample: true,
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
    isSample: true,
    badges: [
      { type: "topRated", ...BADGE_PRESETS.topRated },
      { type: "verified", ...BADGE_PRESETS.verified },
    ],
  },
  {
    id: "slot-2",
    title: "UX design review",
    dateLabel: "Wed, Apr 2",
    timeRange: "14:00-15:00",
    demand: "2 open offers",
    rate: "95 XLM / hr",
    status: "Tight",
    isSample: true,
    badges: [{ type: "verified", ...BADGE_PRESETS.verified }],
  },
  {
    id: "slot-3",
    title: "Founder office hours",
    dateLabel: "Thu, Apr 3",
    timeRange: "09:00-10:00",
    demand: "Waitlist enabled",
    rate: "140 XLM / hr",
    status: "Busy",
    isSample: true,
  },
  {
    id: "slot-4",
    title: "Architecture sync",
    dateLabel: "Fri, Apr 4",
    timeRange: "13:00-14:00",
    demand: "Sold out",
    rate: "150 XLM / hr",
    status: "Sold Out",
    nextAvailableHint: "Mon 10am",
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
  { label: "Reserved", value: 8 },
  { label: "Confirmed", value: 5 },
  { label: "Completed", value: 3 },
];

export const bookingTimeline: TimelineItem[] = [
  {
    id: "1",
    title: "Reserved",
    status: "completed",
    timestamp: "2026-06-30 09:00 AM",
    actor: "Buyer",
    details: "Slot reserved for 30 minutes.",
    isMilestone: true,
  },
  {
    id: "2",
    title: "Confirmed",
    status: "completed",
    timestamp: "2026-06-30 09:30 AM",
    actor: "System",
    details: "Booking confirmed by seller.",
    isMilestone: true,
  },
  {
    id: "3",
    title: "Payment Escrowed",
    status: "completed",
    timestamp: "2026-06-30 09:45 AM",
    actor: "Escrow",
    details: "Funds secured in escrow contract.",
  },
  {
    id: "4",
    title: "Service Delivered",
    status: "completed",
    timestamp: "2026-06-30 10:15 AM",
    actor: "Seller",
    details: "Service rendered and acknowledged.",
    isMilestone: true,
  },
  {
    id: "5",
    title: "Rating Submitted",
    status: "pending",
    timestamp: "2026-06-30 10:30 AM",
    actor: "Buyer",
    details: "Awaiting rating from buyer.",
    isCurrent: true,
  },
  {
    id: "6",
    title: "Escrow Released",
    status: "pending",
    timestamp: "—",
    actor: "System",
    details: "Funds will be released after both parties confirm.",
    isMilestone: true,
  },
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

export const upcomingHolidays: HolidayHint[] = [
  {
    id: "holiday-1",
    name: "New Year's Day",
    date: "2027-01-01",
    dateLabel: "Jan 1, 2027",
  },
  {
    id: "holiday-2",
    name: "Martin Luther King Jr. Day",
    date: "2027-01-19",
    dateLabel: "Jan 19, 2027",
    isMoving: true,
  },
  {
    id: "holiday-3",
    name: "Presidents' Day",
    date: "2027-02-16",
    dateLabel: "Feb 16, 2027",
    isMoving: true,
  },
  {
    id: "holiday-4",
    name: "Memorial Day",
    date: "2027-05-31",
    dateLabel: "May 31, 2027",
    isMoving: true,
  },
  {
    id: "holiday-5",
    name: "Independence Day",
    date: "2027-07-04",
    dateLabel: "Jul 4, 2027",
  },
];

export const holidayRegion: RegionInfo = {
  code: "US",
  name: "United States",
};

export const suppliers: Supplier[] = [
  {
    id: "supplier-1",
    name: "Alex Rivera",
    title: "Product & Strategy Consultant",
    badges: [
      { type: "verifiedPayouts", ...BADGE_PRESETS.verifiedPayouts },
      { type: "topRated", ...BADGE_PRESETS.topRated },
      { type: "highPayouts", ...BADGE_PRESETS.highPayouts },
      { type: "repeatBuyers", ...BADGE_PRESETS.repeatBuyers },
      { type: "fastResponse", ...BADGE_PRESETS.fastResponse },
      { type: "verified", ...BADGE_PRESETS.verified },
      { type: "earlyAdopter", ...BADGE_PRESETS.earlyAdopter },
    ],
  },
  {
    id: "supplier-2",
    name: "Morgan Chen",
    title: "UX Design Lead",
    badges: [
      { type: "verifiedPayouts", ...BADGE_PRESETS.verifiedPayouts },
      { type: "verified", ...BADGE_PRESETS.verified },
      { type: "fastResponse", ...BADGE_PRESETS.fastResponse },
    ],
  },
  {
    id: "supplier-3",
    name: "Jordan Taylor",
    title: "Executive Coach",
    badges: [],
  },
];

// ─── Review sentiment ─────────────────────────────────────────────────────────

/** Current review counts broken down by sentiment bucket. */
export const reviewSentimentCounts: SentimentCounts = {
  positive: 48,
  mixed: 17,
  critical: 9,
};

/**
 * 8-week sentiment trend series (oldest → newest).
 * Used by the SentimentSparkline in the Reviews panel.
 */
export const reviewSentimentTrend: SentimentDataPoint[] = [
  { period: "2026-06-01", positive: 22, mixed: 11, critical: 7 },
  { period: "2026-06-08", positive: 28, mixed: 13, critical: 8 },
  { period: "2026-06-15", positive: 31, mixed: 15, critical: 9 },
  { period: "2026-06-22", positive: 35, mixed: 14, critical: 10 },
  { period: "2026-06-29", positive: 38, mixed: 16, critical: 9 },
  { period: "2026-07-06", positive: 41, mixed: 15, critical: 8 },
  { period: "2026-07-13", positive: 45, mixed: 17, critical: 9 },
  { period: "2026-07-20", positive: 48, mixed: 17, critical: 9 },
];
