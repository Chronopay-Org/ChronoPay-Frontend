import React, { useState, useMemo } from "react";

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
  const plans = input as any[];
  for (const p of plans) {
    if (typeof p.id !== "string") throw new Error("Plan.id must be a string");
    if (typeof p.name !== "string") throw new Error("Plan.name must be a string");
    if (typeof p.monthlyPrice !== "number" || typeof p.yearlyPrice !== "number")
      throw new Error("Plan prices must be numbers");
    if (!Array.isArray(p.features)) throw new Error("Plan.features must be an array");
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

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
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
    for (const plan of plans) {
      for (const f of plan.features || []) {
        if (!map.has(f.id)) map.set(f.id, f);
      }
    }
    return Array.from(map.values());
  }, [plans]);

  if (!plans || plans.length === 0) {
    return (
      <section aria-live="polite">
        <h2 className="text-xl font-semibold text-white">Pricing</h2>
        <p className="mt-4 text-sm text-slate-400">No plans available at this time.</p>
      </section>
    );
  }

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
          </div>
          let validatedPlans: PricingPlan[] = [];
          try {
            validatedPlans = validatePlans(plans);
          } catch (err) {
            return (
              <section role="alert" aria-live="assertive">
                <h2 className="text-xl font-semibold text-white">Pricing</h2>
                <p className="mt-4 text-sm text-rose-400">Invalid pricing configuration.</p>
              </section>
            );
          }

        </div>
      </div>
            for (const plan of validatedPlans) {
      {/* Mobile: stacked cards */}
      <div className="mt-8 grid gap-6 sm:hidden">
        {plans.map((plan) => (
          <article
            key={plan.id}
          }, [validatedPlans]);
            <div className="flex items-center justify-between">
          if (!validatedPlans || validatedPlans.length === 0) {
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                {plan.tagline && <p className="text-sm text-slate-400">{plan.tagline}</p>}
              </div>
              {plan.isRecommended && (
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
                  <span className="ml-2 text-slate-400">{
                    typeof f.included === 'boolean' ? (f.included ? 'Included' : '—') : f.included
                  }</span>
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

                {validatedPlans.map((plan) => (
      <div className="mt-8 hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-64 bg-slate-950/60 p-4 text-left text-sm font-medium text-slate-300">Features</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="p-4 text-left align-top">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                          {plan.isRecommended && (
                            <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2 py-1 text-xs font-semibold text-amber-300">
                              Recommended
                            </span>
                          )}
                        </div>
                        {plan.tagline && <p className="text-sm text-slate-400">{plan.tagline}</p>}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{formatMoney(billingYearly ? plan.yearlyPrice : plan.monthlyPrice)}</div>
                        <div className="text-sm text-slate-400">{billingYearly ? yearlyLabel : monthlyLabel}</div>
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
                      {f.description && <div className="mt-1 text-sm text-slate-400">{f.description}</div>}
                    </div>
                  </th>
                  {plans.map((plan) => {
                    const pf = plan.features.find((x) => x.id === f.id);
                    const content = pf ? (typeof pf.included === 'boolean' ? (pf.included ? '✓' : '—') : pf.included) : '—';
                    return (
                      <td key={plan.id} className="p-4 align-top text-sm text-slate-300">
                        {content}
                        {validatedPlans.map((plan) => (
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
"use client";

/**
 * PlanComparison
 *
 * A responsive pricing comparison component that displays available plans
 * in a mobile-friendly card layout (stacked) and transforms to a matrix
 * on desktop with a sticky feature column.
 *
 * Features:
 * - Responsive design: cards on mobile (<768px), matrix on desktop
 * - Monthly/yearly billing toggle with savings calculation
 * - Recommended plan conveyed by both visual styling and ARIA labels
 * - Sticky feature column on desktop for easy scanning
 * - WCAG 2.1 AA accessible with proper heading hierarchy and contrast
 * - Keyboard navigation support
 * - Dark mode optimized
 *
 * Usage:
 * ```tsx
 * import { PlanComparison } from "@/components/dashboard/plan-comparison";
 *
 * <PlanComparison
 *   plans={pricingPlans}
 *   recommendedPlanId="pro"
 * />
 * ```
                          {validatedPlans.map((plan) => {

import { useState, useId, type ReactNode } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { ButtonLink } from "@/app/components/ui/button-link";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface PricingFeature {
  /** Unique identifier for the feature. */
  id: string;
  /** Display name of the feature (e.g., "Time slots per month"). */
  name: string;
  /** Short description of what this feature includes. */
  description?: string;
  /** Whether this feature is included in this plan. Can be string for partial/custom. */
  included: boolean | string;
  /** Category for grouping features (e.g., "Core", "Analytics", "Support"). */
  category?: string;
}

export interface PricingPlan {
  /** Unique identifier for the plan. */
  id: string;
  /** Display name (e.g., "Starter", "Professional", "Enterprise"). */
  name: string;
  /** Optional subtitle or tagline. */
  tagline?: string;
  /** Monthly price in cents (e.g., 9999 = $99.99). */
  monthlyPrice: number;
  /** Yearly price in cents. If not provided, calculated as monthlyPrice * 12. */
  yearlyPrice?: number;
  /** CTA button text (e.g., "Get Started", "Upgrade"). */
  ctaLabel: string;
  /** CTA button href. */
  ctaHref: string;
  /** Array of included features for this plan. */
  features: PricingFeature[];
  /** Whether this plan is highlighted as recommended. */
  isRecommended?: boolean;
  /** Optional description of why this plan is recommended. */
  recommendedReason?: string;
  /** Custom color accent for the plan (e.g., "cyan", "amber"). Used for variants. */
  accentColor?: "cyan" | "amber" | "emerald" | "slate";
}

export interface PlanComparisonProps {
  /** Array of plans to display. */
  plans: PricingPlan[];
  /** ID of the recommended plan to highlight. */
  recommendedPlanId?: string;
  /** Billing period label for monthly. Defaults to "Monthly". */
  monthlyLabel?: string;
  /** Billing period label for yearly. Defaults to "Yearly". */
  yearlyLabel?: string;
  /** Text shown when yearly billing shows savings. Defaults to "Save {savings}%". */
  savingsLabel?: string;
  /** Additional class names applied to the wrapper. */
  className?: string;
  /** Callback when a plan CTA is clicked. Optional for analytics. */
  onSelectPlan?: (planId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

export function PlanComparison({
  plans,
  recommendedPlanId,
  monthlyLabel = "Monthly",
  yearlyLabel = "Yearly",
  savingsLabel = "Save {savings}%",
  className = "",
  onSelectPlan,
}: PlanComparisonProps) {
  const [isYearly, setIsYearly] = useState(false);
  const comparisonId = useId();
  const toggleId = `${comparisonId}-billing-toggle`;

  // Get all unique features across all plans, grouped by category
  const featuresByCategory = getFeaturesByCategory(plans);
  const allFeatures = Object.values(featuresByCategory).flat();

  // Calculate savings percentage if yearly is selected
  const savingsPercentage = calculateSavingsPercentage(plans[0]);

  const handleSelectPlan = (planId: string) => {
    onSelectPlan?.(planId);
  };

  return (
    <div className={clsx("plan-comparison w-full", className)}>
      {/* Header with billing toggle */}
      <div className="mb-8 flex items-center justify-between sm:mb-12">
        <div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Choose the plan that fits your needs
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/4 p-1">
          <button
            id={`${toggleId}-monthly`}
            type="button"
            onClick={() => setIsYearly(false)}
            aria-pressed={!isYearly}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              !isYearly
                ? "bg-white/12 text-white"
                : "text-slate-400 hover:text-white"
            )}
          >
            {monthlyLabel}
          </button>
          <button
            id={`${toggleId}-yearly`}
            type="button"
            onClick={() => setIsYearly(true)}
            aria-pressed={isYearly}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isYearly
                ? "bg-white/12 text-white"
                : "text-slate-400 hover:text-white"
            )}
          >
            {yearlyLabel}
            {isYearly && savingsPercentage > 0 && (
              <span
                className="ml-2 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200"
                aria-label={`${calculateSavingsPercentage(plans[0])}% savings`}
              >
                {savingsLabel.replace("{savings}", String(savingsPercentage))}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile: Stacked card layout */}
      <div className="block space-y-4 md:hidden">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isYearly={isYearly}
            isRecommended={plan.id === recommendedPlanId}
            onSelectPlan={handleSelectPlan}
          />
        ))}
      </div>

      {/* Desktop: Matrix layout with sticky feature column */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" role="table">
            <thead>
              <tr className="border-b border-white/10">
                <th className="sticky left-0 z-10 bg-slate-950 pb-4 pr-4 text-left align-bottom">
                  <span className="sr-only">Feature comparison</span>
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className="pb-4 px-4 text-center align-bottom"
                  >
                    <PlanHeader
                      plan={plan}
                      isYearly={isYearly}
                      isRecommended={plan.id === recommendedPlanId}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(featuresByCategory).map(
                ([category, categoryFeatures]) => [
                  <tr key={`${category}-header`} className="border-b border-white/8">
                    <td
                      colSpan={plans.length + 1}
                      className="bg-white/2 px-4 py-3"
                    >
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {category || "Features"}
                      </h3>
                    </td>
                  </tr>,
                  ...categoryFeatures.map((feature) => (
                    <tr key={feature.id} className="border-b border-white/8">
                      <td className="sticky left-0 z-10 bg-slate-950 py-4 pr-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {feature.name}
                          </p>
                          {feature.description && (
                            <p className="mt-1 text-xs text-slate-400">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </td>
                      {plans.map((plan) => {
                        const planFeature = plan.features.find(
                          (f) => f.id === feature.id
                        );
                        return (
                          <td
                            key={`${plan.id}-${feature.id}`}
                            className="py-4 px-4 text-center"
                          >
                            <FeatureCell
                              feature={planFeature}
                              isRecommended={
                                plan.id === recommendedPlanId
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  )),
                ]
              )}
              {/* CTA row */}
              <tr className="border-t-2 border-white/10">
                <td className="sticky left-0 z-10 bg-slate-950 py-4 pr-4" />
                {plans.map((plan) => (
                  <td key={`${plan.id}-cta`} className="py-4 px-4 text-center">
                    <CTAButton
                      plan={plan}
                      isYearly={isYearly}
                      isRecommended={plan.id === recommendedPlanId}
                      onSelect={handleSelectPlan}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: PricingPlan;
  isYearly: boolean;
  isRecommended: boolean;
  onSelectPlan: (planId: string) => void;
}

function PlanCard({
  plan,
  isYearly,
  isRecommended,
  onSelectPlan,
}: PlanCardProps) {
  const price = formatPrice(isYearly ? plan.yearlyPrice || plan.monthlyPrice * 12 : plan.monthlyPrice);
  const accentColorClass = getAccentColorClass(plan.accentColor);

  return (
    <article
      className={clsx(
        "rounded-2xl border p-6 transition-all",
        isRecommended
          ? clsx("border-cyan-400/50 bg-gradient-to-br from-cyan-500/10 to-transparent shadow-lg shadow-cyan-500/20", accentColorClass)
          : "border-white/10 bg-white/4"
      )}
      aria-label={`${plan.name} plan${isRecommended ? " (recommended)" : ""}`}
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        {plan.tagline && (
          <p className="mt-1 text-sm text-slate-400">{plan.tagline}</p>
        )}
        {isRecommended && plan.recommendedReason && (
          <p
            className="mt-2 text-xs font-medium text-cyan-200"
            aria-label="Why this plan is recommended"
          >
            ★ {plan.recommendedReason}
          </p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">${price}</span>
          <span className="text-sm text-slate-400">/month{isYearly ? " (billed yearly)" : ""}</span>
        </div>
      </div>

      <CTAButton
        plan={plan}
        isYearly={isYearly}
        isRecommended={isRecommended}
        onSelect={onSelectPlan}
        variant="full-width"
      />

      <div className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <div key={feature.id} className="flex items-start gap-3">
            {feature.included ? (
              <Check
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400"
                aria-hidden="true"
              />
            ) : (
              <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border border-slate-500" />
            )}
            <div className="flex-1">
              <p
                className={clsx(
                  "text-sm",
                  feature.included ? "text-slate-200" : "text-slate-500"
                )}
              >
                {feature.name}
              </p>
              {typeof feature.included === "string" && (
                <p className="text-xs text-slate-400">{feature.included}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

interface PlanHeaderProps {
  plan: PricingPlan;
  isYearly: boolean;
  isRecommended: boolean;
}

function PlanHeader({ plan, isYearly, isRecommended }: PlanHeaderProps) {
  const price = formatPrice(isYearly ? plan.yearlyPrice || plan.monthlyPrice * 12 : plan.monthlyPrice);
  const accentColorClass = getAccentColorClass(plan.accentColor);

  return (
    <div
      className={clsx(
        "rounded-xl border p-4 transition-all",
        isRecommended
          ? clsx("border-cyan-400/50 bg-gradient-to-br from-cyan-500/10 to-transparent", accentColorClass)
          : "border-white/10 bg-white/2"
      )}
      aria-label={`${plan.name} plan${isRecommended ? " (recommended)" : ""}`}
    >
      <h3 className="font-bold text-white">{plan.name}</h3>
      {plan.tagline && (
        <p className="mt-1 text-xs text-slate-400">{plan.tagline}</p>
      )}
      {isRecommended && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-200">
          <span aria-label="This is the recommended plan">★ Recommended</span>
        </div>
      )}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">${price}</span>
        <span className="text-xs text-slate-400">/mo{isYearly ? " yearly" : ""}</span>
      </div>
    </div>
  );
}

interface FeatureCellProps {
  feature?: PricingFeature;
  isRecommended: boolean;
}

function FeatureCell({ feature, isRecommended }: FeatureCellProps) {
  if (!feature) {
    return (
      <div className="h-4 w-4 mx-auto rounded-full border border-slate-600" aria-hidden="true" />
    );
  }

  if (feature.included === false) {
    return (
      <div className="h-4 w-4 mx-auto rounded-full border border-slate-600" aria-hidden="true" />
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Check
        className={clsx(
          "h-5 w-5 flex-shrink-0",
          isRecommended ? "text-cyan-300" : "text-emerald-400"
        )}
        aria-hidden="true"
      />
      {typeof feature.included === "string" && (
        <span className="text-sm text-slate-300">{feature.included}</span>
      )}
    </div>
  );
}

interface CTAButtonProps {
  plan: PricingPlan;
  isYearly: boolean;
  isRecommended: boolean;
  onSelect: (planId: string) => void;
  variant?: "default" | "full-width";
}

function CTAButton({
  plan,
  isYearly,
  isRecommended,
  onSelect,
  variant = "default",
}: CTAButtonProps) {
  const handleClick = () => {
    onSelect(plan.id);
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-ring-cyan",
        variant === "full-width" ? "w-full" : "",
        isRecommended
          ? "bg-cyan-300 px-6 py-3 text-slate-950 hover:bg-cyan-200"
          : "border border-white/12 bg-white/6 px-6 py-3 text-slate-100 hover:border-cyan-200/30 hover:bg-white/10"
      )}
      aria-label={`Select ${plan.name} plan`}
    >
      {plan.ctaLabel}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function calculateSavingsPercentage(plan?: PricingPlan): number {
  if (!plan) return 0;
  const monthlyYearlyTotal = plan.monthlyPrice * 12;
  const yearlyPrice = plan.yearlyPrice || monthlyYearlyTotal;
  if (monthlyYearlyTotal <= yearlyPrice) return 0;
  return Math.round(((monthlyYearlyTotal - yearlyPrice) / monthlyYearlyTotal) * 100);
}

function getFeaturesByCategory(
  plans: PricingPlan[]
): Record<string, PricingFeature[]> {
  const features: Record<string, PricingFeature[]> = {};

  plans.forEach((plan) => {
    plan.features.forEach((feature) => {
      const category = feature.category || "Core Features";
      if (!features[category]) {
        features[category] = [];
      }
      // Add feature if not already present (avoid duplicates)
      if (!features[category].find((f) => f.id === feature.id)) {
        features[category].push(feature);
      }
    });
  });

  return features;
}

function getAccentColorClass(accentColor?: string): string {
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    slate: "text-slate-300",
  };
  return colorMap[accentColor || "slate"];
}
