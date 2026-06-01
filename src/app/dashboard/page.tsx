import Link from "next/link";

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

export default function Dashboard() {
  // Simulated states (for QA requirement)
  const loading = false;
  const error = false;
  const hasData = true;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-zinc-400"
        role="status"
        aria-live="polite"
      >
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-red-500"
        role="alert"
      >
        Something went wrong.
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

      </main>
    </div>
  );
}
