import type {
  Metric,
  QuickAction,
  Slot,
  Supplier,
  WalletSnapshot,
  CalendarSyncProvider,
  CalendarDefinition,
  RatingCriterion,
} from "./types";
import type { TimelineItem } from "./timeline-types";
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

export const calendarSyncProviders: CalendarSyncProvider[] = [
  {
    id: "google",
    name: "Google Calendar",
    icon: "Google",
    description: "Sync bookings and availability with your Google workspace calendars.",
    scopes: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  },
  {
    id: "outlook",
    name: "Outlook Calendar",
    icon: "Calendar",
    description: "Sync with Microsoft 365 Outlook and Exchange calendars.",
    scopes: [
      "Calendars.ReadWrite",
      "Calendars.Read",
      "offline_access",
    ],
  },
  {
    id: "apple",
    name: "Apple Calendar",
    icon: "Apple",
    description: "Sync via CalDAV with iCloud and on-premise Apple Calendar servers.",
    scopes: [
      "https://www.apple.com/cadav/calendar/",
    ],
  },
];

export const sampleCalendars: CalendarDefinition[] = [
  {
    id: "cal-1",
    providerId: "google",
    title: "Primary Calendar",
    description: "alex@example.com",
    color: "#4285F4",
  },
  {
    id: "cal-2",
    providerId: "google",
    title: "Work Calendar",
    description: "team@example.com",
    color: "#34A853",
  },
  {
    id: "cal-3",
    providerId: "outlook",
    title: "Calendar",
    description: "alex@company.com",
    color: "#0078D4",
  },
];

export const calendarSyncOptions: { value: SyncDirection; label: string; description: string }[] = [
  { value: "off", label: "Off", description: "No sync for this calendar." },
  { value: "read", label: "Read only", description: "Import events into ChronoPay." },
  { value: "write", label: "Write only", description: "Push ChronoPay events to this calendar." },
  { value: "bidirectional", label: "Bidirectional", description: "Keep both sides in sync." },
];

export type { CalendarSyncProvider, CalendarDefinition, SyncDirection, AuthorizationState } from "./types";

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

/** Sample per-criterion rating breakdown for supplier profiles. */
export const ratingBreakdown: RatingCriterion[] = [
  {
    id: "communication",
    label: "Communication",
    average: 4.8,
    count: 42,
    colorClass: "bg-teal-400",
  },
  {
    id: "expertise",
    label: "Expertise",
    average: 4.6,
    count: 41,
    colorClass: "bg-cyan-400",
  },
  {
    id: "timeliness",
    label: "Timeliness",
    average: 4.3,
    count: 40,
    colorClass: "bg-sky-400",
  },
  {
    id: "value",
    label: "Value",
    average: 4.5,
    count: 38,
    colorClass: "bg-blue-400",
  },
  {
    id: "clarity",
    label: "Clarity",
    average: 4.7,
    count: 39,
    colorClass: "bg-indigo-400",
  },
];

export const reviewSentimentCounts = {
  positive: 48,
  mixed: 17,
  critical: 9,
};

export const reviewSentimentTrend = [
  { timestamp: "2026-07-01", positive: 5, mixed: 2, critical: 1 },
  { timestamp: "2026-07-08", positive: 12, mixed: 4, critical: 2 },
  { timestamp: "2026-07-15", positive: 20, mixed: 6, critical: 3 },
  { timestamp: "2026-07-22", positive: 35, mixed: 11, critical: 6 },
  { timestamp: "2026-07-28", positive: 48, mixed: 17, critical: 9 },
];

