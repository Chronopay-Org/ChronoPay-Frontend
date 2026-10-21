import { PanelShell } from "@/components/dashboard/panel-shell";
import { RecentlyViewedRail } from "./components/recently-viewed-rail";

export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main id="main-content" className="mx-auto max-w-6xl px-5 py-8 sm:px-6 md:py-12">
        {/* Recently Viewed Rail */}
        <RecentlyViewedRail />

        {/* Marketplace Content Skeleton */}
        <div className="mt-8">
          <PanelShell
            title="Marketplace"
            description="Browse and book time slots from suppliers worldwide"
          >
            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="status"
              aria-busy="true"
              aria-live="polite"
              aria-label="Loading marketplace items"
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card" aria-hidden="true">
                  <div className="skeleton aspect-video w-full rounded-t-lg" />
                  <div className="p-4">
                    <div className="skeleton h-5 w-3/4 rounded-md" />
                    <div className="skeleton mt-3 h-4 w-1/4 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </PanelShell>
        </div>
      </main>
    </div>
  );
}
