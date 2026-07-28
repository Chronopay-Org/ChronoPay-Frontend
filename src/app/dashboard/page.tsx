"use client";

import { DashboardShell } from "../components/dashboard-shell";
import {
  BookingProgress,
  MetricCard,
  OnboardingWalkthrough,
  PanelShell,
  QuickActions,
  SlotList,
  WalletCard,
  bookingStages,
  metrics,
  quickActions,
  slots,
  wallet,
} from "@/components/dashboard";
import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";

// ─── Simulated async time-token actions ───────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function simulateMint() {
  await delay(2000);
}

async function simulateBuy() {
  await delay(1800);
}

async function simulateEscrowRelease() {
  await delay(2200);
  // Simulate a failure ~30% of the time for demo
  if (Math.random() < 0.3)
    throw new Error("Escrow release rejected by contract");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // Suppress lint warnings for demo simulation functions
  void simulateMint;
  void simulateBuy;
  void simulateEscrowRelease;

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
          <SlotList slots={slots} supplierId="supplier-1" />
        </PanelShell>

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
