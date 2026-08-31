export type Tone = "neutral" | "positive" | "warning" | "critical" | "muted";

export type AvailabilityLevel = "Healthy" | "Tight" | "Busy" | "Sold Out";

/** Booking lifecycle of a time-token. `active` (or omitted) is the default. */
export type LifecycleStatus = "active" | "cancelled" | "rescheduled";

export type Slot = {
  id: string;
  title: string;
  dateLabel: string;
  timeRange: string;
  demand: string;
  rate: string;
  status: AvailabilityLevel;
  /**
   * Booking lifecycle of the time-token. Cancelled / rescheduled tokens can
   * be rebooked through the rebooking flow; when omitted the token is active.
   */
  lifecycleStatus?: LifecycleStatus;
  /** Duration in minutes for this slot (used by duration filter chips) */
  durationMinutes?: number;
  isNextAvailable?: boolean;
  /** ISO 8601 string of when the slot was created */
  mintedAt?: string;
  /** When true, row is demo/onboarding content and must show a Sample badge. */
  isSample?: boolean;
  /** Human-readable hint of the next available time (shown for sold-out slots). */
  nextAvailableHint?: string;
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

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  breakdown?: EarningsSegment[];
  /** When true, the metric is demo/onboarding content and shows a Sample badge. */
  isSample?: boolean;
};

export type DraftStatus = "saved" | "saving" | "offline";
export type AutosaveStatus = "saving" | "saved" | "offline" | "error";

/**
 * A single service row in the supplier onboarding "services" step.
 * Price is in XLM, duration must be a multiple of 15 minutes.
 */
export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  basePriceXLM: number;
  durationMinutes: number;
};

/** Status of a single booking-completion checklist step. */
export type ChecklistStepStatus =
  | "done"
  | "active"
  | "blocked"
  | "skipped"
  | "pending";

/** A single step in the booking-completion checklist. */
export type ChecklistStep = {
  id: string;
  label: string;
  status: ChecklistStepStatus;
  description?: string;
  optional?: boolean;
};

/** Derived summary of a booking-completion checklist. */
export type ChecklistSummary = {
  total: number;
  done: number;
  active: number;
  blocked: number;
  skipped: number;
  pending: number;
  progress: number;
};

/** A single field-level change recorded in a calendar-sync conflict. */
export type ConflictFieldChange = {
  field: string;
  localValue: string;
  remoteValue: string;
};

/** A calendar-sync conflict between a local and a remote event. */
export type SyncConflict = {
  id: string;
  eventTitle: string;
  dateTime: string;
  localChanges: ConflictFieldChange[];
  remoteChanges: ConflictFieldChange[];
};

/** How the user chooses to resolve a calendar-sync conflict. */
export type ResolutionStrategy = "useLocal" | "useRemote" | "merge";

/** A single resolved conflict, ready to be applied. */
export type ConflictResolution = {
  conflictId: string;
  strategy: ResolutionStrategy;
};

export type BookingStage = {
  label: string;
  value: number;
};

export type WalletHoldingStatus = "available" | "escrowed" | "redeemed";

export type WalletHolding = {
  id: string;
  title: string;
  amount: string;
  detail: string;
  status: WalletHoldingStatus;
};

export type WalletActivityEntry = {
  id: string;
  type: "mint" | "transfer" | "redemption" | "settlement";
  title: string;
  amount: string;
  date: string;
  detail: string;
};

export type WalletLifetimeStats = {
  totalMinted: string;
  totalTraded: string;
  totalRedeemed: string;
  transactionCount: number;
  accountAge: string;
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

export type RegionInfo = {
  country: string;
  countryCode?: string;
  timezone?: string;
  currency?: string;
  /** Display name of the region (e.g. "United States"). */
  name?: string;
  /** ISO region code (e.g. "US"). */
  code?: string;
};

/** An upcoming public holiday shown as a hint in the dashboard. */
export type HolidayHint = {
  id: string;
  name: string;
  /** ISO date string (yyyy-mm-dd). */
  date: string;
  /** Human-readable date label (e.g. "Jan 1, 2027"). */
  dateLabel: string;
  /** When true the holiday falls on a different date each year. */
  isMoving?: boolean;
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

/** Supplier trust metric with sparkline history */
export type TrustMetric = {
  id: string;
  label: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "stable";
  history: { values: number[] };
  tooltip: string;
  tone: Tone;
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
