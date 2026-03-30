import { ButtonLink } from "../components/ui/button-link";
import { DashboardShell } from "../components/dashboard-shell";
import { EmptyStateCard } from "../components/empty-state-card";
import { StatusChip } from "../components/ui/status-chip";

const overviewStats = [
  {
    label: "Available slots",
    value: "0 live",
    helper: "Add a release window so buyers can see when you're bookable.",
  },
  {
    label: "Wallet",
    value: "Not connected",
    helper: "Keep balances private until you choose to publish a slot.",
  },
  {
    label: "Booking progress",
    value: "Draft only",
    helper: "Review, confirm, and mint in one predictable flow.",
  },
];

const bookingSteps = [
  {
    title: "Draft your time offer",
    detail: "Choose the session length, price, and redemption rules before going live.",
    tone: "success" as const,
  },
  {
    title: "Connect wallet securely",
    detail: "Verify your Stellar address only when you're ready to mint or accept payment.",
    tone: "warning" as const,
  },
  {
    title: "Open booking window",
    detail: "Share a clear next step so buyers know what happens after checkout.",
    tone: "info" as const,
  },
];

export default function Dashboard() {
  return (
    <DashboardShell>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <StatusChip tone="info">Design system update</StatusChip>
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
            Empty states now explain what is missing, why it matters, and what to do next.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            This dashboard prototype sets a friendlier standard for loading, empty, and error states.
            Users can scan slot availability, wallet readiness, and booking progress without guessing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/" variant="primary">
              Return home
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Review state patterns
            </ButtonLink>
          </div>
        </div>

        <aside className="glass-panel rounded-[2rem] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Copy rules
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
            <li className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
              Lead with the user outcome: availability, wallet trust, or booking progress.
            </li>
            <li className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
              Keep the first sentence calm and specific, then offer one clear primary action.
            </li>
            <li className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
              Use supporting copy to remove doubt, not to restate the headline.
            </li>
          </ul>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Overview stats">
        {overviewStats.map((stat) => (
          <article key={stat.label} className="glass-panel rounded-[1.5rem] p-5">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{stat.helper}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <EmptyStateCard
          eyebrow="Availability"
          title="No time slots are live yet"
          description="Create your first listing when you're ready to be discovered. Buyers should immediately understand when you're available and what the session includes."
          accentLabel="Slots"
          status={{ label: "Empty", tone: "warning" }}
          guidance={[
            "Name the session in plain language so the value of the time slot is obvious.",
            "Mention response time or confirmation rules to reduce booking anxiety.",
            "Show one primary action only: create, publish, or duplicate a slot.",
          ]}
          actions={
            <>
              <ButtonLink href="/" variant="primary">
                Create first slot
              </ButtonLink>
              <ButtonLink href="/" variant="secondary">
                View publishing tips
              </ButtonLink>
            </>
          }
        />

        <EmptyStateCard
          eyebrow="Wallet state"
          title="Connect a wallet only when you need it"
          description="Wallet status should reassure the user before it requests anything sensitive. This state explains why a connection is needed and what stays private until then."
          accentLabel="Wallet"
          status={{ label: "Disconnected", tone: "info" }}
          guidance={[
            "State the benefit first: mint, receive payments, or verify ownership.",
            "Say what data is not shared yet so the user can proceed with confidence.",
            "Offer a secondary help action for setup or supported-wallet guidance.",
          ]}
          actions={
            <>
              <ButtonLink href="/" variant="primary">
                Connect wallet
              </ButtonLink>
              <ButtonLink href="/" variant="secondary">
                Supported wallets
              </ButtonLink>
            </>
          }
        />

        <section className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Booking progress
            </p>
            <StatusChip tone="success">Guided flow</StatusChip>
          </div>
          <h2 className="mt-5 text-xl font-semibold text-white">
            Keep the next step visible at every stage
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Progress states work best when they answer one question fast: what should the user do next to complete a booking?
          </p>
          <ol className="mt-5 space-y-3" aria-label="Booking progress checklist">
            {bookingSteps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-[1.5rem] border border-white/8 bg-white/4 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
                  </div>
                  <StatusChip tone={step.tone}>Active</StatusChip>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-[1.5rem] border border-cyan-200/12 bg-cyan-300/8 p-4">
            <p className="text-sm font-medium text-cyan-100">Suggested helper text</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              You can finish setup later. We will save your draft and only request a wallet signature when you publish.
            </p>
          </div>
        </section>
      </section>
    </DashboardShell>
  );
}
