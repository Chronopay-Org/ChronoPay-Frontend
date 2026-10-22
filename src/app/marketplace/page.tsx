"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  RecentlyViewedRail,
  useRecentlyViewed,
} from "./components/recently-viewed-rail";
import { PanelShell } from "@/components/dashboard/panel-shell";
import {
  ResultsPerPageSelector,
  usePageSize,
} from "@/components/marketplace/results-per-page-selector";
import { buildCatalogue, seedItems } from "./catalogue";

function MarketplaceGrid() {
  const { value, setValue } = usePageSize();
  const { addItem } = useRecentlyViewed();
  const catalogue = useMemo(() => buildCatalogue(), []);

  // Take only `value` items so the selector visibly changes the page size.
  const visible = catalogue.slice(0, value);

  return (
    <PanelShell
      title="Marketplace"
      description="Browse and book time slots from suppliers worldwide"
    >
      <ol
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        data-testid="marketplace-grid"
        aria-label="Marketplace search results"
      >
        {visible.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              onClick={() => addItem({ ...item, href: `/marketplace/${item.id}` })}
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
                <h3 className="line-clamp-2 text-base font-medium text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">{item.price}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {/* Per-page selector lives at the bottom of the results.
          It owns a single source of truth via `usePageSize` so a future
          pagination / infinite-scroll consumer can subscribe to the same
          hook and stay automatically in sync. */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <ResultsPerPageSelector
          value={value}
          onChange={setValue}
          totalCount={catalogue.length}
        />
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
          {/* `<Suspense>` is required because the selector reads the URL
              via `useSearchParams` — see the JSDoc on the component for the
              explanation of why Next.js insists on this boundary. */}
          <Suspense fallback={null}>
            <MarketplaceGrid />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
