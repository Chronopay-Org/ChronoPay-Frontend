"use client";

import React, { useState, useRef, useCallback, useEffect, useId } from "react";
import { clsx } from "clsx";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Scissors,
  XCircle,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Focus,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { LiveRegion } from "@/components/common/LiveRegion";

/**
 * Type of availability conflict.
 */
export type ConflictType =
  | "booking_overlap"
  | "block_overlap"
  | "double_booking"
  | "buffer_violation";

/**
 * Severity level of an availability conflict.
 */
export type ConflictSeverity = "critical" | "warning" | "info";

/**
 * Primary resolution actions available for a conflict.
 */
export type ResolutionType = "shift" | "split" | "cancel";

/**
 * Represents a single availability collision between a new/incoming block and an existing booking or slot.
 */
export interface AvailabilityConflict {
  /** Unique conflict identifier */
  id: string;
  /** Title or name of the new/incoming block that collides */
  incomingBlockTitle: string;
  /** Time range of the incoming block, e.g. "Today, 14:15 - 15:15 UTC" */
  incomingTimeRange: string;
  /** Optional ID of existing slot or booking */
  collidingSlotId?: string;
  /** Title of colliding existing booking or slot */
  collidingTitle: string;
  /** Time range of colliding slot, e.g. "Today, 14:00 - 15:00 UTC" */
  collidingTimeRange: string;
  /** Specific conflict classification */
  conflictType: ConflictType;
  /** Severity level determines card color scheme & icon */
  severity: ConflictSeverity;
  /** Clear human-readable description of what is colliding */
  description: string;
  /** Suggested shift time range for one-tap resolution */
  suggestedShiftTimeRange?: string;
  /** Suggested split ranges for one-tap resolution */
  suggestedSplitRanges?: string[];
  /** ID of affected slot element in calendar/list for focus transfer */
  affectedSlotId?: string;
}

/**
 * Payload delivered when a conflict resolution action is performed.
 */
export interface ConflictResolutionEvent {
  conflictId: string;
  action: ResolutionType;
  conflict: AvailabilityConflict;
  details?: {
    shiftedTimeRange?: string;
    splitTimeRanges?: string[];
  };
}

export interface AvailabilityConflictDetectorProps {
  /** List of active conflicts to display */
  conflicts?: AvailabilityConflict[];
  /** Callback fired when a resolution action (shift, split, cancel) is triggered */
  onResolveConflict?: (event: ConflictResolutionEvent) => void;
  /** Callback fired when a conflict card is dismissed by user */
  onDismissConflict?: (conflictId: string) => void;
  /** Callback fired when a previously applied resolution is undone */
  onUndoResolution?: (lastResolution: ConflictResolutionEvent) => void;
  /** Callback fired when transferring focus to the affected calendar cell/slot element */
  onFocusAffectedSlot?: (slotId: string) => void;
  /** Title displayed in the card header */
  title?: string;
  /** Render compact inline variant */
  compact?: boolean;
  /** Custom additional styling class names */
  className?: string;
}

/**
 * Default sample availability conflicts for demonstration & standalone usage.
 */
export const DEFAULT_AVAILABILITY_CONFLICTS: AvailabilityConflict[] = [
  {
    id: "conflict-1",
    incomingBlockTitle: "Team Strategy & Alignment Block",
    incomingTimeRange: "Today, 14:15 - 15:15 UTC",
    collidingSlotId: "slot-1",
    collidingTitle: "1-on-1 Architecture Consultation",
    collidingTimeRange: "Today, 14:00 - 15:00 UTC",
    conflictType: "booking_overlap",
    severity: "critical",
    description: "Overlaps by 45 minutes with confirmed booking '1-on-1 Architecture Consultation'.",
    suggestedShiftTimeRange: "Today, 15:15 - 16:15 UTC",
    suggestedSplitRanges: ["Today, 15:00 - 15:15 UTC (15m window)"],
    affectedSlotId: "slot-1",
  },
  {
    id: "conflict-2",
    incomingBlockTitle: "Smart Contract Audit Slot",
    incomingTimeRange: "Tomorrow, 10:30 - 11:30 UTC",
    collidingSlotId: "slot-2",
    collidingTitle: "Code Review & Optimization",
    collidingTimeRange: "Tomorrow, 10:00 - 11:30 UTC",
    conflictType: "double_booking",
    severity: "warning",
    description: "Direct double-booking with scheduled slot 'Code Review & Optimization'.",
    suggestedShiftTimeRange: "Tomorrow, 11:30 - 12:30 UTC",
    suggestedSplitRanges: ["Tomorrow, 11:30 - 12:00 UTC (30m window)"],
    affectedSlotId: "slot-2",
  },
];

const severityConfig: Record<
  ConflictSeverity,
  {
    badgeLabel: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
    badgeBgClass: string;
    IconComponent: React.ComponentType<{ className?: string }>;
  }
> = {
  critical: {
    badgeLabel: "Critical Overlap",
    borderClass: "border-rose-500/30",
    bgClass: "bg-rose-950/20",
    textClass: "text-rose-300",
    badgeBgClass: "bg-rose-500/20 text-rose-200 border-rose-500/30",
    IconComponent: AlertCircle,
  },
  warning: {
    badgeLabel: "Warning Overlap",
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-950/20",
    textClass: "text-amber-300",
    badgeBgClass: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    IconComponent: AlertTriangle,
  },
  info: {
    badgeLabel: "Info Notice",
    borderClass: "border-cyan-500/30",
    bgClass: "bg-cyan-950/20",
    textClass: "text-cyan-300",
    badgeBgClass: "bg-cyan-500/20 text-cyan-200 border-cyan-500/30",
    IconComponent: Info,
  },
};

/**
 * AvailabilityConflictDetector
 *
 * An accessible (WCAG 2.1 AA compliant), responsive inline card component that detects availability collisions
 * between new blocks and existing bookings/slots, presenting one-tap resolution actions (shift, split, cancel).
 */
export const AvailabilityConflictDetector: React.FC<AvailabilityConflictDetectorProps> = ({
  conflicts = DEFAULT_AVAILABILITY_CONFLICTS,
  onResolveConflict,
  onDismissConflict,
  onUndoResolution,
  onFocusAffectedSlot,
  title = "Availability Conflict Detector",
  compact = false,
  className,
}) => {
  const cardId = useId();
  const cardTitleId = useId();
  const cardDescId = useId();
  const cardRef = useRef<HTMLDivElement>(null);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [resolvedMap, setResolvedMap] = useState<Map<string, ConflictResolutionEvent>>(new Map());
  const [activeConflictIndex, setActiveConflictIndex] = useState<number>(0);
  const [lastResolution, setLastResolution] = useState<ConflictResolutionEvent | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
  }, []);

  // Filter out dismissed or resolved conflicts
  const activeConflicts = conflicts.filter(
    (c) => !dismissedIds.has(c.id) && !resolvedMap.has(c.id)
  );

  // Clamp active index if conflicts length changes
  useEffect(() => {
    if (activeConflicts.length > 0 && activeConflictIndex >= activeConflicts.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveConflictIndex(Math.max(0, activeConflicts.length - 1));
    }
  }, [activeConflicts.length, activeConflictIndex]);

  // Initial announcement
  useEffect(() => {
    if (activeConflicts.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      announce(
        `Availability conflict detector active. ${activeConflicts.length} conflict${
          activeConflicts.length > 1 ? "s" : ""
        } detected.`
      );
    }
  }, [activeConflicts.length, announce]);

  const currentConflict = activeConflicts[activeConflictIndex] ?? null;

  const handleFocusAffectedSlot = useCallback(() => {
    if (currentConflict?.affectedSlotId) {
      announce(`Focusing affected slot ${currentConflict.affectedSlotId}.`);
      onFocusAffectedSlot?.(currentConflict.affectedSlotId);
      // Attempt DOM scroll/focus if element exists
      const el = document.getElementById(currentConflict.affectedSlotId);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentConflict, onFocusAffectedSlot, announce]);

  const handleResolve = useCallback(
    (action: ResolutionType) => {
      if (!currentConflict) return;

      const event: ConflictResolutionEvent = {
        conflictId: currentConflict.id,
        action,
        conflict: currentConflict,
        details: {
          shiftedTimeRange: action === "shift" ? currentConflict.suggestedShiftTimeRange : undefined,
          splitTimeRanges: action === "split" ? currentConflict.suggestedSplitRanges : undefined,
        },
      };

      setResolvedMap((prev) => new Map(prev).set(currentConflict.id, event));
      setLastResolution(event);

      const actionText =
        action === "shift"
          ? `Shifted to ${currentConflict.suggestedShiftTimeRange ?? "new time slot"}`
          : action === "split"
          ? "Split block around booking"
          : "Cancelled conflicting block";

      announce(`Conflict '${currentConflict.incomingBlockTitle}' resolved: ${actionText}. Press Undo to restore.`);
      onResolveConflict?.(event);
    },
    [currentConflict, onResolveConflict, announce]
  );

  const handleDismiss = useCallback(
    (id?: string) => {
      const targetId = id || currentConflict?.id;
      if (!targetId) return;

      setDismissedIds((prev) => new Set(prev).add(targetId));
      announce("Conflict notice dismissed. You can reconsider later.");
      onDismissConflict?.(targetId);
    },
    [currentConflict, onDismissConflict, announce]
  );

  const handleUndo = useCallback(() => {
    if (!lastResolution) return;

    setResolvedMap((prev) => {
      const next = new Map(prev);
      next.delete(lastResolution.conflictId);
      return next;
    });

    const undone = lastResolution;
    setLastResolution(null);
    announce(`Undone resolution for '${undone.conflict.incomingBlockTitle}'. Conflict restored.`);
    onUndoResolution?.(undone);
  }, [lastResolution, onUndoResolution, announce]);

  const handlePrev = useCallback(() => {
    if (activeConflictIndex > 0) {
      const nextIdx = activeConflictIndex - 1;
      setActiveConflictIndex(nextIdx);
      announce(`Viewing conflict ${nextIdx + 1} of ${activeConflicts.length}`);
    }
  }, [activeConflictIndex, activeConflicts.length, announce]);

  const handleNext = useCallback(() => {
    if (activeConflictIndex < activeConflicts.length - 1) {
      const nextIdx = activeConflictIndex + 1;
      setActiveConflictIndex(nextIdx);
      announce(`Viewing conflict ${nextIdx + 1} of ${activeConflicts.length}`);
    }
  }, [activeConflictIndex, activeConflicts.length, announce]);

  // Keyboard navigation for carousel/stepping
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    },
    [handlePrev, handleNext]
  );

  // If no conflicts or all resolved/dismissed (and no active undo banner), render clean state
  if (activeConflicts.length === 0 && !lastResolution) {
    return null;
  }

  // If all active conflicts resolved but Undo banner is active
  if (!currentConflict && lastResolution) {
    return (
      <div
        className={clsx(
          "rounded-[1.5rem] border border-cyan-400/30 bg-cyan-950/30 p-4 text-cyan-200 transition-all",
          className
        )}
      >
        <LiveRegion>{announcement}</LiveRegion>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" aria-hidden="true" />
            <span>
              Resolved <strong>{lastResolution.conflict.incomingBlockTitle}</strong> via{" "}
              <span className="capitalize">{lastResolution.action}</span> action.
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-400/20 px-3.5 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors"
            aria-label={`Undo ${lastResolution.action} resolution for ${lastResolution.conflict.incomingBlockTitle}`}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Undo Resolution
          </button>
        </div>
      </div>
    );
  }

  if (!currentConflict) return null;

  const severity = severityConfig[currentConflict.severity] || severityConfig.warning;
  const { IconComponent } = severity;

  return (
    <section
      ref={cardRef}
      tabIndex={0}
      id={cardId}
      aria-labelledby={cardTitleId}
      aria-describedby={cardDescId}
      onKeyDown={handleKeyDown}
      className={clsx(
        "relative rounded-[1.5rem] border backdrop-blur p-4 sm:p-5 transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        severity.borderClass,
        severity.bgClass,
        className
      )}
    >
      <LiveRegion>{announcement}</LiveRegion>

      {/* Undo Banner overlay if a previous resolution was completed */}
      {lastResolution && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-cyan-950/40 p-2.5 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
            <span>
              Action &apos;<span className="capitalize">{lastResolution.action}</span>&apos; applied to{" "}
              <strong>{lastResolution.conflict.incomingBlockTitle}</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/20 px-2.5 py-1 font-semibold text-cyan-100 hover:bg-cyan-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Undo
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={clsx(
              "shrink-0 rounded-xl border p-2.5 mt-0.5",
              severity.badgeBgClass
            )}
            aria-hidden="true"
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id={cardTitleId} className="text-base font-semibold text-white">
                {title}
              </h3>
              <span
                className={clsx(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
                  severity.badgeBgClass
                )}
              >
                {severity.badgeLabel}
              </span>
            </div>

            <p id={cardDescId} className="text-xs text-slate-300">
              {currentConflict.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Stepper if multiple conflicts exist */}
          {activeConflicts.length > 1 && (
            <div className="flex items-center gap-1 mr-1 text-xs text-slate-400" role="group" aria-label="Conflict pagination">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeConflictIndex === 0}
                aria-label="Previous conflict"
                className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="px-1 text-slate-300 font-medium">
                {activeConflictIndex + 1}/{activeConflicts.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeConflictIndex === activeConflicts.length - 1}
                aria-label="Next conflict"
                className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => handleDismiss(currentConflict.id)}
            aria-label={`Dismiss conflict notice for ${currentConflict.incomingBlockTitle}`}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Collision Details Breakdown */}
      <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-white/10 pb-2 sm:pb-0 sm:pr-3">
            <span className="font-semibold text-rose-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
              New Incoming Block
            </span>
            <div className="font-medium text-white">{currentConflict.incomingBlockTitle}</div>
            <div className="text-slate-400">{currentConflict.incomingTimeRange}</div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              Colliding Booking / Slot
            </span>
            <div className="font-medium text-white">{currentConflict.collidingTitle}</div>
            <div className="text-slate-400">{currentConflict.collidingTimeRange}</div>
          </div>
        </div>

        {/* Focus affected calendar cell button */}
        {currentConflict.affectedSlotId && (
          <div className="pt-2 border-t border-white/6 flex justify-end">
            <button
              type="button"
              onClick={handleFocusAffectedSlot}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
              aria-label={`Focus affected slot element ${currentConflict.collidingTitle}`}
            >
              <Focus className="h-3.5 w-3.5" aria-hidden="true" />
              Focus Affected Calendar Cell
            </button>
          </div>
        )}
      </div>

      {/* One-Tap Resolution Actions */}
      <div className="mt-4 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          One-Tap Resolution Suggestions
        </span>

        <div className={clsx("grid gap-2.5", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3")}>
          {/* Shift Resolution Button */}
          <button
            type="button"
            onClick={() => handleResolve("shift")}
            aria-label={`Shift block to ${currentConflict.suggestedShiftTimeRange ?? "next open slot"}`}
            className="group flex flex-col items-start justify-between rounded-xl border border-cyan-400/30 bg-cyan-950/40 p-3 text-left transition-all hover:border-cyan-400 hover:bg-cyan-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs group-hover:text-cyan-200">
              <Clock className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
              <span>Shift Block</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300 leading-tight">
              {currentConflict.suggestedShiftTimeRange
                ? `Shift to ${currentConflict.suggestedShiftTimeRange}`
                : "Shift to next available open window"}
            </p>
          </button>

          {/* Split Resolution Button */}
          <button
            type="button"
            onClick={() => handleResolve("split")}
            aria-label={`Split block around ${currentConflict.collidingTitle}`}
            className="group flex flex-col items-start justify-between rounded-xl border border-amber-400/30 bg-amber-950/40 p-3 text-left transition-all hover:border-amber-400 hover:bg-amber-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs group-hover:text-amber-200">
              <Scissors className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
              <span>Split Block</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300 leading-tight">
              {currentConflict.suggestedSplitRanges && currentConflict.suggestedSplitRanges.length > 0
                ? `Split into available windows (${currentConflict.suggestedSplitRanges.length})`
                : "Split into non-conflicting time chunks"}
            </p>
          </button>

          {/* Cancel Resolution Button */}
          <button
            type="button"
            onClick={() => handleResolve("cancel")}
            aria-label={`Cancel incoming block ${currentConflict.incomingBlockTitle}`}
            className="group flex flex-col items-start justify-between rounded-xl border border-rose-400/30 bg-rose-950/40 p-3 text-left transition-all hover:border-rose-400 hover:bg-rose-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs group-hover:text-rose-200">
              <XCircle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
              <span>Cancel Block</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300 leading-tight">
              Discard incoming block & keep existing booking
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};
