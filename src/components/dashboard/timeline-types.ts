export type TimelineItemStatus = "pending" | "completed" | "failed" | "warning";

export type TimelineItem = {
  id: string;
  title: string;
  status: TimelineItemStatus;
  timestamp: string;
  actor?: string;
  details?: string;
  isCurrent?: boolean;
  /**
   * Flags this event as a high-signal milestone.
   * When the "Milestones only" toggle is active, only items with
   * `isMilestone: true` are shown. Useful for auditors and quick-scan reviews.
   */
  isMilestone?: boolean;
};

export const statusToneMap = {
  pending: "neutral",
  completed: "positive",
  failed: "critical",
  warning: "warning",
} as const satisfies Record<TimelineItemStatus, "info" | "warning" | "success" | "danger" | "neutral">;

// ─── KYC-specific types ──────────────────────────────────────────────────────

export type KycStage = "submitted" | "reviewing" | "needs_info" | "rejected" | "verified";

export type KycTimelineEntry = {
  id: string;
  title: string;
  stage: KycStage;
  timestamp: string;
  actor?: string;
  details?: string;
  /** Marks the currently active KYC stage. Only one entry should have this set. */
  isCurrent?: boolean;
};

/** Status chip tone for each KYC stage. */
export const kycStageToneMap: Record<KycStage, "info" | "warning" | "success" | "danger" | "neutral"> = {
  submitted: "neutral",
  reviewing: "info",
  needs_info: "warning",
  rejected: "danger",
  verified: "success",
};

export type KycPromptPanel = {
  /** Heading for the prompt panel (e.g. "Additional information required"). */
  title: string;
  /** Plain-language explanation of what the user must do. */
  description: string;
  /** Deep-link href to the document upload step. */
  uploadHref: string;
  /** List of guidance bullets shown below the description. */
  guidance: string[];
};
