"use client";

/**
 * RebookingDialog
 *
 * Modal flow for a cancelled / rescheduled time-token. Lets the buyer choose
 * between rebooking with the same supplier (nearest-equivalent slot), converting
 * the paid value to account credit, or requesting a refund — then confirms the
 * choice with full original-token context before submitting.
 *
 * Accessibility (WCAG 2.1 AA):
 *  - Modal container exposes role="dialog" + aria-modal="true", is labelled by
 *    the visible heading and re-announced to SRs via a sr-only live region.
 *  - Focus is moved into the panel on open and restored to the trigger on close.
 *  - Tab and Shift+Tab are trapped inside the panel; Escape closes.
 *  - Choice groups use native radios with arrow-key / Home / End navigation.
 *  - Inline help text explicitly distinguishes "rebook same supplier" from
 *    "convert to credit" so the two are never conflated.
 *  - Async submission uses a double-submit guard (aria-busy on the panel),
 *    surfaces failures with role="alert" + a "Try again" action, and announces
 *    completion via aria-live. Reduced-motion is respected via motion-reduce.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowRightLeft,
  Check,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  Wallet,
  X,
} from "lucide-react";
import { StatusChip } from "./status-chip";
import {
  CHOICE_HELP,
  matchLabel,
  sortedNearest,
  type AlternativeSlot,
  type RebookingChoice,
} from "./rebooking-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RebookingDialogProps = {
  /** When false the dialog is not rendered. */
  open: boolean;
  /** Called on Escape, backdrop click, cancel, or after the confirmation closes. */
  onClose: () => void;
  /** Title of the cancelled / rescheduled time-token. */
  tokenTitle: string;
  /** Date label of the cancelled / rescheduled time-token. */
  tokenDateLabel: string;
  /** Time range of the cancelled / rescheduled time-token. */
  tokenTimeRange: string;
  /** Original booking price in XLM (optional). */
  originalPriceXlm?: number;
  /**
   * Alternatives considered for a rebook. Undefined means no rebook option is
   * available; an empty array disables the rebook choice with an explanation.
   */
  alternatives?: AlternativeSlot[];
  /** Currency symbol / unit label (default "XLM"). */
  currency?: string;
  /**
   * Executed when the buyer confirms. May be async; rejections surface an
   * inline error with a retry action. Receives the chosen action and, for a
   * rebook, the selected alternative slot id.
   */
  onConfirm: (
    choice: RebookingChoice,
    detail: { alternativeId?: string },
  ) => Promise<void> | void;
  /** Custom label for the confirmation action button. */
  confirmActionLabel?: string;
};

type Step = "choice" | "confirm" | "done";

const CHOICES: RebookingChoice[] = ["rebook", "credit", "refund"];

const CHOICE_ICONS: Record<RebookingChoice, ReactNode> = {
  rebook: <RotateCcw className="h-4 w-4" aria-hidden="true" />,
  credit: <Wallet className="h-4 w-4" aria-hidden="true" />,
  refund: <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />,
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Round an XLM amount for display, trimming trailing zeros. */
function formatAmount(amount: number, currency: string): string {
  return `${amount.toFixed(2).replace(/\.?0+$/, "")} ${currency}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RebookingDialog({
  open,
  onClose,
  tokenTitle,
  tokenDateLabel,
  tokenTimeRange,
  originalPriceXlm,
  alternatives,
  currency = "XLM",
  onConfirm,
  confirmActionLabel,
}: RebookingDialogProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const statusId = `${baseId}-status`;
  const helpId = `${baseId}-help`;
  const errorId = `${baseId}-error`;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const choiceRefs = useRef<Array<HTMLInputElement | null>>([]);
  const alternativeRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [step, setStep] = useState<Step>("choice");
  const [choice, setChoice] = useState<RebookingChoice | null>(null);
  const [selectedAltId, setSelectedAltId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  const ranked = sortedNearest(alternatives ?? [], tokenTimeRange);
  const hasAlternatives = (alternatives?.length ?? 0) > 0;

  // Reset transient state whenever the dialog is (re)opened. This uses the
  // "adjusting state during render" pattern — no side effects required.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStep("choice");
      setChoice(null);
      setSelectedAltId(null);
      setSubmitting(false);
      setErrorMessage("");
      setAnnouncement("");
    }
  }

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  const reset = useCallback(() => {
    setStep("choice");
    setChoice(null);
    setSelectedAltId(null);
    setSubmitting(false);
    setErrorMessage("");
    setAnnouncement("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  // ref-based focus helpers so Escape / trap handlers stay stable
  useFocusLifecycle(open, panelRef, restoreFocusRef);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== "Tab") return;

      const scope = panelRef.current;
      if (!scope) return;
      const focusable = Array.from(
        scope.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !scope.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !scope.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    },
    [handleClose],
  );

  const selectChoice = useCallback(
    (next: RebookingChoice) => {
      setChoice(next);
      setErrorMessage("");
      if (next === "rebook") {
        const firstId = ranked[0]?.id;
        setSelectedAltId((current) => current ?? firstId ?? null);
        announce(
          `Rebook with the same supplier${
            firstId ? ". Choose an alternative slot below." : " — no matching slots are available."
          }`,
        );
      } else {
        setSelectedAltId(null);
        announce(`${CHOICE_HELP[next].title} selected.`);
      }
    },
    [announce, ranked],
  );

  const handleChoiceKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    const dir =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;
    if (dir === 0 && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const nextIndex =
      dir !== 0
        ? (index + dir + CHOICES.length) % CHOICES.length
        : event.key === "Home"
          ? 0
          : CHOICES.length - 1;
    const next = CHOICES[nextIndex];
    choiceRefs.current[nextIndex]?.focus();
    selectChoice(next);
  };

  const handleAlternativeKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    const dir =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;
    if (dir === 0 && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const nextIndex =
      dir !== 0
        ? (index + dir + ranked.length) % ranked.length
        : event.key === "Home"
          ? 0
          : ranked.length - 1;
    alternativeRefs.current[nextIndex]?.focus();
    const nextId = ranked[nextIndex]?.id ?? null;
    if (nextId) {
      setSelectedAltId(nextId);
      announce(`Selected ${ranked[nextIndex]?.title ?? "alternative slot"}.`);
    }
  };

  const goToConfirm = () => {
    if (!choice) return;
    setStep("confirm");
    setErrorMessage("");
    announce(`Confirming: ${CHOICE_HELP[choice].title}.`);
  };

  const handleSubmit = async () => {
    if (!choice || submitting) return;
    if (choice === "rebook" && hasAlternatives && !selectedAltId) return;

    setSubmitting(true);
    setErrorMessage("");
    announce("Submitting your rebooking choice.");
    try {
      await onConfirm(choice, {
        alternativeId:
          choice === "rebook" ? (selectedAltId ?? undefined) : undefined,
      });
      setStep("done");
      setSubmitting(false);
      announce(`${CHOICE_HELP[choice].title} confirmed.`);
    } catch {
      setSubmitting(false);
      setErrorMessage(
        "We couldn't complete your request. Nothing was changed. Please try again.",
      );
      announce("Request failed. Please try again.");
    }
  };

  const actionLabel =
    confirmActionLabel ??
    (choice === "rebook"
      ? "Confirm rebooking"
      : choice === "credit"
        ? "Confirm credit"
        : "Confirm refund");

  if (!open) return null;

  const priceText =
    originalPriceXlm !== undefined
      ? formatAmount(originalPriceXlm, currency)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
        data-testid="rebooking-backdrop"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={helpId}
        aria-busy={submitting}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-950 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold text-white sm:text-xl"
            >
              {step === "done" ? "All set" : "Rebook this time-token"}
            </h2>
            <p id={helpId} className="mt-1 text-xs text-slate-400">
              {step === "done"
                ? "Your booking decision is being prepared."
                : "Choose how you want to make this time-token whole — then confirm below."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close rebooking dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Original token context */}
        <div
          className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm"
          aria-label="Original time-token"
        >
          <span className="font-medium text-white">{tokenTitle}</span>
          <span className="text-slate-400">
            {tokenDateLabel} · {tokenTimeRange}
          </span>
          {priceText ? (
            <span className="font-mono tabular-nums text-cyan-200">
              {priceText}
            </span>
          ) : null}
          <StatusChip tone="warning" className="ml-auto">
            Cancelled
          </StatusChip>
        </div>

        {step === "choice" && (
          <div className="mt-5 space-y-5">
            {/* Choice group */}
            <fieldset>
              <legend className="text-sm font-semibold text-white">
                How would you like to rebook?
              </legend>
              <div
                className="mt-3 space-y-3"
                role="radiogroup"
                aria-label="Rebooking options"
              >
                {CHOICES.map((value, index) => {
                  const disabled = value === "rebook" && !hasAlternatives;
                  const selected = choice === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                        selected
                          ? "border-cyan-400/40 bg-cyan-400/[0.06]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/25",
                        disabled && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        ref={(el) => {
                          choiceRefs.current[index] = el;
                        }}
                        type="radio"
                        name={`rebook-choice-${baseId}`}
                        value={value}
                        checked={selected}
                        disabled={disabled}
                        tabIndex={selected ? 0 : -1}
                        onChange={() => selectChoice(value)}
                        onKeyDown={(event) => handleChoiceKeyDown(event, index)}
                        className="mt-1 h-4 w-4 accent-cyan-400"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-semibold text-white">
                          {CHOICE_ICONS[value]}
                          {CHOICE_HELP[value].title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-400">
                          {CHOICE_HELP[value].description}
                        </span>
                        {disabled ? (
                          <span className="mt-1.5 block text-xs font-medium text-amber-200">
                            No matching slots available from this supplier right
                            now. Convert to credit or request a refund instead.
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Alternatives — only relevant for rebook */}
            {choice === "rebook" && hasAlternatives ? (
              <fieldset>
                <legend className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span>Pick the closest matching slot</span>
                  <span className="text-xs font-normal text-slate-400">
                    from the same supplier
                  </span>
                </legend>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Alternatives are ranked by proximity to your original booking
                  time. Same supplier, same guarantees.
                </p>
                <div
                  className="mt-3 space-y-2"
                  role="radiogroup"
                  aria-label="Alternative slots from the same supplier"
                >
                  {ranked.map((alt, index) => {
                    const selected = selectedAltId === alt.id;
                    return (
                      <label
                        key={alt.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors",
                          selected
                            ? "border-cyan-400/40 bg-cyan-400/[0.06]"
                            : "border-white/10 bg-white/[0.02] hover:border-white/25",
                        )}
                      >
                        <input
                          ref={(el) => {
                            alternativeRefs.current[index] = el;
                          }}
                          type="radio"
                          name={`alternative-${baseId}`}
                          value={alt.id}
                          checked={selected}
                          tabIndex={selected ? 0 : -1}
                          onChange={() => {
                            setSelectedAltId(alt.id);
                            setErrorMessage("");
                            announce(`Selected ${alt.title}.`);
                          }}
                          onKeyDown={(event) =>
                            handleAlternativeKeyDown(event, index)
                          }
                          className="mt-1 h-4 w-4 accent-cyan-400"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-white">
                            <span className="truncate">{alt.title}</span>
                            <StatusChip tone={toneForStatus(alt.status)}>
                              {alt.status}
                            </StatusChip>
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-400">
                            {alt.dateLabel} · {alt.timeRange}
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span className="font-mono tabular-nums text-cyan-200">
                              {alt.rate}
                            </span>
                            {alt.priceXlm !== undefined ? (
                              <span className="font-mono tabular-nums text-slate-300">
                                {formatAmount(alt.priceXlm, currency)}
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <Info className="h-3.5 w-3.5" aria-hidden="true" />
                              {matchLabel(alt.timeRange, tokenTimeRange)}
                            </span>
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {errorMessage ? (
              <div
                id={errorId}
                role="alert"
                className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-100"
              >
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Keep my time-token
              </button>
              <button
                type="button"
                onClick={goToConfirm}
                disabled={
                  !choice ||
                  (choice === "rebook" && hasAlternatives && !selectedAltId)
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/15 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/60 hover:bg-cyan-400/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && choice ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                You chose
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {CHOICE_HELP[choice].title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {CHOICE_HELP[choice].description}
              </p>
              {choice === "rebook" && selectedAltId ? (
                <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] p-3 text-sm">
                  <p className="font-medium text-white">
                    {ranked.find((alt) => alt.id === selectedAltId)?.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {
                      ranked.find((alt) => alt.id === selectedAltId)
                        ?.timeRange
                    }
                  </p>
                </div>
              ) : null}
              {errorMessage ? (
                <div
                  id={errorId}
                  role="alert"
                  className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-100"
                >
                  {errorMessage}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep("choice")}
                disabled={submitting}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/15 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/60 hover:bg-cyan-400/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    Submitting…
                  </>
                ) : errorMessage ? (
                  <>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Try again
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {actionLabel}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {step === "done" && choice ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  {CHOICE_HELP[choice].title} confirmed
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  {choice === "rebook"
                    ? `Your time-token is being moved to ${
                        ranked.find((alt) => alt.id === selectedAltId)?.title
                      }. You'll see the updated slot on your dashboard.`
                    : choice === "credit"
                      ? `The value of "${tokenTitle}" has been converted to spendable account credit.`
                      : `A refund for "${tokenTitle}" is being processed to your original payment method.`}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}

        {/* Live region for assistive-tech announcements */}
        <div
          id={statusId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>
      </div>
    </div>
  );
}

function toneForStatus(status: string) {
  const s = status.toLowerCase();
  if (s === "healthy" || s === "available") return "positive";
  if (s === "tight") return "warning";
  return "neutral";
}

/**
 * Focus lifecycle helper: on open, captures the currently focused element and
 * moves focus to the dialog panel; on close, restores focus to that element.
 * Only touches the DOM — never writes React state — so it is effect-safe.
 */
function useFocusLifecycle(
  open: boolean,
  panelRef: RefObject<HTMLDivElement | null>,
  restoreRef: MutableRefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (open) {
      restoreRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      panelRef.current?.focus();
      return;
    }
    const previous = restoreRef.current;
    restoreRef.current = null;
    previous?.focus();
  }, [open, panelRef, restoreRef]);
}