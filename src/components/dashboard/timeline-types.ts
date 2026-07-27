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
};

export const statusToneMap: Record<TimelineItemStatus, Tone> = {
  pending: "neutral",
  completed: "success",
  failed: "danger",
  warning: "warning",
};
