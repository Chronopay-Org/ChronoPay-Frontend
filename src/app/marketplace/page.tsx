"use client";

import { Suspense, useEffect, useMemo } from "react";
import {
  RecentlyViewedRail,
  useRecentlyViewed,
} from "./components/recently-viewed-rail";
import { PanelShell } from "@/components/dashboard/panel-shell";
import {
  ResultsPerPageSelector,
  usePageSize,
} from "@/components/marketplace/results-per-page-selector";

// Demo marketplace items — the original 4 are kept for the RecentlyViewed
// seeding so developers can see the rail populate on first visit. A larger
// catalogue is generated for the grid to make the per-page selector
// (12 / 24 / 48) visually meaningful.
const seedItems = [
  {
    id: "demo-1",
    title: "1 Hour Technical Consultation",
    price: "50 XLM",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
    href: "/marketplace/demo-1",
  },
  {
    id: "demo-2",
    title: "30 Minute Design Review",
    price: "25 XLM",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop",
    href: "/marketplace/demo-2",
  },
  {
    id: "demo-3",
    title: "2 Hour Strategy Session",
    price: "100 XLM",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
    href: "/marketplace/demo-3",
  },
  {
    id: "demo-4",
    title: "15 Minute Quick Call",
    price: "15 XLM",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
    href: "/marketplace/demo-4",
  },
];

const SERVICE_TITLES = [
  "Quick Brand Identity Audit",
  "Async Code Review",
  "Architecture Diagram Cleanup",
  "30 Minute UX Critique",
  "Hourly Rate Negotiation",
  "Stellar Wallet Setup Walkthrough",
  "Resume Polish",
  "Speed-reading Workshop",
  "Discord Community AMA",
  "1:1 Founder Office Hours",
  "Pitch Deck Storytelling",
  "Smart-Contract Audit (Sample)",
  "Pricing Strategy Consultation",
  "Quarterly Planning Helper",
  "Lead-Magnet Feedback",
  "Landing Page Conversion Review",
  "Async Translation Pass",
  "AI Prompt Iteration Session",
  "Personal Finance Tune-up",
  "Demo Day Prep Coaching",
];
const PRICE_BAND = ["10 XLM", "20 XLM", "25 XLM", "35 XLM", "50 XLM", "75 XLM", "100 XLM"];

// Larger simulated catalogue — 50 items so the 12 / 24 / 48 options all
// produce visibly different pages.
function buildCatalogue(): (typeof seedItems)[number][] {
  const out = [...seedItems];
  for (let i = 0; i < 46; i++) {
    out.push({
      id: `svc-${i + 1}`,
      title: SERVICE_TITLES[i % SERVICE_TITLES.length],
      price: PRICE_BAND[i % PRICE_BAND.length],
      image: undefined,
      href: `/marketplace/svc-${i + 1}`,
    });
  }
  return out;
}

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
            <a
              href={item.href}
              onClick={() => addItem(item)}
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
            </a>
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
