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
  /** Duration in minutes for this slot (used by duration filter chips) */
  durationMinutes?: number;
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

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  breakdown?: EarningsSegment[];
};

export type DraftStatus = "saved" | "saving" | "offline";
export type AutosaveStatus = "saving" | "saved" | "offline" | "error";

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

export type CalendarSyncProvider = {
  id: string;
  name: string;
  icon: string;
  description: string;
  scopes: string[];
};

export type CalendarDefinition = {
  id: string;
  providerId: string;
  title: string;
  description: string;
  color: string;
};

export type SyncDirection = "off" | "read" | "write" | "bidirectional";

export type AuthorizationState =
  | { status: "idle" }
  | { status: "connecting"; providerId: string }
  | { status: "authorizing"; providerId: string }
  | { status: "authorized"; providerId: string; calendars: CalendarDefinition[] }
  | { status: "denied"; providerId: string; deniedScopes: string[]; error: string };

export type QueuedActionStatus = "pending" | "retrying" | "completed" | "failed";

export type QueuedAction = {
  id: string;
  label: string;
  status: QueuedActionStatus;
  queuedAt: string;
  error?: string;
};

export type OfflineQueueConnectionState = "online" | "offline" | "reconnecting";

export type OfflineQueueState = {
  connection: OfflineQueueConnectionState;
  queue: QueuedAction[];
};

export type RefundDestination = "wallet" | "card";

export type RefundDestinationOption = {
  id: RefundDestination;
  label: string;
  description: string;
  eta: string;
  fee: string;
  icon: string;
  recommended?: boolean;
  badge?: string;
};

export type RefundDestinationSubmission = {
  destination: RefundDestination;
  option: RefundDestinationOption;
};

/** A single criterion in a rating breakdown (e.g. Communication, Expertise). */
export type RatingCriterion = {
  id: string;
  /** Short human-readable label such as "Communication" */
  label: string;
  /** Average score on a 1–5 scale */
  average: number;
  /** Number of reviews used to compute this average */
  count: number;
  /** Sequential-palette bar colour class, e.g. "bg-cyan-500" */
  colorClass: string;
};

export type SentimentBucket = "all" | "positive" | "mixed" | "critical";

export type SentimentCounts = {
  positive: number;
  mixed: number;
  critical: number;
};

export type SentimentDataPoint = {
  timestamp: string;
  positive: number;
  mixed: number;
  critical: number;
};
