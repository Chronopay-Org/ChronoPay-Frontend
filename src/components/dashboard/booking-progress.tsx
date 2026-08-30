"use client";

import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import type { AutosaveStatus, BookingStage } from "./types";
import { AutosaveIndicator } from "./autosave-indicator";
import { LiveRegion } from "@/components/common/LiveRegion";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type BookingFlowValidationSummary = {
  title?: string;
  items?: string[];
};

export type BookingFlowStep = {
  id: string;
  title: string;
  description?: string;
  summary?: string[];
  validationSummary?: BookingFlowValidationSummary;
};

export type BookingFlowShellProps = {
  steps?: BookingFlowStep[];
  currentStep?: number;
  onBack?: (stepIndex: number) => void;
  onNext?: (stepIndex: number) => void;
  unsavedChanges?: boolean;
  ariaLabel?: string;
};

export function BookingProgress({
  stages,
  autosaveStatus,
  autosaveLastSavedAt,
  onAutosaveRetry,
}: {
  stages: BookingStage[];
  autosaveStatus?: AutosaveStatus;
  autosaveLastSavedAt?: Date;
  onAutosaveRetry?: () => void;
}) {
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <div className="space-y-5">
      {/* Heading row — "Booking stages" label with lifecycle explanation */}
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Booking stages
        </p>
        <HelpPopover
          term={glossary.bookingStages}
          triggerLabel="Help: booking lifecycle stages"
        />
        {autosaveStatus ? (
          <AutosaveIndicator
            status={autosaveStatus}
            lastSavedAt={autosaveLastSavedAt}
            onRetry={onAutosaveRetry}
          />
        ) : null}
      </div>

      {stages.map((stage, index) => {
        const labelId = `booking-label-${index}`;
        const valueId = `booking-value-${index}`;
        return (
          <div
            key={`${stage.label}-${index}`}
            role="listitem"
            aria-labelledby={labelId}
            aria-describedby={valueId}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p id={labelId} className="text-sm font-medium text-white">
                {stage.label}
              </p>
              <p id={valueId} className="text-sm text-slate-300" aria-atomic="true">
                {stage.value} bookings
              </p>
            </div>
            <div className="h-2.5 rounded-full bg-white/10" aria-hidden={true}>
              <div
                className="h-2.5 rounded-full bg-[linear-gradient(90deg,#67e8f9,#22c55e)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${(stage.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BookingFlowShell({
  steps = [],
  currentStep = 0,
  onBack,
  onNext,
  unsavedChanges = false,
  ariaLabel = "Booking progress",
}: BookingFlowShellProps) {
  const safeSteps = steps.filter((step) => step && step.title);
  const boundedIndex =
    safeSteps.length === 0
      ? 0
      : Math.min(Math.max(currentStep, 0), safeSteps.length - 1);
  const activeStep = safeSteps[boundedIndex] ?? null;
  const isLastStep = safeSteps.length > 0 && boundedIndex === safeSteps.length - 1;

  const confirmNavigation = (direction: "back" | "next") => {
    if (!unsavedChanges) return true;
    if (typeof window === "undefined") return true;
    const shouldLeave = window.confirm(
      "You have unsaved changes. Are you sure you want to leave this step?",
    );
    if (!shouldLeave) return false;
    if (direction === "back" && onBack) {
      onBack(boundedIndex);
    }
    if (direction === "next" && onNext) {
      onNext(boundedIndex);
    }
    return true;
  };

  const handleBack = () => {
    if (unsavedChanges) {
      const shouldLeave = confirmNavigation("back");
      if (!shouldLeave) return;
      return;
    }
    if (onBack) {
      onBack(boundedIndex);
    }
  };

  const handleNext = () => {
    if (unsavedChanges) {
      const shouldLeave = confirmNavigation("next");
      if (!shouldLeave) return;
      return;
    }
    if (onNext) {
      onNext(boundedIndex);
    }
  };

  const announcement = activeStep
    ? `Step ${boundedIndex + 1} of ${safeSteps.length}: ${activeStep.title}`
    : "No booking steps available";

  const validationSummary = activeStep?.validationSummary ?? {
    title: "No issues to review",
    items: ["All required booking details are complete."],
  };

  return (
    <div className="space-y-5">
      <LiveRegion>{announcement}</LiveRegion>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <nav
          aria-label={ariaLabel}
          className="lg:sticky lg:top-6 self-start rounded-2xl border border-slate-200/10 bg-slate-900/70 p-4 shadow-sm"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Booking progress
          </p>
          {safeSteps.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No booking steps available.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {safeSteps.map((step, index) => {
                const isComplete = index < boundedIndex;
                const isCurrent = index === boundedIndex;

                return (
                  <li key={step.id ?? `${step.title}-${index}`}>
                    <div
                      className={[
                        "flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors motion-reduce:transition-none",
                        isCurrent
                          ? "border-cyan-400/80 bg-cyan-500/10 text-white"
                          : isComplete
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
                            : "border-slate-700 bg-slate-950/40 text-slate-300",
                      ].join(" ")}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span
                        className={[
                          "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold",
                          isCurrent
                            ? "bg-cyan-400 text-slate-950"
                            : isComplete
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-700 text-slate-200",
                        ].join(" ")}
                      >
                        {isComplete ? "✓" : index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{step.title}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </nav>

        <section className="rounded-2xl border border-slate-200/10 bg-slate-900/60 p-5 shadow-sm">
          {activeStep ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                    Step {boundedIndex + 1} of {safeSteps.length}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {activeStep.title}
                  </h3>
                </div>
                <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
                  {isLastStep ? "Final" : "In progress"}
                </span>
              </div>

              {activeStep.description ? (
                <p className="mt-3 text-sm text-slate-300">{activeStep.description}</p>
              ) : null}

              <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Confirmed details
                </p>
                {activeStep.summary && activeStep.summary.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {activeStep.summary.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-300">No details have been confirmed yet.</p>
                )}
              </div>

              <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                  {validationSummary.title ?? "Review required"}
                </p>
                {validationSummary.items && validationSummary.items.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-amber-50">
                    {validationSummary.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-amber-50">Looks good. No further validation needed.</p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={boundedIndex === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-100 transition motion-reduce:transition-none hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Back"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3.5 py-2 text-sm font-semibold text-slate-950 transition motion-reduce:transition-none hover:bg-cyan-300"
                  aria-label={isLastStep ? "Complete booking" : "Next"}
                >
                  {isLastStep ? "Complete" : "Next"}
                  {!isLastStep ? <ArrowRight size={16} aria-hidden="true" /> : null}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-sm text-slate-300">
              No booking steps available.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
