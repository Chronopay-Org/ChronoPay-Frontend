"use client";

import { useState, useRef, useId } from "react";
import { TimelineItem, statusToneMap } from "./timeline-types";
import { StatusChip } from "../../app/components/ui/status-chip";
import { Filter } from "lucide-react";

interface StatusTimelineProps {
  items: TimelineItem[];
  /**
   * When provided, a GraceBanner is rendered above the timeline entries
   * showing a live countdown until the grace window expires.
   */
  graceExpiresAt?: number;
  /** Called when user clicks "Notify supplier" inside the banner */
  onNotifySupplier?: () => void;
  /** Called when the grace window expires */
  onGraceExpired?: () => void;
}

export function StatusTimeline({ items }: StatusTimelineProps) {
  const [milestonesOnly, setMilestonesOnly] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const scrollTopRef = useRef(0);
  const toggleId = useId();
  const statusId = useId();

  // Determine which items to display
  const displayedItems = milestonesOnly
    ? items.filter((item) => item.isMilestone)
    : items;

  const hasMilestones = items.some((item) => item.isMilestone);

  // ── Toggle handler with scroll preservation ────────────────────────────
  function handleToggle() {
    // Save scroll position before re-render
    if (listRef.current) {
      scrollTopRef.current = listRef.current.scrollTop;
    }

    const next = !milestonesOnly;
    setMilestonesOnly(next);

    // Announce mode change to screen readers
    setAnnouncement(
      next
        ? "Showing milestones only"
        : "Showing all timeline events",
    );

    // Restore scroll position after React commits the update
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = scrollTopRef.current;
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Toggle header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Timeline
          </span>
        </div>

        {hasMilestones && (
          <button
            id={toggleId}
            type="button"
            role="switch"
            aria-checked={milestonesOnly}
            aria-label={
              milestonesOnly
                ? "Show all timeline events"
                : "Show milestones only"
            }
            onClick={handleToggle}
            className={[
              "group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
              "transition-colors duration-200 ease-in-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
              milestonesOnly
                ? "bg-cyan-500"
                : "bg-white/10 hover:bg-white/20",
            ].join(" ")}
          >
            {/* Thumb */}
            <span
              aria-hidden="true"
              className={[
                "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0",
                "transition-transform duration-200 ease-in-out",
                milestonesOnly ? "translate-x-[22px]" : "translate-x-[2px]",
              ].join(" ")}
            />
          </button>
        )}
      </div>

      {/* ── Milestones-mode label for quick visual scan ──────────────────── */}
      {milestonesOnly && displayedItems.length > 0 && (
        <p
          className="text-xs text-cyan-400"
          aria-live="polite"
        >
          {displayedItems.length} milestone{displayedItems.length !== 1 ? "s" : ""} shown
        </p>
      )}

      {/* ── Timeline list ────────────────────────────────────────────────── */}        <ol
        ref={listRef}
        className="relative border-l border-white/10 ml-3 max-h-[600px] overflow-y-auto"
      >
        {displayedItems.map((item, index) => (
          <TimelineEntry
            key={item.id}
            item={item}
            isLast={index === displayedItems.length - 1}
          />
        ))}
      </ol>



      {/* ── Polite screen-reader announcement ───────────────────────────── */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </div>
  );
}

// ─── Timeline entry sub-component ─────────────────────────────────────────────

function TimelineEntry({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = !!item.details || !!item.actor;

  return (
    <li className={`mb-10 ml-6 ${isLast ? "mb-0" : ""}`}>
      {/* Dot indicator + milestone badge */}
      <span
        className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-slate-900 ${
          item.status === "completed" ? "bg-emerald-500" : "bg-slate-700"
        }`}
        aria-hidden="true"
      >
        {item.isMilestone && (
          <span className="h-2 w-2 rounded-full bg-white/80" />
        )}
      </span>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3
            className="text-sm font-semibold text-white"
            aria-current={item.isCurrent ? "step" : undefined}
          >
            {item.title}
            {item.isMilestone && (
              <span className="ml-2 inline-flex items-center rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300">
                Milestone
              </span>
            )}
          </h3>
          <StatusChip tone={statusToneMap[item.status]}>
            {item.status}
          </StatusChip>
        </div>
        <p className="text-sm text-slate-400">{item.timestamp}</p>

        {hasDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-left text-sm text-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
            aria-expanded={isExpanded}
            aria-controls={`details-${item.id}`}
          >
            {isExpanded ? "Hide Details" : "Show Details"}
          </button>
        )}
      </div>

      {isExpanded && hasDetails && (
        <div
          id={`details-${item.id}`}
          className="mt-3 p-3 rounded bg-white/5 text-sm text-slate-300"
          role="region"
          aria-label={`Details for ${item.title}`}
        >
          {item.actor && <p>Actor: {item.actor}</p>}
          {item.details && <p className="mt-1">{item.details}</p>}
          {item.id === 'kyc-liveness' && item.status === 'pending' && (
            <div className="mt-4">
              <KycLivenessCapture onCaptureComplete={() => {}} />
            </div>
          )}
        </div>
      )}
    </li>
  );
}
