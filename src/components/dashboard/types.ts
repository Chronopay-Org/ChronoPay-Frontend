export type Tone = "neutral" | "positive" | "warning" | "critical";

export type AvailabilityLevel = "Healthy" | "Tight" | "Busy";

export type Slot = {
  id: string;
  title: string;
  dateLabel: string;
  timeRange: string;
  demand: string;
  rate: string;
  status: AvailabilityLevel;
  isNextAvailable?: boolean;
  badges?: SocialProofBadgeEntry[];
};

export type QuickAction = {
  title: string;
  description: string;
  href: string;
  tone: Tone;
  icon: string; // lucide-react icon name
};

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
};

export type BookingStage = {
  label: string;
  value: number;
};

export type WalletSnapshot = {
  connection: "connected" | "disconnected" | "error";
  address?: string;
  balance?: string;
  pending?: string;
  nextPayout?: string;
  status: string;
};

export type SocialProofBadgeType =
  | "topRated"
  | "highPayouts"
  | "repeatBuyers"
  | "fastResponse"
  | "verified"
  | "earlyAdopter";

export type SocialProofBadgeEntry = {
  type: SocialProofBadgeType;
  label: string;
  tone: Tone;
  icon: string;
  criterion: string;
};

export type Supplier = {
  id: string;
  name: string;
  title: string;
  badges: SocialProofBadgeEntry[];
  region?: RegionInfo;
};

// ─── Holiday hints ──────────────────────────────────────────────────────────

export type RegionCode = string;

export type RegionInfo = {
  /** ISO 3166-1 alpha-2 country code (e.g. "US", "NG", "GB"). */
  code: RegionCode;
  /** Human-readable region name (e.g. "United States"). */
  name: string;
};

export type HolidayHint = {
  /** Unique identifier for this holiday occurrence. */
  id: string;
  /** Holiday name (e.g. "New Year's Day"). */
  name: string;
  /** ISO 8601 date string (e.g. "2027-01-01"). */
  date: string;
  /** Human-readable date label (e.g. "Jan 1, 2027"). */
  dateLabel: string;
  /** True when the holiday date shifts from year to year (e.g. Easter). */
  isMoving?: boolean;
};
