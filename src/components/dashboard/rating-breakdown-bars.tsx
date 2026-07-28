"use client";

import { useState, useId } from "react";
import clsx from "clsx";
import type { RatingCriterion } from "./types";

const MAX_SCORE = 5;

export interface RatingBreakdownBarsProps {
  /** Per-criterion rating data ordered as you want them displayed. */
  criteria: RatingCriterion[];
  /** Overall average rating shown as a hero stat above the bars. */
  overallRating?: number;
  /** Total review count shown alongside the overall rating. */
  overallCount?: number;
  className?: string;
}

/**
 * RatingBreakdownBars
 *
 * Displays a stacked vertical list of per-criterion average ratings via
 * proportional horizontal bars. Each row shows a label, a numeric score,
 * and a bar whose width is proportional to the average (1–5 scale).
 *
 * On hover/focus each bar reveals a tooltip disclosing the sample size
 * (count of reviews) used to compute that criterion's average.
 *
 * Accessibility (WCAG 2.1 AA)
 * ───────────────────────────
 * - The overall stat is an aria-labelledby region pairing the heading with
 *   the value for screen readers.
 * - Each criterion bar is a progressbar role with aria-valuenow,
 *   aria-valuemin=1, aria-valuemax=5, and a descriptive aria-label that
 *   includes both the score and review count.
 * - Mousing over or focusing a bar shows a tooltip with the sample-size
 *   disclosure; the tooltip is keyboard-dismissible via Escape.
 * - Colour is never the sole differentiator: every bar carries both a
 *   colour swatch and a numeric label.
 *
 * Responsive / RTL
 * ────────────────
 * - Labels truncate on narrow viewports with a minimum width of 6ch.
 * - Bar direction follows the document dir; the tooltip arrow is centred
 *   with RTL-aware transforms.
 * - Theme-adaptive: the track background uses a semi-transparent token
 *   that works in both light and dark mode.
 */

export function RatingBreakdownBars({
  criteria,
  overallRating,
  overallCount,
  className = "",
}: RatingBreakdownBarsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const activeId = hoveredId ?? focusedId;
  const sectionId = useId();
  const headingId = `${sectionId}-heading`;
  const overallValueId = `${sectionId}-overall-value`;

  if (criteria.length === 0) {
    return (
      <div
        className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 text-center"
        role="region"
        aria-label="Rating breakdown"
      >
        <p className="text-sm text-slate-400">
          No rating data available yet. Ratings will appear once buyers leave
          per-criterion feedback.
        </p>
      </div>
    );
  }

  return (
    <div
      className={clsx("flex flex-col gap-5", className)}
      role="region"
      aria-labelledby={overallRating !== undefined ? headingId : undefined}
      aria-label={overallRating === undefined ? "Rating breakdown" : undefined}
      data-testid="rating-breakdown-bars"
    >
      {/* ── Overall star average ──────────────────────────────────────── */}
      {overallRating !== undefined && (
        <div className="flex items-baseline gap-2">
          <span
            id={headingId}
            className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400"
          >
            Rating breakdown
          </span>
          <span className="mx-2 h-4 w-px bg-white/10" aria-hidden="true" />
          <span
            id={overallValueId}
            className="text-2xl font-bold tracking-tight text-white"
            aria-live="polite"
          >
            {overallRating.toFixed(1)}
          </span>
          <span className="text-sm text-slate-400">
            / {MAX_SCORE} • {overallCount ?? criteria.reduce((s, c) => s + c.count, 0)} reviews
          </span>
        </div>
      )}

      {/* ── Criterion rows ────────────────────────────────────────────── */}
      <ul className="flex flex-col gap-2.5" aria-label="Per-criterion ratings">
        {criteria.map((criterion) => {
          const percentage = Math.round((criterion.average / MAX_SCORE) * 100);
          const isActive = activeId === criterion.id;
          const isDimmed = activeId !== null && !isActive;

          return (
            <li key={criterion.id} className="flex items-center gap-3">
              {/* Label */}
              <span
                className={clsx(
                  "w-[7ch] shrink-0 text-sm text-slate-300 truncate transition-opacity duration-200 motion-reduce:transition-none",
                  isDimmed ? "opacity-40" : "opacity-100",
                )}
              >
                {criterion.label}
              </span>

              {/* Score */}
              <span
                className={clsx(
                  "w-[3ch] shrink-0 text-right text-sm font-medium tabular-nums text-white transition-opacity duration-200 motion-reduce:transition-none",
                  isDimmed ? "opacity-40" : "opacity-100",
                )}
              >
                {criterion.average.toFixed(1)}
              </span>

              {/* Bar track + bar + tooltip */}
              <div className="relative flex-1 min-w-0">
                <div
                  className={clsx(
                    "h-4 w-full overflow-hidden rounded-full bg-slate-800/50 dark:bg-slate-800/50 bg-slate-200/60 transition-opacity duration-200 motion-reduce:transition-none",
                    isDimmed ? "opacity-40" : "opacity-100",
                  )}
                  role="progressbar"
                  aria-valuenow={criterion.average}
                  aria-valuemin={1}
                  aria-valuemax={MAX_SCORE}
                  aria-label={`${criterion.label}: ${criterion.average.toFixed(1)} out of ${MAX_SCORE}, based on ${criterion.count} ${criterion.count === 1 ? "review" : "reviews"}`}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredId(criterion.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setFocusedId(criterion.id)}
                  onBlur={() => setFocusedId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setFocusedId(null);
                      setHoveredId(null);
                    }
                  }}
                >
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-500 ease-out motion-reduce:transition-none",
                      criterion.colorClass,
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Tooltip */}
                {isActive && (
                  <div
                    className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg z-20 animate-in fade-in zoom-in-95 duration-200 rtl:translate-x-1/2"
                    role="tooltip"
                  >
                    <span className="font-medium">{criterion.label}</span>:{" "}
                    {criterion.average.toFixed(1)} / {MAX_SCORE}
                    <br />
                    <span className="text-slate-400">
                      Based on {criterion.count}{" "}
                      {criterion.count === 1 ? "review" : "reviews"}
                    </span>
                    <div className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
