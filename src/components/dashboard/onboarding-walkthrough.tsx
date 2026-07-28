"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { X } from "lucide-react";

export type WalkthroughStep = {
  id: string;
  /** Matches `data-tour-target` on the highlighted region. */
  target: string;
  title: string;
  body: string;
};

export const DEFAULT_WALKTHROUGH_STEPS: readonly WalkthroughStep[] = [
  {
    id: "metrics",
    target: "metrics",
    title: "Sample metrics preview",
    body: "These cards show how your dashboard will look once you have activity. Each sample value is marked so it is never confused with live data.",
  },
  {
    id: "slots",
    target: "slots",
    title: "Sample time slots",
    body: "Preview listings carry a Sample badge and tooltip. Explore the layout, then clear samples when you are ready to list real availability.",
  },
  {
    id: "clear",
    target: "clear-samples",
    title: "Clear sample data",
    body: "When you understand the layout, remove the demo rows. Your empty dashboard will be ready for real slots and wallet activity.",
  },
] as const;

export type OnboardingWalkthroughProps = {
  steps?: readonly WalkthroughStep[];
  open: boolean;
  onSkip: () => void;
  onComplete: () => void;
  onClearSamples: () => void;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function prefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function measureTarget(target: string): SpotlightRect | null {
  const el = document.querySelector<HTMLElement>(
    `[data-tour-target="${target}"]`,
  );
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const pad = 8;
  return {
    top: Math.max(0, rect.top - pad),
    left: Math.max(0, rect.left - pad),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
}

/**
 * Guided coach-mark tour for onboarding sample data.
 * WCAG 2.1 AA: dialog role, Escape to dismiss, focus trap, live step updates.
 *
 * Remount (via `key`) when reopening so step index resets without an effect.
 */
export function OnboardingWalkthrough({
  steps = DEFAULT_WALKTHROUGH_STEPS,
  open,
  onSkip,
  onComplete,
  onClearSamples,
}: OnboardingWalkthroughProps) {
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const announcement = step
    ? `Step ${stepIndex + 1} of ${steps.length}: ${step.title}`
    : "";

  const refreshSpotlight = useCallback((target: string) => {
    const rect = measureTarget(target);
    setSpotlight(rect);
    if (!rect) return;
    const el = document.querySelector<HTMLElement>(
      `[data-tour-target="${target}"]`,
    );
    el?.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  useEffect(() => {
    if (!open || !step) return;

    const frame = requestAnimationFrame(() => {
      refreshSpotlight(step.target);
      primaryBtnRef.current?.focus();
    });

    const onViewportChange = () => refreshSpotlight(step.target);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, step, refreshSpotlight]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onSkip();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const goNext = () => {
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const goBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  if (!open || !step) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <div
        className="absolute inset-0 bg-slate-950/70"
        aria-hidden="true"
        data-testid="walkthrough-backdrop"
        onClick={onSkip}
      />

      {spotlight ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[1.25rem] ring-2 ring-cyan-300/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)]"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      ) : null}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={handleKeyDown}
        className="absolute inset-x-3 bottom-4 z-[81] w-auto max-w-md rounded-[1.5rem] border border-white/12 bg-slate-950 p-4 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.95)] sm:inset-x-auto sm:start-8 sm:bottom-8 sm:w-[min(100%-2rem,24rem)] sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">
              Walkthrough · {stepIndex + 1}/{steps.length}
            </p>
            <h2 id={titleId} className="text-lg font-semibold text-white">
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 text-slate-300 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="Skip walkthrough"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p id={bodyId} className="mt-3 text-sm leading-6 text-slate-300">
          {step.body}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-11 rounded-full px-4 text-sm font-medium text-slate-300 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Skip tour
          </button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/5 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Back
              </button>
            ) : null}

            {isLast ? (
              <button
                ref={primaryBtnRef}
                type="button"
                onClick={() => {
                  onClearSamples();
                  onComplete();
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Clear samples
              </button>
            ) : (
              <button
                ref={primaryBtnRef}
                type="button"
                onClick={goNext}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
