export type TimelineItemStatus = "pending" | "completed" | "failed" | "warning";

export type TimelineItemVariant = "default" | "mediator_assigned";

export type MediatorAssignmentDetails = {
  name: string;
  responseSlaLabel?: string;
  responseDueLabel?: string;
  slaProgress?: number;
  directMessageHref?: string;
  directMessageLabel?: string;
};

export type TimelineItem = {
  id: string;
  title: string;
  status: TimelineItemStatus;
  timestamp: string;
  variant?: TimelineItemVariant;
  actor?: string;
  details?: string;
  mediator?: MediatorAssignmentDetails;
  isCurrent?: boolean;
  /**
   * Flags this event as a high-signal milestone.
   * When the "Milestones only" toggle is active, only items with
   * `isMilestone: true` are shown. Useful for auditors and quick-scan reviews.
   */
  isMilestone?: boolean;
};

/**
 * A fork point in the timeline where the process splits into multiple parallel
 * tracks (e.g., a dispute and a refund proceeding independently). Each branch
 * is an independent sequence of events. When `rejoinLabel` is set, a visual
 * rejoin marker is rendered after the branch items.
 */
export type TimelineBranchGroup = {
  type: "branch-group";
  id: string;
  /** Label shown at the fork point describing why the timeline branched. */
  label: string;
  /** Parallel branches — each inner array is one independent track of events. */
  branches: TimelineItem[][];
  /**
   * Optional label at the convergence / rejoin point (e.g. "Dispute resolved").
   * When omitted the branch group ends without a rejoin marker.
   */
  rejoinLabel?: string;
};

/**
 * Union type for items that can appear in the timeline data.
 * Individual events are `TimelineItem`; fork points are `TimelineBranchGroup`.
 */
export type TimelineNode = TimelineItem | TimelineBranchGroup;

export const statusToneMap = {
  pending: "neutral",
  completed: "positive",
  failed: "critical",
  warning: "warning",
} as const satisfies Record<TimelineItemStatus, "neutral" | "positive" | "warning" | "critical" | "muted">;

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
