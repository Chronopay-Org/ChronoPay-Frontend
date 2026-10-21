"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ChevronRight, X } from "lucide-react";
import { FocusTrap } from "@/components/common/FocusTrap";

export type OnboardingTourStep = {
  id: string;
  /** Matches `data-tour-target` on the highlighted region. */
  target: string;
  title: string;
  body: string;
  /** Optional position: 'top', 'bottom', 'left', 'right'. Default: 'bottom' */
  position?: "top" | "bottom" | "left" | "right";
};

export const DEFAULT_TOUR_STEPS: readonly OnboardingTourStep[] = [
  {
    id: "wallet-connect",
    target: "wallet-card",
    title: "Connect Your Wallet",
    body: "Start by connecting your Stellar wallet. This allows you to mint and trade time tokens securely.",
    position: "bottom",
  },
  {
    id: "quick-actions",
    target: "quick-actions",
    title: "Quick Actions",
    body: "Use these shortcuts to access common tasks like creating slots, viewing earnings, and managing your portfolio.",
    position: "bottom",
  },
  {
    id: "time-slots",
    target: "available-time-slots",
    title: "Manage Your Time Slots",
    body: "Create and manage your availability slots here. Your calendar reflects the time you're available for bookings or services.",
    position: "top",
  },
] as const;

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

type CoachMarkPosition = {
  top: string;
  left: string;
  maxWidth: string;
};

function getCoachMarkPosition(
  spotlight: SpotlightRect,
  position: "top" | "bottom" | "left" | "right",
): CoachMarkPosition {
  const gap = 16;
  const coachMarkWidth = 300;

  switch (position) {
    case "top":
      return {
        top: `${Math.max(0, spotlight.top - coachMarkWidth - gap)}px`,
        left: `${Math.max(0, spotlight.left)}px`,
        maxWidth: "320px",
      };
    case "left":
      return {
        top: `${Math.max(0, spotlight.top)}px`,
        left: `${Math.max(0, spotlight.left - coachMarkWidth - gap)}px`,
        maxWidth: "300px",
      };
    case "right":
      return {
        top: `${Math.max(0, spotlight.top)}px`,
        left: `${spotlight.left + spotlight.width + gap}px`,
        maxWidth: "300px",
      };
    case "bottom":
    default:
      return {
        top: `${spotlight.top + spotlight.height + gap}px`,
        left: `${Math.max(0, spotlight.left)}px`,
        maxWidth: "320px",
      };
  }
}

/**
 * First-run onboarding tour for the dashboard.
 * WCAG 2.1 AA: dialog role, Escape to dismiss, focus trap, live step updates.
 *
 * Remount (via `key`) when opening so step index resets without an effect.
 */
export function OnboardingTour({
  steps = DEFAULT_TOUR_STEPS,
  open,
  onComplete,
}: {
  steps?: readonly OnboardingTourStep[];
  open: boolean;
  onComplete: () => void;
}) {
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const reduced = prefersReducedMotion();

  // Measure target element for current step
  useEffect(() => {
    if (!open || !currentStep) return;
    const measure = () => {
      const rect = measureTarget(currentStep.target);
      setSpotlight(rect);
    };
    measure();
    window.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [open, currentStep, stepIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onComplete();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        if (isLastStep) {
          onComplete();
        } else {
          setStepIndex((i) => Math.min(i + 1, steps.length - 1));
        }
      } else if (e.key === "ArrowLeft") {
        setStepIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isLastStep, steps.length, onComplete]);

  // Focus primary button on mount
  useEffect(() => {
    if (open) {
      setTimeout(() => primaryBtnRef.current?.focus(), 100);
    }
  }, [open, stepIndex]);

  if (!open || !currentStep || !spotlight) return null;

  const coachMarkPos = getCoachMarkPosition(
    spotlight,
    currentStep.position || "bottom",
  );
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  return (
    <FocusTrap>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop overlay */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            reduced ? "opacity-50" : "opacity-50"
          }`}
          onClick={onComplete}
          aria-hidden="true"
        />

        {/* Spotlight circle around target */}
        <svg
          className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
            reduced ? "" : ""
          }`}
          width="100%"
          height="100%"
          style={{
            filter: "drop-shadow(0 0 0 9999px rgba(0, 0, 0, 0.5))",
          }}
        >
          <rect
            x={spotlight.left + scrollX}
            y={spotlight.top + scrollY}
            width={spotlight.width}
            height={spotlight.height}
            rx="8"
            fill="white"
          />
        </svg>

        {/* Coach-mark card */}
        <div
          ref={dialogRef}
          className="absolute z-50 rounded-lg border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-2xl"
          style={{
            top: coachMarkPos.top,
            left: coachMarkPos.left,
            maxWidth: coachMarkPos.maxWidth,
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onComplete}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/50 p-0 text-slate-300 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Title */}
          <h2
            id={titleId}
            className="mb-2 text-lg font-semibold text-white pr-6"
          >
            {currentStep.title}
          </h2>

          {/* Body */}
          <p
            id={bodyId}
            className="mb-6 text-sm leading-relaxed text-slate-300"
          >
            {currentStep.body}
          </p>

          {/* Step indicator */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Step {stepIndex + 1} of {steps.length}
            </span>
            {/* Progress dots */}
            <div className="flex gap-1">
              {Array.from({ length: steps.length }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStepIndex(i)}
                  className={`h-2 rounded-full transition ${
                    i === stepIndex
                      ? "w-6 bg-cyan-400"
                      : "w-2 bg-slate-600 hover:bg-slate-500"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                  aria-current={i === stepIndex ? "step" : undefined}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onComplete}
              className="flex-1 rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Skip
            </button>
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onComplete();
                } else {
                  setStepIndex((i) => Math.min(i + 1, steps.length - 1));
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:from-cyan-600 hover:to-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {isLastStep ? "Finish" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
