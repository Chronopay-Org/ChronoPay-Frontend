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
