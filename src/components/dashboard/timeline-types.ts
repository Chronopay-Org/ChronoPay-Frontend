import { Tone } from "./types";

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

export const statusToneMap: Record<TimelineItemStatus, Tone> = {
  pending: "neutral",
  completed: "success",
  failed: "danger",
  warning: "warning",
};
