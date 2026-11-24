"use client";

import clsx from "clsx";
import {
  MarketplaceColumns,
  MarketplaceDensity,
  resolveGridColumnsClass,
} from "./marketplace-grid";

interface MarketplaceGridSkeletonProps {
  columns?: MarketplaceColumns;
  density?: MarketplaceDensity;
  count?: number;
}

/**
 * Placeholder cards rendered while the marketplace grid loads. The skeleton
 * mirrors the density-aware card structure (same paddings, grid columns and
 * line counts) so the final content swaps in without layout shift.
 */
export function MarketplaceGridSkeleton({
  columns = 3,
  density = "comfortable",
  count = 6,
}: MarketplaceGridSkeletonProps) {
  const compact = density === "compact";
  const gap = compact ? "gap-3 sm:gap-4" : "gap-4 sm:gap-6";
  const cardPadding = compact ? "p-3" : "p-4";
  const titleLines: Array<"w-5/6" | "w-4/6"> = compact
    ? ["w-5/6"]
    : ["w-5/6", "w-4/6"];
  const bodyLines = compact ? 2 : 3;

  return (
    <div aria-busy="true">
      <span role="status" aria-live="polite" className="sr-only">
        Loading marketplace items
      </span>
      <div
        className={clsx("grid", gap, resolveGridColumnsClass(columns))}
        data-density={density}
      >
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className={clsx(
              "rounded-lg border border-zinc-700 bg-zinc-900/50",
              cardPadding
            )}
          >
            <div className="space-y-3">
              <div className="inline-flex h-5 w-16 animate-pulse rounded-full bg-zinc-800" />
              <div className="space-y-2 pt-1">
                {titleLines.map((width, line) => (
                  <div
                    key={line}
                    className={clsx(
                      "h-3 animate-pulse rounded bg-zinc-800",
                      width
                    )}
                  />
                ))}
              </div>
              <div className="space-y-2">
                {Array.from({ length: bodyLines }, (_, line) => (
                  <div
                    key={line}
                    className={clsx(
                      "h-2 animate-pulse rounded bg-zinc-800",
                      line === bodyLines - 1 ? "w-4/6" : "w-full"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-1 pt-1">
                {[0, 1, 2].map((tag) => (
                  <div
                    key={tag}
                    className="h-4 w-12 animate-pulse rounded bg-zinc-800"
                  />
                ))}
              </div>
              <div className="flex items-baseline justify-between border-t border-zinc-700/50 pt-3">
                <div className="h-2 w-8 animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-14 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}