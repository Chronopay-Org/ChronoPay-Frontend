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
  StateCard,
  wallet,
  WalletCard,
} from "@/components/dashboard";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#164e63_0%,#020617_46%,#020617_100%)] text-zinc-100 font-sans">
      <header className="border-b border-white/10 bg-slate-950/60 px-6 py-4 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ChronoPay
          </Link>
          <div className="flex gap-4 text-sm text-zinc-300">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <section className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_100px_-45px_rgba(34,211,238,0.35)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
                Dashboard overview
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Read slot supply, wallet health, and booking momentum in one
                pass.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                Designed for fast decisions: confirm demand, review funds, and
                act on the next booking bottleneck without leaving the overview.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-slate-400">Next slot</p>
                <p className="mt-2 font-semibold text-white">
                  Tue, Apr 1 at 10:00
                </p>
              </div>
              <div className="rounded-[22px] border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-cyan-100/80">Action needed</p>
                <p className="mt-2 font-semibold text-white">
                  3 booking approvals
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <PanelShell
            eyebrow="Availability"
            title="Open slots"
            description="Highlight the highest-value inventory first so sellers can react quickly when demand tightens."
          >
            <SlotList slots={slots} />
          </PanelShell>

          <div className="space-y-6">
            <PanelShell
              eyebrow="Wallet"
              title="Wallet snapshot"
              description="Surface liquidity and payout timing without pushing users into a settings flow."
            >
              <WalletCard wallet={wallet} />
            </PanelShell>

            <PanelShell
              eyebrow="Bookings"
              title="Booking progress"
              description="A compact flow helps users understand throughput and where approvals are stalling."
            >
              <BookingProgress stages={bookingStages} />
            </PanelShell>
          </div>
        </div>

        <section className="mt-8">
          <PanelShell
            eyebrow="Quick actions"
            title="Common workflows"
            description="Primary actions stay visible on every screen size so urgent work remains one tap away."
          >
            <QuickActions actions={quickActions} />
          </PanelShell>
        </section>

        <section className="mt-8">
          <PanelShell
            eyebrow="State coverage"
            title="Loading, empty, and error handling"
            description="The overview keeps partial information visible while communicating missing or blocked data access clearly."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <StateCard state="loading" />
              <StateCard state="empty" />
              <StateCard state="error" />
            </div>
          </PanelShell>
        </section>
      </main>
    </div>
  );
}
