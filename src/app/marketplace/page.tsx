"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  RecentlyViewedRail,
  useRecentlyViewed,
} from "./components/recently-viewed-rail";
import { PanelShell } from "@/components/dashboard/panel-shell";
import {
  FilterSidebar,
  type FilterGroup,
} from "@/components/dashboard/filter-sidebar";
import { MarketplaceSortControl } from "@/components/dashboard/marketplace-sort-control";
import {
  ActiveFiltersChips,
  type ChipFilter,
} from "@/components/dashboard/active-filters-chips";
import {
  StickyFiltersBar,
  type ActiveFilter,
} from "@/components/marketplace/sticky-filters-bar";
import { FacetCountBadge } from "@/components/marketplace/facet-count-badge";
import { useFacetCounts } from "@/components/marketplace/use-facet-counts";
import { ResultsPerPageSelector } from "@/components/marketplace/results-per-page-selector";
import { LiveRegion } from "@/components/common/LiveRegion";
import {
  buildCatalogue,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_DURATIONS,
  MARKETPLACE_PRICE_TIERS,
  seedItems,
} from "./catalogue";
import {
  computeFacetCounts,
  filterAndSortListings,
  MARKETPLACE_FILTER_GROUP_IDS,
  type MarketplaceFilterGroupId,
  useMarketplaceQuery,
} from "./use-marketplace-query";

const GROUP_LABELS: Record<MarketplaceFilterGroupId, string> = {
  category: "Category",
  duration: "Duration",
  price: "Price",
};

const OPTION_LABELS: Record<string, string> = Object.fromEntries([
  ...MARKETPLACE_CATEGORIES.map((c) => [c.id, c.label]),
  ...MARKETPLACE_DURATIONS.map((d) => [d.id, d.label]),
  ...MARKETPLACE_PRICE_TIERS.map((p) => [p.id, p.label]),
]);

function MarketplaceGrid() {
  const {
    query,
    setFilterGroups,
    removeFilter,
    clearFilters,
    setSort,
    setPageSize,
    setPage,
  } = useMarketplaceQuery();
  const { addItem } = useRecentlyViewed();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const catalogue = useMemo(() => buildCatalogue(), []);

  const filteredListings = useMemo(
    () => filterAndSortListings(catalogue, query),
    [catalogue, query],
  );

  const rawFacetCounts = useMemo(
    () => computeFacetCounts(filteredListings),
    [filteredListings],
  );

  const { counts: debouncedCounts, updateCounts, announcement } =
    useFacetCounts();

  useEffect(() => {
    updateCounts(rawFacetCounts);
  }, [rawFacetCounts, updateCounts]);

  const effectiveCounts = useMemo(
    () =>
      Object.keys(debouncedCounts).length > 0 ? debouncedCounts : rawFacetCounts,
    [debouncedCounts, rawFacetCounts],
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        id: "category",
        title: GROUP_LABELS.category,
        options: MARKETPLACE_CATEGORIES.map((c) => ({
          id: c.id,
          label: c.label,
          count: effectiveCounts[c.id] ?? 0,
        })),
      },
      {
        id: "duration",
        title: GROUP_LABELS.duration,
        options: MARKETPLACE_DURATIONS.map((d) => ({
          id: d.id,
          label: d.label,
          count: effectiveCounts[d.id] ?? 0,
        })),
      },
      {
        id: "price",
        title: GROUP_LABELS.price,
        options: MARKETPLACE_PRICE_TIERS.map((p) => ({
          id: p.id,
          label: p.label,
          count: effectiveCounts[p.id] ?? 0,
        })),
      },
    ],
    [effectiveCounts],
  );

  const chipFilters: ChipFilter[] = useMemo(() => {
    const chips: ChipFilter[] = [];
    for (const id of query.categories) {
      chips.push({
        groupId: "category",
        groupLabel: GROUP_LABELS.category,
        optionId: id,
        optionLabel: OPTION_LABELS[id] ?? id,
      });
    }
    for (const id of query.durations) {
      chips.push({
        groupId: "duration",
        groupLabel: GROUP_LABELS.duration,
        optionId: id,
        optionLabel: OPTION_LABELS[id] ?? id,
      });
    }
    for (const id of query.priceTiers) {
      chips.push({
        groupId: "price",
        groupLabel: GROUP_LABELS.price,
        optionId: id,
        optionLabel: OPTION_LABELS[id] ?? id,
      });
    }
    return chips;
  }, [query.categories, query.durations, query.priceTiers]);

  const stickyActiveFilters: ActiveFilter[] = useMemo(
    () =>
      chipFilters.map((chip) => ({
        id: `${chip.groupId}:${chip.optionId}`,
        label: chip.optionLabel,
        group: chip.groupId,
        count: effectiveCounts[chip.optionId] ?? 0,
      })),
    [chipFilters, effectiveCounts],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredListings.length / query.pageSize),
  );
  const currentPage = Math.min(query.page, totalPages);
  const startIndex = (currentPage - 1) * query.pageSize;
  const visible = filteredListings.slice(startIndex, startIndex + query.pageSize);

  const handleRemoveStickyFilter = (filterId: string) => {
    const [groupId, optionId] = filterId.split(":");
    if (
      groupId === "category" ||
      groupId === "duration" ||
      groupId === "price"
    ) {
      removeFilter(groupId, optionId);
    }
  };

  const handleChipFiltersChange = (nextChips: ChipFilter[]) => {
    const grouped: Record<string, string[]> = {
      category: [],
      duration: [],
      price: [],
    };
    for (const chip of nextChips) {
      if (grouped[chip.groupId]) {
        grouped[chip.groupId].push(chip.optionId);
      }
    }
    setFilterGroups(grouped);
  };

  return (
    <PanelShell
      title="Marketplace"
      description="Browse and book time slots from suppliers worldwide"
    >
      <LiveRegion ariaLive="polite">{announcement}</LiveRegion>

      <div className="mb-4">
        <StickyFiltersBar
          activeFilters={stickyActiveFilters}
          onRemoveFilter={handleRemoveStickyFilter}
          onOpenPanel={() => setMobileFiltersOpen((open) => !open)}
          onReset={clearFilters}
        >
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-zinc-400 sm:inline-flex">
              <span>Results</span>
              <FacetCountBadge
                count={filteredListings.length}
                tone={filteredListings.length > 0 ? "default" : "faded"}
              />
            </span>
            <MarketplaceSortControl
              value={query.sort}
              onSortChange={setSort}
            />
          </div>
        </StickyFiltersBar>
      </div>

      {chipFilters.length > 0 && (
        <div className="mb-5">
          <ActiveFiltersChips
            filters={chipFilters}
            allGroupIds={[...MARKETPLACE_FILTER_GROUP_IDS]}
            onFiltersChange={handleChipFiltersChange}
          />
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside
          aria-label="Marketplace filters"
          className={`${
            mobileFiltersOpen ? "block" : "hidden"
          } w-full shrink-0 lg:block lg:w-64`}
        >
          <FilterSidebar
            filters={filterGroups}
            onFiltersChange={setFilterGroups}
          />
        </aside>

        <div className="min-w-0 flex-1">
          {visible.length === 0 ? (
            <div
              className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-white/10 bg-zinc-900/40 p-8 text-center"
              data-testid="marketplace-empty-state"
            >
              <h3 className="text-base font-semibold text-white">
                No matching listings
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Try removing one or more filters to see more time slots.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <ol
              className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              data-testid="marketplace-grid"
              aria-label="Marketplace search results"
            >
              {visible.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() =>
                      addItem({ ...item, href: `/marketplace/${item.id}` })
                    }
                    className="card card--interactive group flex h-full flex-col"
                  >
                    {item.image ? (
                      <div
                        className="aspect-video w-full overflow-hidden rounded-t-lg bg-zinc-800"
                        aria-hidden="true"
                      >
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex aspect-video w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-slate-900 to-slate-800 text-sm font-medium uppercase tracking-[0.18em] text-slate-500"
                        aria-hidden="true"
                      >
                        Demo
                      </div>
                    )}
                    <div className="p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                          {OPTION_LABELS[item.category] ?? item.category}
                        </span>
                        <span>{OPTION_LABELS[item.duration] ?? item.duration}</span>
                      </div>
                      <h3 className="line-clamp-2 text-base font-medium text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-400">{item.price}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="Marketplace pagination"
              className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-zinc-400"
            >
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="tabular-nums text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}

          {/* Per-page selector lives at the bottom of the results. */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <ResultsPerPageSelector
              value={query.pageSize}
              onChange={setPageSize}
              totalCount={filteredListings.length}
            />
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

export default function Marketplace() {
  const { addItem } = useRecentlyViewed();

  // Populate recently-viewed rail on first visit.
  useEffect(() => {
    const hasVisited = localStorage.getItem("chronopay-marketplace-visited");
    if (!hasVisited) {
      seedItems.forEach((item, index) => {
        setTimeout(() => {
          addItem(item);
        }, index * 100);
      });
      localStorage.setItem("chronopay-marketplace-visited", "true");
    }
  }, [addItem]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-5 py-8 sm:px-6 md:py-12"
      >
        <RecentlyViewedRail />

        <div className="mt-8">
          {/* `<Suspense>` is required because `useMarketplaceQuery` reads the URL
              via `useSearchParams`. */}
          <Suspense fallback={null}>
            <MarketplaceGrid />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
