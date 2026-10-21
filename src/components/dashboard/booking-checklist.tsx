"use client";

/**
 * BookingChecklist
 *
 * A persistent step-by-step checklist that shows which booking actions are
 * done, in-progress, blocked, or skipped so the user always knows how far
 * they are before wallet handoff.
 *
 * Layout behaviour
 * ─────────────────
 * • Desktop (≥ lg): sticky `position: sticky; top: 1.5rem` inside its parent
 *   grid column so it stays visible while the rest of the page scrolls.
 * • Mobile (< lg): rendered as a collapsible disclosure. The header row shows
 *   a compact progress pill and a chevron; the step list animates open/closed.
 *
 * Accessibility
 * ─────────────
 * • Step list: `role="list"` → each step is `role="listitem"`.
 * • The current active step carries `aria-current="step"`.
 * • A visually-hidden `role="status" aria-live="polite"` region announces when
 *   step status changes so screen readers hear the update without focus disruption.
 * • The mobile collapse toggle uses `aria-expanded` and `aria-controls`.
 * • All icon elements are `aria-hidden`.
 * • Focus rings follow the project's cyan `focus-visible:ring-2` pattern.
 *
 * Usage
 * ─────
 * ```tsx
 * import { BookingChecklist } from "@/components/dashboard";
 *
 * <BookingChecklist
 *   title="Complete your booking"
 *   steps={mySteps}
 *   onStepClick={(step) => navigate(`/booking/${step.id}`)}
 * />
 * ```
 */

import {
  useId,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import clsx from "clsx";
import {
  Check,
  Loader2,
  AlertTriangle,
  MinusCircle,
  Circle,
  ChevronDown,
} from "lucide-react";
import type { ChecklistStep, ChecklistStepStatus, ChecklistSummary } from "./types";

// ─── Re-export types so consumers can import from the same barrel ──────────────
export type { ChecklistStep, ChecklistStepStatus, ChecklistSummary };

// ─── Public API ───────────────────────────────────────────────────────────────

export interface BookingChecklistProps {
  /** Panel heading. */
  title?: string;
  /** Optional sub-heading / eyebrow label above the title. */
  eyebrow?: string;
  /** Ordered list of checklist steps. */
  steps: ChecklistStep[];
  /**
   * Called when the user clicks an interactive step row.
   * If omitted, rows are purely presentational.
   */
  onStepClick?: (step: ChecklistStep) => void;
  /**
   * When true the panel wraps itself in a `PanelShell`-compatible card
   * (rounded border, backdrop-blur). Default: true.
   */
  withCard?: boolean;
  /** Extra CSS classes applied to the outermost element. */
  className?: string;
  /**
   * Mobile-collapse default.  When true the step list starts collapsed on
   * small viewports.  Default: true.
   */
  defaultCollapsed?: boolean;
}

// ─── Status icon map ──────────────────────────────────────────────────────────

interface StatusIconProps {
  status: ChecklistStepStatus;
  className?: string;
}

function StatusIcon({ status, className }: StatusIconProps) {
  const base = clsx("h-5 w-5 shrink-0", className);

  switch (status) {
    case "done":
      return (
        <span
          className={clsx(
            base,
            "flex items-center justify-center rounded-full bg-emerald-500",
          )}
          aria-hidden="true"
        >
          <Check className="h-3 w-3 text-white stroke-[3]" />
        </span>
      );

    case "active":
      return (
        <Loader2
          className={clsx(base, "animate-spin text-cyan-400")}
          aria-hidden="true"
        />
      );

    case "blocked":
      return (
        <AlertTriangle
          className={clsx(base, "text-amber-400")}
          aria-hidden="true"
        />
      );

    case "skipped":
      return (
        <MinusCircle
          className={clsx(base, "text-slate-500")}
          aria-hidden="true"
        />
      );

    case "pending":
    default:
      return (
        <Circle
          className={clsx(base, "text-slate-600")}
          aria-hidden="true"
        />
      );
  }
}

// ─── Status label / tone ──────────────────────────────────────────────────────

const STATUS_LABEL: Record<ChecklistStepStatus, string> = {
  done: "Done",
  active: "In progress",
  blocked: "Blocked",
  skipped: "Skipped",
  pending: "Pending",
};

const STATUS_PILL_CLASSES: Record<ChecklistStepStatus, string> = {
  done: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  active: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  blocked: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  skipped: "border-slate-500/30 bg-slate-500/10 text-slate-400",
  pending: "border-white/10 bg-white/5 text-slate-500",
};

const STATUS_LABEL_CLASSES: Record<ChecklistStepStatus, string> = {
  done: "text-slate-300",
  active: "text-white font-semibold",
  blocked: "text-amber-200",
  skipped: "text-slate-500 line-through",
  pending: "text-slate-400",
};

// ─── Helper: derive summary ────────────────────────────────────────────────────

export function deriveChecklistSummary(steps: ChecklistStep[]): ChecklistSummary {
  const total = steps.length;
  const done = steps.filter((s) => s.status === "done").length;
  const active = steps.filter((s) => s.status === "active").length;
  const blocked = steps.filter((s) => s.status === "blocked").length;
  const skipped = steps.filter((s) => s.status === "skipped").length;
  const pending = steps.filter((s) => s.status === "pending").length;

  // Progress: done + skipped-optional count toward completion
  const countTowardsDone = steps.filter(
    (s) => s.status === "done" || (s.status === "skipped" && s.optional),
  ).length;
  const progress = total === 0 ? 0 : countTowardsDone / total;

  return { total, done, active, blocked, skipped, pending, progress };
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Booking completion ${pct}%`}
      className="h-1.5 w-full rounded-full bg-white/10"
    >
      <div
        className="h-1.5 rounded-full bg-[linear-gradient(90deg,#67e8f9,#22c55e)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Individual step row ──────────────────────────────────────────────────────

interface StepRowProps {
  step: ChecklistStep;
  onClick?: (step: ChecklistStep) => void;
  labelId: string;
  descId?: string;
}

function StepRow({ step, onClick, labelId, descId }: StepRowProps) {
  const isInteractive = !!onClick && step.status !== "pending";

  const innerContent: ReactNode = (
    <>
      <StatusIcon status={step.status} />

      <div className="min-w-0 flex-1">
        <p
          id={labelId}
          className={clsx(
            "truncate text-sm leading-5",
            STATUS_LABEL_CLASSES[step.status],
          )}
        >
          {step.label}
          {step.optional && (
            <span className="ml-1.5 text-xs text-slate-500">(optional)</span>
          )}
        </p>
        {step.description && (
          <p
            id={descId}
            className="mt-0.5 text-xs leading-4 text-slate-400"
          >
            {step.description}
          </p>
        )}
      </div>

      <span
        className={clsx(
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
          STATUS_PILL_CLASSES[step.status],
        )}
        aria-hidden="true"
      >
        {STATUS_LABEL[step.status]}
      </span>
    </>
  );

  const sharedClasses = clsx(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
    "transition-colors duration-150",
    isInteractive && [
      "cursor-pointer",
      "hover:bg-white/5 active:bg-white/8",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    ],
    !isInteractive && "cursor-default",
  );

  const ariaProps = {
    "aria-current": step.status === "active" ? ("step" as const) : undefined,
    "aria-labelledby": labelId,
    "aria-describedby": descId,
  };

  if (isInteractive) {
    return (
      <button
        type="button"
        className={sharedClasses}
        onClick={() => onClick(step)}
        {...ariaProps}
      >
        {innerContent}
      </button>
    );
  }

  return (
    <div className={sharedClasses} {...ariaProps}>
      {innerContent}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingChecklist({
  title = "Booking checklist",
  eyebrow,
  steps,
  onStepClick,
  withCard = true,
  className,
  defaultCollapsed = true,
}: BookingChecklistProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const announcerId = `${uid}-announcer`;

  // Mobile collapse state
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const toggleCollapse = useCallback(() => setIsOpen((o) => !o), []);

  // Live announcements when step statuses change
  const [announcement, setAnnouncement] = useState("");
  const prevStatusRef = useRef<Record<string, ChecklistStepStatus>>({});

  useEffect(() => {
    const prev = prevStatusRef.current;
    const messages: string[] = [];

    for (const step of steps) {
      const prevStatus = prev[step.id];
      if (prevStatus !== undefined && prevStatus !== step.status) {
        messages.push(
          `${step.label}: ${STATUS_LABEL[step.status]}`,
        );
      }
    }

    // Update the ref for next comparison
    prevStatusRef.current = Object.fromEntries(
      steps.map((s) => [s.id, s.status]),
    );

    // Set the announcement after the ref update so we never announce on mount
    if (messages.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnnouncement(messages.join(". "));
    }
  }, [steps]);

  const summary = deriveChecklistSummary(steps);
  const pct = Math.round(summary.progress * 100);

  // ── Outer card wrapper ────────────────────────────────────────────────────
  const cardClasses = clsx(
    withCard &&
      "rounded-[28px] border border-white/10 bg-slate-950/70 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur",
    "lg:sticky lg:top-6",
    className,
  );

  // ── Header ────────────────────────────────────────────────────────────────
  const titleId = `${uid}-title`;

  const headerContent = (
    <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 xl:px-6">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            {eyebrow}
          </p>
        )}
        <h2 id={titleId} className="truncate text-base font-semibold text-white">
          {title}
        </h2>
      </div>

      {/* Compact progress pill — always visible */}
      <span
        className={clsx(
          "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums",
          pct === 100
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
        )}
        aria-hidden="true"
      >
        {summary.done}/{summary.total}
      </span>

      {/* Mobile-only chevron toggle */}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={isOpen ? "Collapse booking checklist" : "Expand booking checklist"}
        onClick={toggleCollapse}
        className={clsx(
          "lg:hidden shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors",
          "hover:bg-white/8 hover:text-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        )}
      >
        <ChevronDown
          className={clsx(
            "h-4 w-4 transition-transform duration-200 motion-reduce:transition-none",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );

  // ── Progress bar ──────────────────────────────────────────────────────────
  const progressBar = (
    <div className="px-4 pb-3 sm:px-5 xl:px-6">
      <ProgressBar progress={summary.progress} />
      <p className="mt-1 text-xs text-slate-400" aria-hidden="true">
        {pct === 100
          ? "All steps complete — ready for wallet handoff"
          : `${pct}% complete`}
      </p>
    </div>
  );

  // ── Step list ─────────────────────────────────────────────────────────────
  const stepList = (
    <ol
      id={listId}
      role="list"
      aria-labelledby={titleId}
      className={clsx(
        "space-y-0.5 px-2 pb-4 sm:px-3 xl:px-4",
        // Desktop: always visible; Mobile: conditionally visible
        !isOpen && "hidden lg:block",
      )}
    >
      {steps.map((step) => {
        const labelId = `${uid}-step-${step.id}-label`;
        const descId = step.description
          ? `${uid}-step-${step.id}-desc`
          : undefined;

        return (
          <li key={step.id} role="listitem">
            <StepRow
              step={step}
              onClick={onStepClick}
              labelId={labelId}
              descId={descId}
            />
          </li>
        );
      })}
    </ol>
  );

  return (
    <section
      aria-labelledby={titleId}
      className={cardClasses}
    >
      {headerContent}
      {progressBar}

      {/* Divider — only when steps are visible on mobile */}
      <hr className={clsx("border-white/10 mx-4 sm:mx-5 xl:mx-6", !isOpen && "lg:block hidden")} />

      {stepList}

      {/* Screen-reader live region */}
      <div
        id={announcerId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </section>
  );
}
