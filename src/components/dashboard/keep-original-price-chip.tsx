"use client";

/**
 * KeepOriginalPriceChip
 *
 * Nudge chip shown on a rebooking alternative slot card when the alternative
 * price differs from the original booking price. Offers the buyer a one-click
 * option to apply an account credit to honour the original price.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Interactive chip is a <button> with descriptive aria-label
 *   - Tooltip (HelpPopover) explains the credit mechanic via role=dialog
 *   - State changes (applied, insufficient credit) announced via aria-live
 *   - Keyboard: Enter / Space to apply credit; follows project focus-ring-cyan pattern
 *   - Disabled state uses aria-disabled + pointer-events-none
 */

import { useState, useCallback, useId } from "react";
import clsx from "clsx";
import { Tag } from "lucide-react";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";

// ─── Types ────────────────────────────────────────────────────────────────────

export type KeepOriginalPriceState =
  | "idle"          // Default: offer available
  | "applied"       // Credit has been applied
  | "insufficient"; // Not enough credit to cover the difference

export type KeepOriginalPriceChipProps = {
  /**
   * Original booking price in XLM (e.g. 120).
   * Must be a positive number.
   */
  originalPrice: number;
  /**
   * Alternative slot price in XLM (e.g. 150).
   * Must be a positive number.
   */
  alternativePrice: number;
  /**
   * Available account credit in XLM.
   * Required to compute the insufficient state.
   */
  availableCredit: number;
  /**
   * Currency symbol / unit label (default: "XLM").
   */
  currency?: string;
  /**
   * Called when the buyer clicks to apply credit.
   * Receives the price difference that will be covered.
   */
  onApplyCredit?: (priceDiff: number) => void;
  /**
   * Externally-controlled applied state. When provided the chip becomes
   * controlled; when omitted state is managed internally.
   */
  applied?: boolean;
  /**
   * Additional class names applied to the outer wrapper.
   */
  className?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round XLM amounts to at most 2 decimal places, trimming trailing zeros. */
function formatXlm(amount: number, currency: string): string {
  const str = amount.toFixed(2).replace(/\.?0+$/, "");
  return `${str} ${currency}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * KeepOriginalPriceChip
 *
 * @example
 * // Idle — offer available
 * <KeepOriginalPriceChip
 *   originalPrice={120}
 *   alternativePrice={150}
 *   availableCredit={50}
 *   onApplyCredit={(diff) => console.log("Applying", diff)}
 * />
 *
 * @example
 * // Insufficient credit
 * <KeepOriginalPriceChip
 *   originalPrice={120}
 *   alternativePrice={200}
 *   availableCredit={10}
 * />
 */
export function KeepOriginalPriceChip({
  originalPrice,
  alternativePrice,
  availableCredit,
  currency = "XLM",
  onApplyCredit,
  applied: controlledApplied,
  className = "",
}: KeepOriginalPriceChipProps) {
  // ── Hooks must come before any early returns (React rules-of-hooks) ────────
  const baseId = useId();
  const statusId = `${baseId}-status`;
  const [internalApplied, setInternalApplied] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const announce = useCallback((message: string) => {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(message), 0);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const priceDiff = alternativePrice - originalPrice;

  // Don't render if prices are equal or alternative is cheaper
  if (priceDiff <= 0) return null;

  const hasEnoughCredit = availableCredit >= priceDiff;
  const isControlled = controlledApplied !== undefined;
  const isApplied = isControlled ? controlledApplied : internalApplied;

  // Effective state for styling / aria
  const state: KeepOriginalPriceState = isApplied
    ? "applied"
    : hasEnoughCredit
      ? "idle"
      : "insufficient";

  const handleApply = () => {
    if (state !== "idle") return;

    if (!isControlled) {
      setInternalApplied(true);
    }

    onApplyCredit?.(priceDiff);
    announce(
      `Credit applied. You'll pay ${formatXlm(originalPrice, currency)} — the original price. ${formatXlm(priceDiff, currency)} covered by your credit.`,
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isDisabled = state !== "idle";

  // Chip label changes with state
  const chipLabel =
    state === "applied"
      ? `Original price locked: ${formatXlm(originalPrice, currency)}`
      : state === "insufficient"
        ? `Insufficient credit (need ${formatXlm(priceDiff, currency)} more)`
        : `Keep original price: ${formatXlm(originalPrice, currency)}`;

  // Visible text
  const chipText =
    state === "applied"
      ? `Price locked at ${formatXlm(originalPrice, currency)}`
      : state === "insufficient"
        ? "Insufficient credit"
        : `Keep original price · ${formatXlm(originalPrice, currency)}`;

  return (
    <div className={clsx("inline-flex items-center gap-1.5", className)}>
      <button
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label={chipLabel}
        aria-describedby={statusId}
        onClick={handleApply}
        className={clsx(
          // Base layout
          "inline-flex min-h-[2.25rem] items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium",
          // Transition (respects prefers-reduced-motion via Tailwind)
          "transition-colors motion-reduce:transition-none",
          // Focus ring — project-wide cyan pattern
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",

          // State-specific styles
          state === "applied" && [
            "cursor-default border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
          ],
          state === "insufficient" && [
            "cursor-not-allowed border-amber-400/30 bg-amber-400/10 text-amber-200 opacity-70",
          ],
          state === "idle" && [
            "cursor-pointer border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
            "hover:border-cyan-300/50 hover:bg-cyan-300/15",
            "active:border-cyan-300/60 active:bg-cyan-300/20",
          ],
        )}
      >
        {/* Icon */}
        <Tag
          className={clsx(
            "h-3.5 w-3.5 shrink-0",
            state === "applied" && "text-emerald-300",
            state === "insufficient" && "text-amber-300",
            state === "idle" && "text-cyan-300",
          )}
          aria-hidden="true"
        />

        {/* Label text */}
        <span>{chipText}</span>

        {/* Price difference badge — only shown in idle/insufficient states */}
        {state !== "applied" && (
          <span
            className={clsx(
              "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
              state === "insufficient"
                ? "bg-amber-400/15 text-amber-200"
                : "bg-cyan-300/15 text-cyan-200",
            )}
            aria-hidden="true"
          >
            +{formatXlm(priceDiff, currency)}
          </span>
        )}
      </button>

      {/* Help popover — explains the credit mechanic */}
      <HelpPopover
        term={glossary.pricePreservationCredit}
        triggerLabel="Help: keep original price with credit"
      />

      {/* Live region for screen reader announcements */}
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
  );
}
