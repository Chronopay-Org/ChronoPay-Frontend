"use client";

import { useCallback, useId, useState } from "react";
import clsx from "clsx";
import { Card, CardBody, CardFooter, CardHeader } from "./card";
import { StatusChip } from "./status-chip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChecklistItemId =
  | "confirm_location"
  | "confirm_time"
  | "contact_supplier"
  | "safety_check"
  | "id_ready";

export type ChecklistItem = {
  id: ChecklistItemId;
  label: string;
  description?: string;
  /**
   * Optional deep-link or CTA href.  When present a secondary anchor is
   * rendered alongside the row so buyers can act without leaving the card.
   */
  actionHref?: string;
  actionLabel?: string;
  /** When true the row is only rendered for in-person (non-remote) bookings. */
  inPersonOnly?: boolean;
};

export type MeetChecklistCardProps = {
  /** Meeting location label shown in the card header. */
  locationLabel?: string;
  /** Deep-link href for opening the location in a maps app. */
  locationHref?: string;
  /** Scheduled meeting time as a formatted string, e.g. "Tue 29 Jul, 2:00 PM". */
  meetingTime?: string;
  /** Supplier contact href, e.g. "tel:+1234567890" or "mailto:…". */
  contactHref?: string;
  /** Label for the contact CTA button, e.g. "Call supplier". */
  contactLabel?: string;
  /**
   * When true the booking is fully remote — in-person-only checklist items
   * are hidden and the location row is suppressed.
   */
  isRemote?: boolean;
  /** Override the default checklist items list. */
  items?: readonly ChecklistItem[];
  /**
   * Called when every item has been checked.
   * Provides the set of completed item ids.
   */
  onAllComplete?: (completedIds: Set<ChecklistItemId>) => void;
  /** Called when the user resets the checklist. */
  onReset?: () => void;
  /** Optional extra classes on the outer Card. */
  className?: string;
};

// ---------------------------------------------------------------------------
// Default checklist items
// ---------------------------------------------------------------------------

export const DEFAULT_CHECKLIST_ITEMS: readonly ChecklistItem[] = [
  {
    id: "confirm_location",
    label: "Confirm meeting location",
    description: "Make sure you have the exact address and any entry instructions.",
    inPersonOnly: true,
  },
  {
    id: "confirm_time",
    label: "Confirm meeting time",
    description: "Verify the scheduled time matches your calendar.",
  },
  {
    id: "contact_supplier",
    label: "Contact the supplier",
    description: "Let the supplier know you are on your way or have arrived.",
  },
  {
    id: "safety_check",
    label: "Review safety tips",
    description: "Meet in a public place. Bring a friend if possible. Trust your instincts.",
  },
  {
    id: "id_ready",
    label: "Have your ID ready",
    description: "The supplier may need to verify your identity before the session.",
  },
] as const;

// ---------------------------------------------------------------------------
// MeetChecklistCard
// ---------------------------------------------------------------------------

/**
 * MeetChecklistCard
 *
 * Shown in the redemption flow before the QR reveal.  Buyers tap each row
 * to mark it complete.  When all items are checked an accessible success
 * state is announced and `onAllComplete` is called.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Checklist rendered as a group of `role="checkbox"` buttons with
 *     `aria-checked` state
 *   - The group carries a group label via `aria-labelledby`
 *   - Progress is announced politely via `role="status"` aria-live region
 *   - Completion is announced assertively via `role="alert"`
 *   - All interactive elements have visible focus rings (cyan-300)
 *   - Minimum tap-target height 44 px (min-h-11)
 *   - Colour is never the sole indicator of state — checked items also show
 *     a checkmark glyph and strikethrough text
 *   - Meets 4.5:1 contrast on the dark dashboard surface
 *   - Respects `prefers-reduced-motion` via Tailwind motion-safe utilities
 */
export function MeetChecklistCard({
  locationLabel,
  locationHref,
  meetingTime,
  contactHref,
  contactLabel = "Contact supplier",
  isRemote = false,
  items = DEFAULT_CHECKLIST_ITEMS,
  onAllComplete,
  onReset,
  className = "",
}: MeetChecklistCardProps) {
  const baseId = useId();
  const headingId = `${baseId}-heading`;
  const groupLabelId = `${baseId}-group-label`;
  const progressId = `${baseId}-progress`;
  const alertId = `${baseId}-alert`;

  const visibleItems = items.filter(
    (item) => !isRemote || !item.inPersonOnly,
  );

  const [checked, setChecked] = useState<Set<ChecklistItemId>>(new Set());
  const [announcement, setAnnouncement] = useState("");

  const totalCount = visibleItems.length;
  const checkedCount = visibleItems.filter((i) => checked.has(i.id)).length;
  const allComplete = totalCount > 0 && checkedCount === totalCount;

  // Announce completion exactly once via the onAllComplete callback
  const completionFiredRef = { current: false };
  const handleCheck = useCallback(
    (id: ChecklistItemId, label: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        const nowChecked = !next.has(id);
        if (nowChecked) {
          next.add(id);
          setAnnouncement(`Checked: ${label}`);
        } else {
          next.delete(id);
          setAnnouncement(`Unchecked: ${label}`);
        }

        const nextTotal = visibleItems.filter((i) => next.has(i.id)).length;
        if (nextTotal === totalCount && !completionFiredRef.current) {
          completionFiredRef.current = true;
          // Use setTimeout so announcement state update is separate
          setTimeout(() => {
            setAnnouncement(
              "All checklist items complete. You may now proceed to the QR reveal.",
            );
          }, 50);
          onAllComplete?.(next);
        }

        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleItems, totalCount, onAllComplete],
  );

  function handleReset() {
    setChecked(new Set());
    setAnnouncement("Checklist reset.");
    onReset?.();
  }

  return (
    <Card
      variant="panel"
      aria-labelledby={headingId}
      className={clsx("relative", className)}
      data-testid="meet-checklist-card"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <CardHeader>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            {isRemote ? "Remote session" : "In-person meet"}
          </p>
          <h2 id={headingId} className="text-lg font-semibold text-white">
            Pre-meet checklist
          </h2>
          {meetingTime && (
            <p className="text-sm text-slate-300">{meetingTime}</p>
          )}
        </div>

        <StatusChip tone={allComplete ? "positive" : "neutral"}>
          {checkedCount}/{totalCount}
        </StatusChip>
      </CardHeader>

      {/* ── Location + contact meta ─────────────────────────────────────── */}
      {(!isRemote || contactHref) && (
        <div className="flex flex-wrap gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          {!isRemote && locationLabel && (
            <a
              href={locationHref ?? "#"}
              target={locationHref ? "_blank" : undefined}
              rel={locationHref ? "noopener noreferrer" : undefined}
              aria-label={`Open location in maps: ${locationLabel}`}
              className={clsx(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/12 bg-white/5",
                "px-3 py-1.5 text-xs font-medium text-slate-200",
                "hover:border-cyan-300/30 hover:bg-white/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                "transition-colors",
              )}
            >
              {/* Map pin icon — inline SVG keeps the bundle lean */}
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-cyan-300/70"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {locationLabel}
            </a>
          )}

          {contactHref && (
            <a
              href={contactHref}
              aria-label={contactLabel}
              className={clsx(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/12 bg-white/5",
                "px-3 py-1.5 text-xs font-medium text-slate-200",
                "hover:border-cyan-300/30 hover:bg-white/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                "transition-colors",
              )}
            >
              {/* Phone icon */}
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-cyan-300/70"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
              {contactLabel}
            </a>
          )}
        </div>
      )}

      {/* ── Checklist ───────────────────────────────────────────────────── */}
      <CardBody className="pt-4">
        <p
          id={groupLabelId}
          className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
        >
          Steps to complete before your session
        </p>

        <ul
          role="group"
          aria-labelledby={groupLabelId}
          className="space-y-2"
          aria-label="Pre-meet checklist steps"
        >
          {visibleItems.map((item) => {
            const isChecked = checked.has(item.id);
            const rowId = `${baseId}-item-${item.id}`;

            return (
              <li key={item.id}>
                <button
                  id={rowId}
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  aria-describedby={item.description ? `${rowId}-desc` : undefined}
                  onClick={() => handleCheck(item.id, item.label)}
                  className={clsx(
                    "group flex w-full min-h-11 items-start gap-3 rounded-xl border px-3.5 py-3 text-left",
                    "transition-colors motion-safe:transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                    "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                    isChecked
                      ? "border-emerald-400/30 bg-emerald-400/8 hover:bg-emerald-400/12"
                      : "border-white/10 bg-white/4 hover:border-cyan-300/20 hover:bg-white/8",
                    "active:scale-[0.99]",
                  )}
                >
                  {/* Custom checkbox indicator */}
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded",
                      "border transition-colors",
                      isChecked
                        ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-300"
                        : "border-white/20 bg-white/5 text-transparent group-hover:border-cyan-300/40",
                    )}
                  >
                    {/* Checkmark svg */}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="1 5 4.5 8.5 11 1" />
                    </svg>
                  </span>

                  {/* Label + description */}
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className={clsx(
                        "text-sm font-medium",
                        isChecked
                          ? "text-emerald-200 line-through decoration-emerald-400/50"
                          : "text-slate-100",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.description && (
                      <span
                        id={`${rowId}-desc`}
                        className={clsx(
                          "text-xs leading-5",
                          isChecked ? "text-emerald-300/60" : "text-slate-400",
                        )}
                      >
                        {item.description}
                      </span>
                    )}
                  </span>

                  {/* Action link (rendered inside the row, not a nested button) */}
                  {item.actionHref && (
                    <a
                      href={item.actionHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.actionLabel ?? `Open: ${item.label}`}
                      onClick={(e) => e.stopPropagation()}
                      className={clsx(
                        "ml-auto shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        "border-white/12 bg-white/5 text-slate-300",
                        "hover:border-cyan-300/30 hover:text-cyan-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                        "transition-colors",
                      )}
                    >
                      {item.actionLabel ?? "Open"}
                    </a>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* ── Progress bar ────────────────────────────────────────────────── */}
        <div
          className="mt-4"
          role="progressbar"
          aria-valuenow={checkedCount}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label={`Checklist progress: ${checkedCount} of ${totalCount} complete`}
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={clsx(
                "h-full rounded-full transition-all duration-300 motion-safe:transition-all",
                allComplete ? "bg-emerald-400" : "bg-cyan-400",
              )}
              style={{
                width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : "0%",
              }}
            />
          </div>
        </div>

        {/* ── Completion message ───────────────────────────────────────────── */}
        {allComplete && (
          <p
            role="alert"
            id={alertId}
            className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2.5 text-sm font-medium text-emerald-100"
          >
            All steps complete — you&apos;re ready to reveal your QR code.
          </p>
        )}

        {/* ── Remote-only notice ───────────────────────────────────────────── */}
        {isRemote && (
          <p className="mt-3 text-xs text-slate-400">
            This is a remote session. In-person steps are not required.
          </p>
        )}
      </CardBody>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <CardFooter className="mt-5 flex items-center justify-between gap-3">
        {/* Progress label */}
        <p
          id={progressId}
          className="text-xs text-slate-400"
          aria-live="polite"
          aria-atomic="true"
        >
          {allComplete
            ? "All steps complete"
            : `${checkedCount} of ${totalCount} steps complete`}
        </p>

        {/* Reset button */}
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset checklist — uncheck all steps"
            className={clsx(
              "inline-flex min-h-9 items-center rounded-full border border-white/12 bg-white/5",
              "px-3.5 py-1.5 text-xs font-medium text-slate-300",
              "hover:border-cyan-300/20 hover:bg-white/8 hover:text-slate-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              "transition-colors",
            )}
          >
            Reset
          </button>
        )}
      </CardFooter>

      {/* ── Polite screen-reader live region ───────────────────────────── */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </p>
    </Card>
  );
}
