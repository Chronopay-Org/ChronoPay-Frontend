import type {
  Metric,
  QuickAction,
  Slot,
  Supplier,
  WalletSnapshot,
  TimelineItem,
  HolidayHint,
  RegionInfo,
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
  },
  {
    id: "2",
    title: "Confirmed",
    status: "completed",
    timestamp: "2026-06-30 09:30 AM",
    actor: "System",
    details: "Booking confirmed by seller.",
  },
  {
    id: "3",
    title: "Completed",
    status: "pending",
    timestamp: "2026-06-30 10:30 AM",
    actor: "Seller",
    details: "Awaiting final review.",
    isCurrent: true,
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

// Generate 7-day availability data starting from today
export const generateAvailabilityData = (): DayAvailability[] => {
  const days: DayAvailability[] = [];
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayName = dayNames[date.getDay()];
    const dateLabel = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
    
    // Simulate availability based on day of week
    const dayOfWeek = date.getDay();
    let slotCount = 0;
    let status: DayAvailability["status"] = "none";
    
    // Weekend: fewer slots
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      slotCount = Math.floor(Math.random() * 3);
      status = slotCount > 0 ? (slotCount > 1 ? "limited" : "available") : "none";
    } 
    // Weekdays: more slots
    else {
      slotCount = Math.floor(Math.random() * 6) + 2;
      if (slotCount >= 4) {
        status = "available";
      } else if (slotCount >= 2) {
        status = "limited";
      } else {
        status = slotCount === 1 ? "limited" : "none";
      }
    }
    
    // Randomly make some days full
    if (Math.random() < 0.15 && slotCount > 0) {
      status = "full";
    }

    days.push({
      date,
      dayName,
      dateLabel,
      slotCount,
      status,
    });
  }

  return days;
};

export const availabilityDays = generateAvailabilityData();

export const bookingStages = [
  { label: "Reserved", value: 25 },
  { label: "Confirmed", value: 50 },
  { label: "In Progress", value: 75 },
  { label: "Completed", value: 100 },
];
