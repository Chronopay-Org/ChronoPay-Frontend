export type Tone = "neutral" | "positive" | "warning" | "critical" | "muted";

export type AvailabilityLevel = "Healthy" | "Tight" | "Busy" | "Sold Out";

export type Slot = {
  id: string;
  title: string;
  dateLabel: string;
  timeRange: string;
  demand: string;
  rate: string;
  status: AvailabilityLevel;
  isNextAvailable?: boolean;
  /** When true, row is demo/onboarding content and must show a Sample badge. */
  isSample?: boolean;
  badges?: SocialProofBadgeEntry[];
};

export type QuickAction = {
  title: string;
  description: string;
  href: string;
  tone: Tone;
  icon: string;
};

export type EarningsSegment = {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  colorClass: string;
};

export type EarningsSegment = {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  colorClass: string;
};

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  breakdown?: EarningsSegment[];
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
  | "verifiedPayouts"
  | "earlyAdopter";

export type SocialProofBadgeEntry = {
  type: SocialProofBadgeType;
  label: string;
  tone: Tone;
  icon: string;
  criterion: string;
  explainerKey?: string;
};

export type Supplier = {
  id: string;
  name: string;
  title: string;
  badges: SocialProofBadgeEntry[];
  region?: RegionInfo;
};

/**
 * ServiceItem — a single row in the supplier "Services & Pricing" repeater.
 *
 * Each service represents a bookable offering with its own base price, duration,
 * and description. The `id` is stable across renders so reorders, updates, and
 * deletions correctly target a single row.
 */
export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  /** Base rate in XLM (Lumens). Decimals are allowed up to 2 places. */
  basePriceXLM: number;
  /** Duration of one session in minutes. Must be a positive multiple of 15. */
  durationMinutes: number;
};

/**
 * Draft status surfaced in the supplier onboarding step header.
 * Mirrors the three states listed in `docs/save-resume-drafts-ux.md`.
 */
export type DraftStatus = "saved" | "saving" | "offline";
