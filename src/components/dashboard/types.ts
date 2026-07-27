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
};

// ─── Sentiment filter ─────────────────────────────────────────────────────────

/**
 * The three sentiment buckets a review can belong to.
 * "all" is the virtual unfiltered state.
 */
export type SentimentBucket = "all" | "positive" | "mixed" | "critical";

/** One data point in the sentiment sparkline series (one period = one week). */
export type SentimentDataPoint = {
  /** ISO date string for the period start, e.g. "2026-06-01" */
  period: string;
  positive: number;
  mixed: number;
  critical: number;
};

/** Review counts broken down by sentiment bucket. */
export type SentimentCounts = {
  positive: number;
  mixed: number;
  critical: number;
};
