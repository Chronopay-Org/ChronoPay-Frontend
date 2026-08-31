import React from "react";
import clsx from "clsx";
import { StarRating } from "./star-rating";

export interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

export interface RatingHistogramProps {
  /** Overall average rating (1-5) */
  overallRating: number;
  /** Total number of reviews */
  totalCount: number;
  /** Breakdown of ratings from 5 stars to 1 star */
  distribution: RatingDistribution[];
  className?: string;
}

/**
 * RatingHistogram
 *
 * Displays an overall rating along with a histogram of the rating distribution (5 stars down to 1 star).
 *
 * Accessibility:
 * - Uses clear headings.
 * - Star icons use aria-label.
 * - Histogram rows use aria-label indicating count and percentage.
 */
export function RatingHistogram({
  overallRating,
  totalCount,
  distribution,
  className = "",
}: RatingHistogramProps) {
  // Ensure the distribution is always 5 to 1 in order. We assume the prop provides it.
  const sortedDistribution = [...distribution].sort((a, b) => b.stars - a.stars);

  return (
    <div
      className={clsx("flex flex-col md:flex-row gap-6 md:gap-10", className)}
      data-testid="rating-histogram"
      role="region"
      aria-label="Rating distribution"
    >
      {/* Overall score and stars */}
      <div className="flex flex-col items-center md:items-start shrink-0">
        <h2 className="text-4xl font-bold tracking-tight text-white mb-2">
          {overallRating.toFixed(1)}
        </h2>
        <StarRating rating={overallRating} size={20} className="mb-2" />
        <p className="text-sm text-slate-400">
          Based on {totalCount} {totalCount === 1 ? "review" : "reviews"}
        </p>
      </div>

      {/* Histogram bars */}
      <ul className="flex-1 flex flex-col gap-2" aria-label="Rating histogram breakdown">
        {sortedDistribution.map((row) => (
          <li
            key={row.stars}
            className="flex items-center gap-3 text-sm"
            aria-label={`${row.stars} stars: ${row.count} reviews, ${row.percentage}%`}
          >
            <span className="w-12 text-right shrink-0 text-slate-300 tabular-nums">
              {row.stars} <span className="sr-only">stars</span>
              <span aria-hidden="true">★</span>
            </span>
            <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={row.percentage} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${row.percentage}%` }}
              />
            </div>
            <span className="w-12 text-right shrink-0 text-slate-400 tabular-nums">
              {row.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
