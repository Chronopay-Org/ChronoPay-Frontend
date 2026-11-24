"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";
import { LiveRegion } from "@/components/common/LiveRegion";
import {
  MarketplaceDensity,
  MarketplaceSort,
  parseDensityParam,
  parseSortParam,
} from "./marketplace-grid";

const SORT_LABELS: Record<MarketplaceSort, string> = {
  newest: "Newest",
  price: "Price",
  soonest: "Soonest",
};

const DENSITY_LABELS: Record<MarketplaceDensity, string> = {
  comfortable: "Comfortable",
  compact: "Compact",
};

interface MarketplaceFilterSummaryBarProps {
  /** Number of active category/tag filters, provided by the page owner. */
  activeFilterCount?: number;
  /** Disable the sticky positioning (kept for tests / non-shell usage). */
  sticky?: boolean;
}

/**
 * Sticky summary bar for the marketplace browse grid. Stops below the shell
 * header (`top-14`) instead of the viewport edge and shows the active sort,
 * density and filter count, plus a Clear all affordance. All read/write
 * through URL search params.
 */
export function MarketplaceFilterSummaryBar({
  activeFilterCount = 0,
  sticky = true,
}: MarketplaceFilterSummaryBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const sort = parseSortParam(searchParams.get("sort"));
  const density = parseDensityParam(searchParams.get("density"));
  const hasQuery = Boolean(searchParams.get("q"));

  const isDefault =
    sort === "newest" &&
    density === "comfortable" &&
    activeFilterCount === 0 &&
    !hasQuery;

  const handleClearAll = useCallback(() => {
    startTransition(() => {
      router.replace(pathname);
    });
  }, [router, pathname]);

  const summary = [
    `Sorting by ${SORT_LABELS[sort]}`,
    `${DENSITY_LABELS[density]} density`,
    `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`,
  ].join(" · ");

  return (
    <div
      className={clsx(
        sticky && "sticky top-14 z-20",
        "border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl"
      )}
    >
      <LiveRegion ariaLive="polite">{summary}</LiveRegion>
      <div
        role="region"
        aria-label="Marketplace filter summary"
        className="mx-auto flex w-full items-center gap-3 px-4 py-2.5 sm:px-6"
      >
        <SlidersHorizontal
          className="h-4 w-4 shrink-0 text-zinc-400"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1 truncate text-sm text-zinc-300">
          {summary}
        </p>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={isDefault}
          className={clsx(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
            isDefault
              ? "cursor-not-allowed text-zinc-600"
              : "text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
          )}
          aria-label="Clear all marketplace filters"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear all
        </button>
      </div>
    </div>
  );
}