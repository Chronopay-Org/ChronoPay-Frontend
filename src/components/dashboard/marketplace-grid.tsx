"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { LiveRegion } from "@/components/common/LiveRegion";
import { MarketplaceGridSkeleton } from "./marketplace-grid-skeleton";

export type MarketplaceSort = "newest" | "price" | "soonest";
export type MarketplaceDensity = "comfortable" | "compact";

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  rating?: number;
  reviews?: number;
  tags?: string[];
  /** ISO date string; drives the "newest" sort. */
  createdAt?: string;
  /** ISO date string of soonest availability; drives the "soonest" sort. */
  availableAt?: string;
}

export type MarketplaceColumns = 1 | 2 | 3 | 4;

const COLUMNS_CLASS: Record<MarketplaceColumns, string> = {
  1: "grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

/** Resolve the Tailwind grid class for a numeric column count. */
export function resolveGridColumnsClass(columns: MarketplaceColumns): string {
  return COLUMNS_CLASS[columns] ?? COLUMNS_CLASS[3];
}

/**
 * Normalise the raw `sort` URL param into a safe {@link MarketplaceSort}.
 * Unknown/malformed values fall back to `newest` so a hand-crafted URL can
 * never crash the grid or silently re-order data in an unintended way.
 */
export function parseSortParam(value: string | null): MarketplaceSort {
  if (value === "price" || value === "soonest") {
    return value;
  }
  return "newest";
}

/**
 * Normalise the raw `density` URL param into a safe {@link MarketplaceDensity}.
 */
export function parseDensityParam(value: string | null): MarketplaceDensity {
  return value === "compact" ? "compact" : "comfortable";
}

function epoch(value: string | undefined): number {
  if (!value) return Number.NaN;
  const time = Date.parse(value);
  return Number.isNaN(time) ? Number.NaN : time;
}

/**
 * Apply a stable sort to a copy of the items. Items that lack the sort key
 * for a given mode are pushed to the end (never dropped), and ties keep their
 * original relative order thanks to the ECMAScript stable sort.
 */
export function sortMarketplaceItems(
  items: readonly MarketplaceItem[],
  sort: MarketplaceSort,
): MarketplaceItem[] {
  const sorted = [...items];

  switch (sort) {
    case "price":
      sorted.sort((a, b) => {
        const priceA = a.price ?? Number.POSITIVE_INFINITY;
        const priceB = b.price ?? Number.POSITIVE_INFINITY;
        return priceA - priceB;
      });
      break;
    case "soonest":
      sorted.sort((a, b) => {
        const atA = epoch(a.availableAt);
        const atB = epoch(b.availableAt);
        if (Number.isNaN(atA) && Number.isNaN(atB)) return 0;
        if (Number.isNaN(atA)) return 1;
        if (Number.isNaN(atB)) return -1;
        return atA - atB;
      });
      break;
    case "newest":
    default:
      sorted.sort((a, b) => {
        const atA = epoch(a.createdAt);
        const atB = epoch(b.createdAt);
        if (Number.isNaN(atA) && Number.isNaN(atB)) return 0;
        if (Number.isNaN(atA)) return 1;
        if (Number.isNaN(atB)) return -1;
        return atB - atA;
      });
      break;
  }

  return sorted;
}

export const DENSITY_CARD_CLASS = {
  comfortable: "p-4",
  compact: "p-3",
} as const;

export const DENSITY_TITLE_CLASS = {
  comfortable: "text-base",
  compact: "text-sm",
} as const;

interface MarketplaceGridProps {
  items: MarketplaceItem[];
  isLoading?: boolean;
  columns?: MarketplaceColumns;
}

export function MarketplaceGrid({
  items,
  isLoading = false,
  columns = 3,
}: MarketplaceGridProps) {
  const searchParams = useSearchParams();

  const sort = parseSortParam(searchParams.get("sort"));
  const density = parseDensityParam(searchParams.get("density"));

  const { filteredItems, resultLabel } = useMemo(() => {
    if (!items) return { filteredItems: [] as MarketplaceItem[], query: "", resultLabel: "0 items" };

    const queryValue = searchParams.get("q")?.toLowerCase().trim() || "";
    const categories = searchParams.getAll("category");
    const tagFilters = searchParams.getAll("tags");

    const matched = items.filter((item) => {
      if (
        queryValue &&
        !item.title.toLowerCase().includes(queryValue) &&
        !item.description.toLowerCase().includes(queryValue)
      ) {
        return false;
      }
      if (categories.length > 0 && !categories.includes(item.category)) {
        return false;
      }
      if (tagFilters.length > 0 && !tagFilters.some((tag) => item.tags?.includes(tag))) {
        return false;
      }
      return true;
    });

    const ordered = sortMarketplaceItems(matched, sort);

    const parts = [`${ordered.length} item${ordered.length === 1 ? "" : "s"}`];
    if (queryValue) parts.push(`matching "${queryValue}"`);
    parts.push(`sorted by ${sort}`);

    return {
      filteredItems: ordered,
      resultLabel: parts.join(", "),
    };
  }, [items, searchParams, sort]);

  if (isLoading) {
    return <MarketplaceGridSkeleton columns={columns} density={density} />;
  }

  return (
    <div>
      <LiveRegion ariaLive="polite">
        Found {filteredItems.length} items
        {searchParams.get("q")
          ? ` matching &quot;${searchParams.get("q")}&quot;`
          : ""}
      </LiveRegion>

      {filteredItems.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/30 p-8 text-center">
          <div>
            <h3 className="text-lg font-semibold text-zinc-300">
              No items found
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Try adjusting your search or filters to find what you&apos;re looking
              for.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={clsx(
            "grid",
            DENSITY_CARD_CLASS[density] === "p-3"
              ? "gap-3 sm:gap-4"
              : "gap-4 sm:gap-6",
            resolveGridColumnsClass(columns)
          )}
          data-density={density}
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={clsx(
                "rounded-lg border border-zinc-700 bg-zinc-900/50 transition-all",
                "hover:border-zinc-600 hover:bg-zinc-900/70 hover:shadow-lg",
                DENSITY_CARD_CLASS[density]
              )}
            >
              <div className="space-y-3">
                {/* Category Badge */}
                <div className="inline-block">
                  <span className="inline-flex items-center rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-500/30">
                    {item.category}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className={clsx(
                    "font-semibold text-zinc-100 line-clamp-2",
                    DENSITY_TITLE_CLASS[density]
                  )}
                >
                  {item.title}
                </h3>

                {/* Description */}
                <p
                  className={clsx(
                    "text-zinc-400",
                    density === "compact"
                      ? "text-xs line-clamp-2"
                      : "text-sm line-clamp-3"
                  )}
                >
                  {item.description}
                </p>

                {/* Rating */}
                {item.rating !== undefined && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-amber-400">
                        ★ {item.rating.toFixed(1)}
                      </span>
                      {item.reviews && (
                        <span className="ml-1 text-xs text-zinc-500">
                          ({item.reviews})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex text-xs text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-xs text-zinc-500">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Price */}
                {item.price !== undefined && (
                  <div className="flex items-baseline justify-between border-t border-zinc-700/50 pt-3">
                    <span className="text-sm text-zinc-400">Price</span>
                    <span className="text-lg font-semibold text-emerald-400">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}