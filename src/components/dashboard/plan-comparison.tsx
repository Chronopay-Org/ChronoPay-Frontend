"use client";

import { useState, useMemo } from "react";

export type Feature = {
  id: string;
  name: string;
  description?: string;
  included?: boolean | string;
  category?: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  tagline?: string;
  monthlyPrice: number; // cents
  yearlyPrice: number; // cents
  ctaLabel: string;
  ctaHref: string;
  accentColor?: string;
  isRecommended?: boolean;
  recommendedReason?: string;
  features: Feature[];
};

export function validatePlans(input: unknown): PricingPlan[] {
  if (!Array.isArray(input)) throw new Error("Plans must be an array");
  const plans = input as Array<Record<string, unknown>>;
  for (const plan of plans) {
    if (typeof plan.id !== "string") throw new Error("Plan.id must be a string");
    if (typeof plan.name !== "string") throw new Error("Plan.name must be a string");
    if (typeof plan.monthlyPrice !== "number" || typeof plan.yearlyPrice !== "number")
      throw new Error("Plan prices must be numbers");
    if (!Array.isArray(plan.features)) throw new Error("Plan.features must be an array");
  }
  return plans as PricingPlan[];
}

type Props = {
  plans: PricingPlan[];
  recommendedPlanId?: string;
  monthlyLabel?: string;
  yearlyLabel?: string;
  savingsLabel?: string;
  onSelectPlan?: (planId: string) => void;
};

type ValidationResult =
  | { ok: true; plans: PricingPlan[] }
  | { ok: false; error: Error };

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function calculateSavingsPercentage(plan?: PricingPlan): number {
  if (!plan) return 0;
  const monthlyTotal = plan.monthlyPrice * 12;
  if (monthlyTotal <= plan.yearlyPrice) return 0;
  return Math.round(((monthlyTotal - plan.yearlyPrice) / monthlyTotal) * 100);
}

function validateSafely(input: unknown): ValidationResult {
  try {
    return { ok: true, plans: validatePlans(input) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export function PlanComparison({
  plans,
  recommendedPlanId,
  monthlyLabel = "Monthly",
  yearlyLabel = "Yearly",
  savingsLabel = "Save {savings}%",
  onSelectPlan,
}: Props) {
  const [billingYearly, setBillingYearly] = useState(false);

  const features = useMemo(() => {
    const map = new Map<string, Feature>();
    for (const plan of plans ?? []) {
      for (const f of plan.features || []) {
        if (!map.has(f.id)) map.set(f.id, f);
      }
    }
    return Array.from(map.values());
  }, [plans]);

  const validation = useMemo<ValidationResult>(() => validateSafely(plans), [plans]);

  const savingsPercentage = useMemo(
    () => calculateSavingsPercentage(plans?.[0]),
    [plans]
  );

  const isPlanRecommended = (plan: PricingPlan) =>
    plan.id === recommendedPlanId || Boolean(plan.isRecommended);

  if (!plans || plans.length === 0) {
    return (
      <section aria-live="polite">
        <h2 className="text-xl font-semibold text-white">Pricing</h2>
        <p className="mt-4 text-sm text-slate-400">No plans available at this time.</p>
      </section>
    );
  }

  if (!validation.ok) {
    return (
      <section role="alert" aria-live="assertive">
        <h2 className="text-xl font-semibold text-white">Pricing</h2>
        <p className="mt-4 text-sm text-rose-400" data-error={validation.error.message}>
          Invalid pricing configuration.
        </p>
      </section>
    );
  }

  const validatedPlans = validation.plans;

  return (
    <section aria-labelledby="pricing-heading">
      <div className="flex items-center justify-between">
        <h1 id="pricing-heading" className="text-3xl font-bold text-white">
          Choose a plan
        </h1>

        <div className="flex items-center gap-4">
          <label className="sr-only" htmlFor="billing-toggle">
            Billing cycle
          </label>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{monthlyLabel}</span>
            <button
              id="billing-toggle"
              type="button"
              aria-pressed={billingYearly}
              aria-label="Toggle yearly billing"
              onClick={() => setBillingYearly((s) => !s)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/10 p-1"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingYearly ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span>{yearlyLabel}</span>
            {billingYearly && savingsPercentage > 0 && (
              <span
                className="text-xs font-medium text-emerald-300"
                aria-label={`${savingsPercentage}% savings`}
              >
                {savingsLabel.replace("{savings}", String(savingsPercentage))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="mt-8 grid gap-6 sm:hidden">
        {validatedPlans.map((plan) => (
          <article
            key={plan.id}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
            aria-label={`${plan.name} plan`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                {plan.tagline && <p className="text-sm text-slate-400">{plan.tagline}</p>}
              </div>
              {isPlanRecommended(plan) && (
                <span className="inline-flex items-center rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300">
                  Recommended
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-2xl font-bold text-white">
                {formatMoney(billingYearly ? plan.yearlyPrice : plan.monthlyPrice)}
              </p>
              <p className="text-sm text-slate-400">{billingYearly ? yearlyLabel : monthlyLabel}</p>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {plan.features.map((f) => (
                <li key={f.id}>
                  <span className="font-medium text-slate-100">{f.name}</span>
                  <span className="ml-2 text-slate-400">
                    {typeof f.included === "boolean" ? (f.included ? "Included" : "—") : f.included}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <a
                href={plan.ctaHref}
                onClick={() => onSelectPlan?.(plan.id)}
                className="inline-flex w-full items-center justify-center rounded-md bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-white ring-offset-2 focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {plan.ctaLabel}
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Desktop: matrix with sticky feature column */}
      <div className="mt-8 hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-64 bg-slate-950/60 p-4 text-left text-sm font-medium text-slate-300">
                  Features
                </th>
                {validatedPlans.map((plan) => (
                  <th key={plan.id} className="p-4 text-left align-top">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                          {isPlanRecommended(plan) && (
                            <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2 py-1 text-xs font-semibold text-amber-300">
                              Recommended
                            </span>
                          )}
                        </div>
                        {plan.tagline && <p className="text-sm text-slate-400">{plan.tagline}</p>}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {formatMoney(billingYearly ? plan.yearlyPrice : plan.monthlyPrice)}
                        </div>
                        <div className="text-sm text-slate-400">
                          {billingYearly ? yearlyLabel : monthlyLabel}
                        </div>
                        <div className="mt-3">
                          <a
                            href={plan.ctaHref}
                            onClick={() => onSelectPlan?.(plan.id)}
                            className="inline-flex items-center justify-center rounded-md bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-white"
                          >
                            {plan.ctaLabel}
                          </a>
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} className="border-t border-white/6">
                  <th className="sticky left-0 z-10 w-64 bg-slate-950/60 p-4 text-left align-top text-sm font-medium text-slate-200">
                    <div>
                      <div className="font-semibold">{f.name}</div>
                      {f.description && (
                        <div className="mt-1 text-sm text-slate-400">{f.description}</div>
                      )}
                    </div>
                  </th>
                  {validatedPlans.map((plan) => {
                    const pf = plan.features.find((x) => x.id === f.id);
                    const content = pf
                      ? typeof pf.included === "boolean"
                        ? pf.included
                          ? "✓"
                          : "—"
                        : pf.included
                      : "—";
                    return (
                      <td key={plan.id} className="p-4 align-top text-sm text-slate-300">
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default PlanComparison;
