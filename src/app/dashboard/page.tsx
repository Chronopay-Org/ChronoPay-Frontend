"use client";

import Link from "next/link";
import DashboardError from "./error";

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
import { AsyncButton } from "@/app/components/ui/async-button";

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
  const { toast } = useToast();

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
      <DashboardError error={new Error("Dashboard error")} reset={() => {}} />
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <nav className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="text-lg font-semibold">
            ChronoPay
          </Link>
          <div className="flex gap-4 text-sm text-zinc-400">
            <Link href="/" className="hover:text-zinc-200">
              Home
            </Link>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-8 space-y-6 sm:px-6 sm:py-12 sm:space-y-8 md:py-16 md:space-y-10">

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Connect your Stellar wallet to mint and trade time tokens.
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
        <PanelShell title="Quick Actions">
          <QuickActions actions={quickActions} />
        </PanelShell>

        {/* Time Slots */}
        <PanelShell title="Available Time Slots">
          <SlotList slots={slots} />
        </PanelShell>

        {/* ── Time-token action panel ─────────────────────────────────────── */}
        <PanelShell
          title="Time-Token Actions"
          eyebrow="Async feedback demo"
          description="Each button simulates a Stellar network call. Toasts confirm the outcome; the button shows inline pending and result states."
        >
          <div className="flex flex-wrap gap-3">

            {/* Mint */}
            <AsyncButton
              onAction={simulateMint}
              labels={{
                idle: "Mint time token",
                pending: "Minting…",
                confirmed: "Minted",
                error: "Mint failed",
              }}
              variant="primary"
              size="md"
              onError={() =>
                toast({
                  variant: "error",
                  title: "Mint failed",
                  description: "The transaction was rejected. Check your balance and try again.",
                })
              }
            />

            {/* Buy */}
            <AsyncButton
              onAction={simulateBuy}
              labels={{
                idle: "Buy slot",
                pending: "Processing…",
                confirmed: "Purchased",
                error: "Purchase failed",
              }}
              variant="secondary"
              size="md"
              onError={() =>
                toast({
                  variant: "error",
                  title: "Purchase failed",
                  description: "Payment could not be processed. Verify your wallet balance.",
                })
              }
            />

            {/* Escrow release */}
            <AsyncButton
              onAction={async () => {
                await simulateEscrowRelease();
                toast({
                  variant: "success",
                  title: "Escrow released",
                  description: "180 XLM has been transferred to your wallet.",
                });
              }}
              labels={{
                idle: "Release escrow",
                pending: "Releasing…",
                confirmed: "Released",
                error: "Release failed",
              }}
              variant="secondary"
              size="md"
              onError={() =>
                toast({
                  variant: "error",
                  title: "Escrow release failed",
                  description: "The smart contract rejected the release. Contact support if this persists.",
                })
              }
            />
          </div>
        </PanelShell>

        {/* ── Toast variant preview (QA / design review) ──────────────────── */}
        <PanelShell
          title="Notification Variants"
          eyebrow="Design review"
          description="Trigger each toast variant to verify appearance, live-region announcements, and keyboard dismiss."
        >
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                toast({
                  variant: "success",
                  title: "Transaction confirmed",
                  description: "Your time token was minted on the Stellar network.",
                })
              }
              className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-950/60 px-4 py-2.5 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Success toast
            </button>

            <button
              type="button"
              onClick={() =>
                toast({
                  variant: "info",
                  title: "Wallet synced",
                  description: "Balance updated from the Stellar Horizon API.",
                })
              }
              className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-950/60 px-4 py-2.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Info toast
            </button>

            <button
              type="button"
              onClick={() =>
                toast({
                  variant: "warning",
                  title: "Low balance",
                  description: "Your wallet has less than 10 XLM. Top up to continue trading.",
                })
              }
              className="inline-flex items-center justify-center rounded-full border border-amber-400/30 bg-amber-950/60 px-4 py-2.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Warning toast
            </button>

            <button
              type="button"
              onClick={() =>
                toast({
                  variant: "error",
                  title: "Transaction failed",
                  description: "The Stellar network returned an error. Please try again.",
                })
              }
              className="inline-flex items-center justify-center rounded-full border border-rose-400/30 bg-rose-950/60 px-4 py-2.5 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Error toast
            </button>

            <button
              type="button"
              onClick={() => {
                toast({ variant: "success", title: "Slot reserved" });
                toast({ variant: "info", title: "Confirmation email sent" });
                toast({ variant: "warning", title: "Escrow pending review" });
              }}
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:border-cyan-200/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Stack 3 toasts
            </button>
          </div>
        </PanelShell>

      </main>
    </div>
  );
}
