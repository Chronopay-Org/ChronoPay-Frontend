"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { LiveRegion } from "@/components/common/LiveRegion";

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  rating?: number;
  reviews?: number;
  tags?: string[];
}

interface MarketplaceGridProps {
  items: MarketplaceItem[];
  isLoading?: boolean;
  columns?: 1 | 2 | 3 | 4;
}

export function MarketplaceGrid({
  items,
  isLoading = false,
  columns = 3,
}: MarketplaceGridProps) {
  const searchParams = useSearchParams();

  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter((item) => {
      // Filter by search query
      const query = searchParams.get("q")?.toLowerCase() || "";
      if (
        query &&
        !item.title.toLowerCase().includes(query) &&
        !item.description.toLowerCase().includes(query)
      ) {
        return false;
      }

      // Filter by category (support multiple categories)
      const categories = searchParams.getAll("category");
      if (categories.length > 0 && !categories.includes(item.category)) {
        return false;
      }

      // Filter by tags
      const tagFilters = searchParams.getAll("tags");
      if (
        tagFilters.length > 0 &&
        !tagFilters.some((tag) => item.tags?.includes(tag))
      ) {
        return false;
      }

      return true;
    });
  }, [items, searchParams]);

  const gridColsClass = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  if (isLoading) {
    return (
      <div
        className="flex min-h-64 items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div>
      <LiveRegion ariaLive="polite">
        Found {filteredItems.length} items
        {searchParams.get("q")
          ? ` matching "${searchParams.get("q")}"`
          : ""}
      </LiveRegion>

      {filteredItems.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/30 p-8 text-center">
          <div>
            <h3 className="text-lg font-semibold text-zinc-300">
              No items found
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={clsx(
            "grid gap-4 sm:gap-6",
            gridColsClass[columns]
          )}
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={clsx(
                "rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 transition-all",
                "hover:border-zinc-600 hover:bg-zinc-900/70 hover:shadow-lg"
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
                <h3 className="text-base font-semibold text-zinc-100 line-clamp-2">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-400 line-clamp-3">
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
