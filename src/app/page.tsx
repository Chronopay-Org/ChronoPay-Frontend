"use client";

import { ButtonLink } from "./components/ui/button-link";
import { useMessages, type MessageKey } from "@/lib/i18n";
import { DEMO_URL, REPO_URL } from "@/lib/site-links";

interface FeatureItem {
  titleKey: MessageKey;
  bodyKey: MessageKey;
  href: string;
  ctaKey: MessageKey;
}

const features: FeatureItem[] = [
  {
    titleKey: "home.features.tokenizedSlotsTitle",
    bodyKey: "home.features.tokenizedSlotsBody",
    href: "/marketplace",
    ctaKey: "home.features.tokenizedSlotsCta",
  },
  {
    titleKey: "home.features.stellarPaymentsTitle",
    bodyKey: "home.features.stellarPaymentsBody",
    href: "/dashboard/onboarding/payout",
    ctaKey: "home.features.stellarPaymentsCta",
  },
  {
    titleKey: "home.features.receiptsTitle",
    bodyKey: "home.features.receiptsBody",
    href: "/dashboard/slots/demo-1/receipt?asset=Product%20strategy%20call%20(1.5h)&tx=GA7Q...K2XD&buyer=A.R.&seller=S.J.&total=50.00%20XLM&settled=2026-04-01%2011%3A30%20UTC",
    ctaKey: "home.features.receiptsCta",
  },
  {
    titleKey: "home.features.dashboardTitle",
    bodyKey: "home.features.dashboardBody",
    href: "/dashboard",
    ctaKey: "home.features.dashboardCta",
  },
  {
    titleKey: "home.features.pricingTitle",
    bodyKey: "home.features.pricingBody",
    href: "/pricing",
    ctaKey: "home.features.pricingCta",
  },
  {
    titleKey: "home.features.accessibilityTitle",
    bodyKey: "home.features.accessibilityBody",
    href: "/design-system/components",
    ctaKey: "home.features.accessibilityCta",
  },
];

export default function Home() {
  const t = useMessages();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <span className="text-lg font-semibold tracking-tight">
          {t("home.title")}
        </span>
        <nav
          aria-label={t("nav.primary")}
          className="flex items-center gap-5 text-sm text-zinc-300"
        >
          <a href="/marketplace" className="hover:text-white">
            {t("nav.marketplace")}
          </a>
          <a href="/pricing" className="hover:text-white">
            {t("nav.pricing")}
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-3 py-1 hover:border-white/30 hover:text-white"
          >
            {t("nav.github")}
          </a>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-6 pb-20 pt-12">
        <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
          {t("home.tagline")}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
          {t("home.heroDescription")}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <ButtonLink href="/dashboard" variant="primary">
            {t("home.openDashboard")}
          </ButtonLink>
          <ButtonLink href="/marketplace" variant="secondary">
            {t("home.browseMarketplace")}
          </ButtonLink>
          <ButtonLink href="/pricing" variant="secondary">
            {t("nav.pricing")}
          </ButtonLink>
        </div>

        <section aria-labelledby="features" className="mt-20">
          <h2 id="features" className="text-2xl font-semibold">
            {t("home.featuresHeading")}
          </h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li
                key={f.titleKey}
                className="flex flex-col rounded-2xl border border-white/10 bg-zinc-900 p-6"
              >
                <h3 className="text-lg font-semibold">{t(f.titleKey)}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                  {t(f.bodyKey)}
                </p>
                <a
                  href={f.href}
                  className="mt-4 text-sm font-medium text-cyan-400 hover:text-cyan-300"
                >
                  {t(f.ctaKey)} &rarr;
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-16 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-200">
          {t("home.demoNoticePrefix")}{" "}
          <a className="underline" href={DEMO_URL}>
            chronopay-frontend-omega.vercel.app
          </a>
          .
        </p>
      </main>
    </div>
  );
}
