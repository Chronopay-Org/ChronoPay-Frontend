"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, ChevronLeft, SkipForward } from "lucide-react";
import { Card, CardBody, CardFooter, CardHeader } from "./card";
import { useWizardProgress } from "@/hooks/use-wizard-progress";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SupplierOnboardingStep = {
  id: string;
  title: string;
  description: string;
  /** Optional sections can be deferred later via the skip toggle. */
  optional?: boolean;
  /** Step body — form fields, summaries, etc. */
  content: ReactNode;
  /** Whether the step currently satisfies its own validation. */
  isComplete: boolean;
  /** Shown inline when the user tries to advance from an incomplete step. */
  errorMessage?: string;
};

export type SupplierOnboardingWizardProps = {
  steps: SupplierOnboardingStep[];
  /** sessionStorage key used to persist progress across the session. */
  storageKey?: string;
  heading?: string;
  onStepChange?: (stepId: string) => void;
  onSkipToggle?: (stepId: string, skipped: boolean) => void;
  onComplete?: () => void;
};

type RailStepStatus = "complete" | "current" | "skipped" | "upcoming";

// ---------------------------------------------------------------------------
// SupplierOnboardingWizard
// ---------------------------------------------------------------------------

/**
 * Multi-step supplier onboarding layout: a persistent side rail (top strip on
 * mobile) tracks progress across steps, the active step renders in the main
 * panel with per-step validation, and optional sections expose a "Skip for
 * now" toggle. Progress persists to sessionStorage via `useWizardProgress`.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Rail is a `<nav>` with an ordered list; the current step uses `aria-current="step"`.
 *   - Rail steps beyond the furthest reached step are `aria-disabled` (kept focusable-but-inert
 *     rather than removed, so screen reader users still perceive the full journey).
 *   - Validation errors render via `role="alert"` only when the user attempts to advance,
 *     avoiding a disabled Next button that would give no explanation.
 *   - A polite live region announces step changes ("Step X of N: Title").
 *   - Focus moves to the new step's heading on navigation (not on initial mount).
 *   - Skip toggle uses `role="switch"` with `aria-checked`.
 */
export function SupplierOnboardingWizard({
  steps,
  storageKey = "supplier-onboarding-wizard",
  heading = "Supplier onboarding",
  onStepChange,
  onSkipToggle,
  onComplete,
}: SupplierOnboardingWizardProps) {
  const baseId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const isFirstRender = useRef(true);

  const { currentIndex, furthestIndex, skippedIds, goToIndex, goNext, goBack, toggleSkip } =
    useWizardProgress(storageKey, steps.length);

  const [attemptedAdvance, setAttemptedAdvance] = useState(false);

  const safeIndex = Math.min(currentIndex, Math.max(steps.length - 1, 0));
  const currentStep = steps[safeIndex];
  const isLastStep = safeIndex === steps.length - 1;
  const isSkipped = currentStep ? skippedIds.includes(currentStep.id) : false;
  const canAdvance = currentStep ? isSkipped || currentStep.isComplete : false;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    setAttemptedAdvance(false);
    if (currentStep) onStepChange?.(currentStep.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex]);

  useEffect(() => {
    if (attemptedAdvance && !canAdvance) {
      errorRef.current?.focus();
    }
  }, [attemptedAdvance, canAdvance]);

  if (!currentStep) return null;

  const announcement = `Step ${safeIndex + 1} of ${steps.length}: ${currentStep.title}`;

  const handleNext = () => {
    if (!canAdvance) {
      setAttemptedAdvance(true);
      return;
    }
    if (isLastStep) {
      onComplete?.();
      return;
    }
    goNext();
  };

  const handleSkipToggle = () => {
    const next = !isSkipped;
    toggleSkip(currentStep.id, next);
    onSkipToggle?.(currentStep.id, next);
    setAttemptedAdvance(false);
  };

  return (
    <Card as="section" variant="panel" aria-labelledby={`${baseId}-heading`}>
      <CardHeader className="flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id={`${baseId}-heading`} className="text-sm font-semibold text-white">
            {heading}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Step {safeIndex + 1} of {steps.length}
          </p>
        </div>
        <div
          className="h-1.5 w-full max-w-[10rem] overflow-hidden rounded-full bg-white/10 sm:w-40"
          role="progressbar"
          aria-valuenow={safeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Onboarding progress: step ${safeIndex + 1} of ${steps.length}`}
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#67e8f9,#22c55e)] transition-[width] duration-300"
            style={{ width: `${((safeIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <CardBody className="mt-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <WizardRail
            steps={steps}
            currentIndex={safeIndex}
            furthestIndex={furthestIndex}
            skippedIds={skippedIds}
            baseId={baseId}
            onSelect={goToIndex}
          />

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h3
                ref={headingRef}
                tabIndex={-1}
                className="text-base font-semibold text-white outline-none"
              >
                {currentStep.title}
                {currentStep.optional ? (
                  <span className="ms-2 align-middle text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Optional
                  </span>
                ) : null}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{currentStep.description}</p>
            </div>

            {currentStep.optional ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Skip this step for now</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    You can finish this later from your dashboard.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isSkipped}
                  aria-label="Skip this step for now"
                  onClick={handleSkipToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                    isSkipped ? "border-cyan-300 bg-cyan-400" : "border-white/15 bg-white/10"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      isSkipped ? "translate-x-[22px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </div>
            ) : null}

            <div aria-disabled={isSkipped} className={isSkipped ? "opacity-50" : undefined}>
              {currentStep.content}
            </div>

            {attemptedAdvance && !canAdvance ? (
              <p
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 outline-none"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {currentStep.errorMessage ??
                  "Complete the required fields to continue, or use the toggle above if this section is optional."}
              </p>
            ) : null}
          </div>
        </div>
      </CardBody>

      <CardFooter className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={safeIndex === 0}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {isLastStep ? "Finish" : "Next"}
        </button>
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// WizardRail
// ---------------------------------------------------------------------------

function WizardRail({
  steps,
  currentIndex,
  furthestIndex,
  skippedIds,
  baseId,
  onSelect,
}: {
  steps: SupplierOnboardingStep[];
  currentIndex: number;
  furthestIndex: number;
  skippedIds: string[];
  baseId: string;
  onSelect: (index: number) => void;
}) {
  return (
    <nav
      aria-label="Onboarding steps"
      className="shrink-0 md:sticky md:top-20 md:w-64"
    >
      <ol className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
        {steps.map((step, index) => {
          const reachable = index <= furthestIndex;
          const status: RailStepStatus = skippedIds.includes(step.id)
            ? "skipped"
            : index === currentIndex
              ? "current"
              : index < currentIndex || (reachable && step.isComplete)
                ? "complete"
                : "upcoming";

          return (
            <li key={step.id} className="shrink-0 md:shrink">
              <button
                type="button"
                id={`${baseId}-rail-${step.id}`}
                aria-current={status === "current" ? "step" : undefined}
                aria-disabled={!reachable}
                disabled={!reachable}
                onClick={() => onSelect(index)}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 md:gap-3 ${
                  status === "current"
                    ? "border-cyan-300/40 bg-cyan-400/10 text-white"
                    : "border-transparent text-slate-300 hover:bg-white/5"
                } ${!reachable ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <RailMarker status={status} index={index} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{step.title}</span>
                  {step.optional ? (
                    <span className="block text-[11px] text-slate-500">
                      {status === "skipped" ? "Skipped for now" : "Optional"}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function RailMarker({ status, index }: { status: RailStepStatus; index: number }) {
  if (status === "complete") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-500/20 text-slate-400">
        <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
        status === "current"
          ? "bg-cyan-300 text-slate-950"
          : "bg-white/10 text-slate-400"
      }`}
    >
      {index + 1}
    </span>
  );
}
