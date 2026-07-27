"use client";

import { DashboardShell } from "../components/dashboard-shell";
import {
  bookingStages,
  BookingProgress,
  metrics,
  MetricCard,
  PanelShell,
  quickActions,
  QuickActions,
  slots,
  SlotList,
  wallet,
  WalletCard,
} from "@/components/dashboard";
import { useToast } from "@/hooks/use-toast";
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
  if (Math.random() < 0.3) throw new Error("Escrow release rejected by contract");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const loading = false;
  const error = false;
  const hasData = true;

  // Suppress lint warnings for demo simulation functions
  void simulateMint;
  void simulateBuy;
  void simulateEscrowRelease;
  void toast;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-zinc-400"
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
        className="min-h-screen flex items-center justify-center text-zinc-400"
        role="alert"
      >
        An error occurred. Please refresh the page.
      </div>
    );
  }

  if (!hasData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-zinc-400"
        role="status"
      >
        No data available.
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 sm:space-y-8 md:space-y-10">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base flex items-center gap-2 flex-wrap">
            Connect your Stellar wallet to{" "}
            <span className="inline-flex items-center gap-1">
              mint
              {/* "mint" is domain jargon — explain it inline */}
              <HelpPopover
                term={glossary.mint}
                triggerLabel="Help: what does minting mean?"
              />
            </span>{" "}
            and trade{" "}
            <span className="inline-flex items-center gap-1">
              time tokens.
              {/* "time token" is the core concept — provide a popover definition */}
              <HelpPopover
                term={glossary.timeToken}
                triggerLabel="Help: what is a time token?"
              />
            </span>
          </p>
        </div>

        {/* Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        {/* Wallet and Booking Progress */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelShell title="Wallet">
            <WalletCard wallet={wallet} />
          </PanelShell>
          <PanelShell title="Booking Progress">
            <BookingProgress stages={bookingStages} />
          </PanelShell>
        </div>

        {/* Quick Actions */}
        <PanelShell id="quick-actions" title="Quick Actions">
          <QuickActions actions={quickActions} />
        </PanelShell>

        {/* Time Slots */}
        <PanelShell id="available-time-slots" title="Available Time Slots">
          <SlotList slots={slots} />
        </PanelShell>
      </div>
    </DashboardShell>
  );
}
