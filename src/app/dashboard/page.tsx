"use client";

import { useState, useCallback } from "react";
import { DashboardShell } from "../components/dashboard-shell";
import {
  BookingChecklist,
  BookingProgress,
  MetricCard,
  OnboardingWidget,
  OnboardingWalkthrough,
  PanelShell,
  PricingCalculator,
  QuickActions,
  RatingBreakdownBars,
  SecurityStatusCard,
  createSecurityItems,
  SlotList,
  WalletCard,
  bookingChecklistSteps,
  bookingStages,
  metrics,
  quickActions,
  ratingBreakdown,
  slots,
  wallet,
  SupplierTrustStats,
  sampleResponseTime,
  sampleAcceptanceRate,
  emptyResponseTime,
  emptyAcceptanceRate,
} from "@/components/dashboard";
import TwoFactorEnroll from "@/components/dashboard/two-factor-enroll";
import { KycStatusTimeline } from "@/components/dashboard/kyc-status-timeline";
import { kycTimelineEntries, kycPromptPanel } from "@/components/dashboard/kyc-status-timeline";
import { SearchTypeahead } from "@/components/dashboard/search-typeahead";
import { FilterSidebar, FilterGroup } from "@/components/dashboard/filter-sidebar";
import { ActiveFiltersChips, ChipFilter } from "@/components/dashboard/active-filters-chips";
import { MarketplaceGrid, MarketplaceItem } from "@/components/dashboard/marketplace-grid";
import { MarketplaceSortControl } from "@/components/dashboard/marketplace-sort-control";
import { MarketplaceDensityToggle } from "@/components/dashboard/marketplace-density-toggle";
import { SavedViewChips } from "@/components/dashboard/saved-view-chips";
import { MarketplaceFilterSummaryBar } from "@/components/dashboard/marketplace-filter-summary-bar";
import { useOnboardingSamples } from "@/hooks/use-onboarding-samples";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import { NetworkProvider } from "@/components/checkout/NetworkSelector";
import { useSearchParams } from "next/navigation";

// ─── Sample marketplace data ───────────────────────────────────────

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: "1",
    createdAt: "2026-08-10T09:00:00.000Z",
    availableAt: "2026-08-12T09:00:00.000Z",
    title: "UI Component Library",
    description: "Comprehensive collection of accessible React components with Tailwind CSS styling.",
    category: "Components",
    price: 49.99,
    rating: 4.8,
    reviews: 127,
    tags: ["react", "tailwind", "accessible"],
  },
  {
    id: "2",
    createdAt: "2026-08-20T09:00:00.000Z",
    availableAt: "2026-08-15T09:00:00.000Z",
    title: "Design Token System",
    description: "Complete design system with semantic tokens, color scales, and typography presets.",
    category: "Design",
    price: 29.99,
    rating: 4.9,
    reviews: 89,
    tags: ["design-tokens", "figma", "variables"],
  },
  {
    id: "3",
    createdAt: "2026-08-05T09:00:00.000Z",
    availableAt: "2026-08-11T09:00:00.000Z",
    title: "Accessibility Audit Template",
    description: "Detailed WCAG 2.1 AA compliance checklist with test procedures and tools.",
    category: "Testing",
    price: 19.99,
    rating: 4.7,
    reviews: 45,
    tags: ["wcag", "testing", "a11y"],
  },
  {
    id: "4",
    createdAt: "2026-08-14T09:00:00.000Z",
    availableAt: "2026-08-18T09:00:00.000Z",
    title: "Responsive Grid System",
    description: "Flexible CSS grid framework with mobile-first breakpoints and utilities.",
    category: "Components",
    price: 24.99,
    rating: 4.6,
    reviews: 67,
    tags: ["css", "grid", "responsive"],
  },
  {
    id: "5",
    createdAt: "2026-08-22T09:00:00.000Z",
    availableAt: "2026-08-13T09:00:00.000Z",
    title: "Animation Library",
    description: "Smooth motion utilities with prefers-reduced-motion support built-in.",
    category: "Design",
    price: 34.99,
    rating: 4.9,
    reviews: 156,
    tags: ["motion", "css", "accessibility"],
  },
  {
    id: "6",
    createdAt: "2026-08-01T09:00:00.000Z",
    availableAt: "2026-08-24T09:00:00.000Z",
    title: "Form Validation Kit",
    description: "Client and server-side validation patterns with error messaging best practices.",
    category: "Components",
    price: 39.99,
    rating: 4.5,
    reviews: 78,
    tags: ["forms", "validation", "react"],
  },
  {
    id: "7",
    createdAt: "2026-08-17T09:00:00.000Z",
    availableAt: "2026-08-21T09:00:00.000Z",
    title: "Color Contrast Checker",
    description: "Browser extension for real-time WCAG contrast ratio analysis on any website.",
    category: "Testing",
    price: 14.99,
    rating: 4.8,
    reviews: 34,
    tags: ["wcag", "contrast", "tool"],
  },
  {
    id: "8",
    createdAt: "2026-08-25T09:00:00.000Z",
    availableAt: "2026-08-09T09:00:00.000Z",
    title: "Keyboard Navigation Guide",
    description: "Comprehensive guide to implementing keyboard shortcuts and focus management.",
    category: "Testing",
    price: 22.99,
    rating: 4.7,
    reviews: 56,
    tags: ["keyboard", "a11y", "guide"],
  },
  {
    id: "9",
    createdAt: "2026-08-08T09:00:00.000Z",
    availableAt: "2026-08-30T09:00:00.000Z",
    title: "Dark Mode Theme Kit",
    description: "Complete dark mode implementation with automatic theme detection and persistence.",
    category: "Design",
    price: 27.99,
    rating: 4.9,
    reviews: 203,
    tags: ["dark-mode", "theming", "css"],
  },
];

const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "category",
    title: "Category",
    options: [
      { id: "Components", label: "Components", count: 3 },
      { id: "Design", label: "Design", count: 3 },
      { id: "Testing", label: "Testing", count: 3 },
    ],
  },
  {
    id: "tags",
    title: "Tags",
    options: [
      { id: "react", label: "React", count: 2 },
      { id: "tailwind", label: "Tailwind CSS", count: 1 },
      { id: "wcag", label: "WCAG", count: 2 },
      { id: "accessible", label: "Accessible", count: 1 },
      { id: "responsive", label: "Responsive", count: 1 },
    ],
  },
];

const TYPEAHEAD_SUGGESTIONS = [
  { id: "1", label: "UI Components", category: "Popular" },
  { id: "2", label: "Accessibility", category: "Popular" },
  { id: "3", label: "Design System", category: "Popular" },
  { id: "4", label: "Animation", category: "Components" },
  { id: "5", label: "Form Validation", category: "Components" },
  { id: "6", label: "Color Contrast", category: "Testing" },
  { id: "7", label: "Keyboard Navigation", category: "Testing" },
  { id: "8", label: "Dark Mode", category: "Design" },
];

export default function Dashboard() {
  const searchParams = useSearchParams();
  const loading = false;
  const error = false;
  const hasData = true;
  const [activeFilters, setActiveFilters] = useState<ChipFilter[]>([]);
  const [isEnrolling2FA, setIsEnrolling2FA] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] =
    useState<"enabled" | "disabled">("disabled");

  const {
    showSamples,
    showTour,
    clearSamples,
    dismissTour,
  } = useOnboardingSamples();

  const {
    tourOpen,
    completeTour,
  } = useOnboardingTour();

  // Update active filters from URL params
  const updateActiveFilters = useCallback(() => {
    const filters: ChipFilter[] = [];
    
    FILTER_GROUPS.forEach((group) => {
      const values = searchParams.getAll(group.id);
      values.forEach((value) => {
        const option = group.options.find((o) => o.id === value);
        if (option) {
          filters.push({
            groupId: group.id,
            groupLabel: group.title,
            optionId: value,
            optionLabel: option.label,
          });
        }
      });
    });
    
    setActiveFilters(filters);
  }, [searchParams]);

  // Update filters when search params change
  if (activeFilters.length === 0 && 
      FILTER_GROUPS.some((g) => searchParams.getAll(g.id).length > 0)) {
    updateActiveFilters();
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-zinc-400"
        role="status"
        aria-live="polite"
      >
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-zinc-400"
        role="alert"
      >
        An error occurred. Please refresh the page.
      </div>
    );
  }

  if (!hasData) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-zinc-400"
        role="status"
      >
        No data available.
      </div>
    );
  }

  const suggestedAlternatives = slots.slice(0, 3);

  return (
    <DashboardShell>
      <NetworkProvider>
      <div className="space-y-6 sm:space-y-8 md:space-y-10">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Dashboard</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400 sm:text-base">
            Connect your Stellar wallet to{" "}
            <span className="inline-flex items-center gap-1">
              mint
              <HelpPopover
                term={glossary.mint}
                triggerLabel="Help: what does minting mean?"
              />
            </span>{" "}
            and trade{" "}
            <span className="inline-flex items-center gap-1">
              time tokens.
              <HelpPopover
                term={glossary.timeToken}
                triggerLabel="Help: what is a time token?"
              />
            </span>
          </p>
        </div>

{/* Onboarding */}
        <OnboardingWidget />

        {/* Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
          {!showSamples ? (
            <p className="text-sm text-slate-400 md:col-span-2 lg:col-span-4">
              Sample metrics cleared. Metrics will appear here once you have live
              activity.
            </p>
          ) : null}
        </div>

        {/* KYC Status Timeline */}
        <KycStatusTimeline
          entries={kycTimelineEntries}
          promptPanel={kycPromptPanel}
        />

        {/* Supplier Trust Stats */}
        {showSamples && (
          <PanelShell
            title="Trust Metrics"
            description="Response time and booking acceptance rate based on the last 30 days."
          >
            <SupplierTrustStats
              responseTime={sampleResponseTime}
              acceptanceRate={sampleAcceptanceRate}
            />
          </PanelShell>
        )}
        {!showSamples && (
          <PanelShell
            title="Trust Metrics"
            description="Response time and booking acceptance rate based on the last 30 days."
          >
            <SupplierTrustStats
              responseTime={emptyResponseTime}
              acceptanceRate={emptyAcceptanceRate}
            />
          </PanelShell>
        )}

        {/* Wallet and Booking Progress */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelShell title="Wallet" data-tour-target="wallet-card">
            <WalletCard
              wallet={
                showSamples
                  ? wallet
                  : {
                      connection: "disconnected",
                      status: "Connect a wallet to sync balances.",
                    }
              }
            />
          </PanelShell>
          <PanelShell title="Booking Progress">
            <BookingProgress
              stages={showSamples ? bookingStages : []}
            />
          </PanelShell>
          <BookingChecklist
            eyebrow="Booking flow"
            title="Completion checklist"
            steps={showSamples ? bookingChecklistSteps : []}
            defaultCollapsed={false}
          />
        </div>

        {/* Security Status */}
        <PanelShell
          title="Security Status"
          description="Review your account security settings."
        >
          {isEnrolling2FA ? (
            <TwoFactorEnroll onComplete={() => {
              setIsEnrolling2FA(false);
              setTwoFactorStatus("enabled");
            }} />
          ) : (
            <SecurityStatusCard 
              items={createSecurityItems({ twoFactor: twoFactorStatus }).map(item => 
                item.id === "two-factor" && item.status === "disabled"
                  ? { ...item, onAction: () => setIsEnrolling2FA(true) }
                  : item
              )}
            />
          )}
        </PanelShell>

        {/* Rating Breakdown */}
        {showSamples && (
          <PanelShell
            title="Rating Breakdown"
            description="Per-criterion average ratings across your recent reviews."
          >
            <RatingBreakdownBars
              criteria={ratingBreakdown}
              overallRating={4.6}
              overallCount={42}
            />
          </PanelShell>
        )}

        {/* Pricing Fee Calculator */}
        <PanelShell
          title="Fee Calculator"
          description="Estimate your take-home earnings after platform and network fees."
        >
          <PricingCalculator />
        </PanelShell>

        <PanelShell id="quick-actions" title="Quick Actions" data-tour-target="quick-actions">
          <QuickActions actions={quickActions} />
        </PanelShell>

        <PanelShell id="available-time-slots" title="Available Time Slots" data-tour-target="available-time-slots">
          <SlotList
            slots={slots}
            suggestedAlternatives={suggestedAlternatives}
          />
        </PanelShell>

        {/* Marketplace Search and Filters */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Marketplace Discovery</h2>
            <p className="mt-2 text-sm text-zinc-400 sm:text-base">
              Search and filter to find exactly what you need in our marketplace.
            </p>
          </div>

          {/* Sticky filter summary */}
          <MarketplaceFilterSummaryBar activeFilterCount={activeFilters.length} />

          {/* Search Bar */}
          <SearchTypeahead
            suggestions={TYPEAHEAD_SUGGESTIONS}
            placeholder="Search marketplace (UI, Components, Accessibility…)"
          />

          {/* Active Filters Display */}
          <ActiveFiltersChips
            filters={activeFilters}
            onFiltersChange={setActiveFilters}
          />

          {/* Filters and Grid Layout */}
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar Filters */}
            <aside className="lg:col-span-1">
              <FilterSidebar filters={FILTER_GROUPS} />
            </aside>

            {/* Marketplace Grid */}
            <div className="lg:col-span-3 space-y-4">
              <SavedViewChips />

              {/* Browse controls: sort + density */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <MarketplaceSortControl />
                <MarketplaceDensityToggle />
              </div>

              <MarketplaceGrid items={MARKETPLACE_ITEMS} columns={3} isLoading={loading} />
            </div>
          </div>
        </div>

      </div>
      </NetworkProvider>

      <OnboardingWalkthrough
        key={showTour ? "tour-open" : "tour-closed"}
        open={showTour}
        onSkip={dismissTour}
        onComplete={dismissTour}
        onClearSamples={clearSamples}
      />

      <OnboardingTour
        open={tourOpen}
        onComplete={completeTour}
      />
    </DashboardShell>
  );
}
