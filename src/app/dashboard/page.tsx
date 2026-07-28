"use client";

import { DashboardShell } from "../components/dashboard-shell";
import {
  availabilityDays,
  AvailabilityStrip,
  bookingStages,
  BookingProgress,
  ClearSamplesBanner,
  metrics,
  MetricCard,
  OnboardingWalkthrough,
  PanelShell,
  quickActions,
  QuickActions,
  slots,
  SlotList,
  wallet,
  WalletCard,
  upcomingHolidays,
  holidayRegion,
  HolidayHintsStrip,
} from "@/components/dashboard";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import { useOnboardingSamples } from "@/hooks/use-onboarding-samples";

export default function Dashboard() {
  const loading = false;
  const error = false;
  const hasData = true;
  const {
    showSamples,
    showTour,
    showClearBanner,
    clearSamples,
    dismissTour,
  } = useOnboardingSamples();

  const visibleMetrics = showSamples ? metrics : [];
  const visibleSlots = showSamples ? slots : [];

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

        {showSamples ? (
          <ClearSamplesBanner
            visible={showClearBanner || showTour}
            onClear={clearSamples}
          />
        ) : null}

        <div
          data-tour-target="metrics"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {visibleMetrics.map((metric) => (
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

        {/* Wallet and Booking Progress */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelShell title="Wallet">
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
        </div>

        <PanelShell id="quick-actions" title="Quick Actions">
          <QuickActions actions={quickActions} />
        </PanelShell>

        <PanelShell id="available-time-slots" title="Available Time Slots">
          <div data-tour-target="slots">
            <SlotList slots={visibleSlots} />
          </div>
        </PanelShell>

        {/* Holiday Hints Strip */}
        <HolidayHintsStrip
          holidays={upcomingHolidays}
          region={holidayRegion}
        />
      </div>

      <OnboardingWalkthrough
        key={showTour ? "tour-open" : "tour-closed"}
        open={showTour}
        onSkip={dismissTour}
        onComplete={dismissTour}
        onClearSamples={clearSamples}
      />
    </DashboardShell>
  );
}
