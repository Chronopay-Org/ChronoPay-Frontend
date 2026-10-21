import { ButtonLink } from "./components/ui/button-link";

const features = [
  {
    title: "Tokenized time slots",
    body: "Suppliers publish availability as bookable slots; buyers reserve, hold and redeem them. Recurring availability and timezone-aware scheduling are built in.",
    href: "/marketplace",
    cta: "Browse marketplace",
  },
  {
    title: "Payments on Stellar",
    body: "Wallet connection, XLM pricing, payout onboarding and refund-destination selection for a clear money trail.",
    href: "/dashboard/onboarding/payout",
    cta: "Payout setup",
  },
  {
    title: "Receipts and history",
    body: "Every booking has a status timeline and a receipt page with notes, plus export of booking history.",
    href: "/dashboard/slots/demo-1/receipt?asset=Product%20strategy%20call%20(1.5h)&tx=GA7Q...K2XD&buyer=A.R.&seller=S.J.&total=50.00%20XLM&settled=2026-04-01%2011%3A30%20UTC",
    cta: "View a demo receipt",
  },
  {
    title: "Buyer and supplier dashboard",
    body: "Overview metrics, wallet status, bookings, supplier profiles, ratings and reviews, notifications and settings.",
    href: "/dashboard",
    cta: "Open dashboard",
  },
  {
    title: "Transparent pricing",
    body: "Plan comparison and a pricing-strategy explainer so suppliers know what they earn.",
    href: "/pricing",
    cta: "See pricing",
  },
  {
    title: "Accessible by design",
    body: "Skip links, focus traps, keyboard shortcuts (press ?), light/dark themes and a documented design system.",
    href: "/design-system/components",
    cta: "Design system",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <span className="text-lg font-semibold tracking-tight">ChronoPay</span>
        <nav aria-label="Primary" className="flex items-center gap-5 text-sm text-zinc-300">
          <a href="/marketplace" className="hover:text-white">Marketplace</a>
          <a href="/pricing" className="hover:text-white">Pricing</a>
          <a
            href="https://github.com/Chronopay-Org/ChronoPay-Frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-3 py-1 hover:border-white/30 hover:text-white"
          >
            GitHub
          </a>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-6 pb-20 pt-12">
        <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
          Time Economy
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Book, pay for and receipt time, on Stellar.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
          ChronoPay turns future time slots into tradable digital assets. Suppliers
          list availability, buyers book and pay, and both sides get a clear
          receipt and history.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <ButtonLink href="/dashboard" variant="primary">
            Open dashboard
          </ButtonLink>
          <ButtonLink href="/marketplace" variant="secondary">
            Browse marketplace
          </ButtonLink>
          <ButtonLink href="/pricing" variant="secondary">
            Pricing
          </ButtonLink>
        </div>

        <section aria-labelledby="features" className="mt-20">
          <h2 id="features" className="text-2xl font-semibold">
            What you can do
          </h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li
                key={f.title}
                className="flex flex-col rounded-2xl border border-white/10 bg-zinc-900 p-6"
              >
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                  {f.body}
                </p>
                <a
                  href={f.href}
                  className="mt-4 text-sm font-medium text-cyan-400 hover:text-cyan-300"
                >
                  {f.cta} &rarr;
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-16 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-200">
          Demo notice: all listings, suppliers, balances and receipts in this
          deployment are sample data. No real payments are processed. Live
          demo: <a className="underline" href="https://chronopay-frontend-omega.vercel.app">chronopay-frontend-omega.vercel.app</a>.
        </p>
      </main>
    </div>
  );
}
