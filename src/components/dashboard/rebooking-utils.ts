"use client";

import type { Slot } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The three ways a cancelled / rescheduled time-token can be made whole:
 *  - rebook   → swap back to a matching slot with the same supplier
 *  - credit   → keep the paid value as spendable account credit
 *  - refund   → return the funds to the original payment method
 */
export type RebookingChoice = "rebook" | "credit" | "refund";

/**
 * A suggested alternative slot offered during a rebooking flow. Extends the
 * base Slot with an optional numeric price so the price-preservation credit
 * chip can compute the difference against the original booking.
 */
export type AlternativeSlot = Slot & {
  /** Numeric price in XLM for this alternative slot. */
  priceXlm?: number;
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const TIME_RANGE_PATTERN = /^(\d{1,2}):(\d{2})/;

/**
 * Returns the start time in minutes since midnight for a "HH:MM" time-range
 * string, or `null` when the range does not start with a parseable time.
 * Handles both "10:00-11:30" and "14:00 - 15:00 UTC" shapes.
 */
export function startTimeMinutes(timeRange: string): number | null {
  const match = TIME_RANGE_PATTERN.exec(timeRange.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Absolve difference (in minutes) between two time-range start times.
 * Returns `Number.MAX_SAFE_INTEGER` when either value cannot be parsed so the
 * unparseable entry always sorts last.
 */
export function closestMatchDelta(
  timeRange: string,
  originalTimeRange: string,
): number {
  const candidate = startTimeMinutes(timeRange);
  const original = startTimeMinutes(originalTimeRange);
  if (candidate === null || original === null) return Number.MAX_SAFE_INTEGER;
  return Math.abs(candidate - original);
}

/**
 * Ranks alternative slots by how close their start time is to the original
 * booking window (nearest first). Ties resolve to the earliest start hour.
 * The input array is never mutated.
 */
export function sortedNearest(
  alternatives: AlternativeSlot[],
  originalTimeRange?: string,
): AlternativeSlot[] {
  return [...alternatives].sort((a, b) => {
    const deltaA = originalTimeRange
      ? closestMatchDelta(a.timeRange, originalTimeRange)
      : Number.MAX_SAFE_INTEGER;
    const deltaB = originalTimeRange
      ? closestMatchDelta(b.timeRange, originalTimeRange)
      : Number.MAX_SAFE_INTEGER;
    if (deltaA !== deltaB) return deltaA - deltaB;

    const startA = startTimeMinutes(a.timeRange);
    const startB = startTimeMinutes(b.timeRange);
    const rankA = startA ?? Number.MAX_SAFE_INTEGER;
    const rankB = startB ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return 0;
  });
}

/**
 * Human-readable description of how close an alternative's start time is to
 * the original booking start time. Used on each alternative card to make the
 * "same supplier, same feel" nature of a rebook explicit.
 */
export function matchLabel(
  timeRange: string,
  originalTimeRange: string,
): string {
  const delta = closestMatchDelta(timeRange, originalTimeRange);
  if (delta === Number.MAX_SAFE_INTEGER) return "Nearest available time";
  if (delta === 0) return "Same start time as your original booking";
  const hours = Math.floor(delta / 60);
  const minutes = delta % 60;
  if (hours === 0) return `Starts ${minutes} min from your original time`;
  if (minutes === 0) {
    return `Starts ${hours} hour${hours > 1 ? "s" : ""} from your original time`;
  }
  return `Starts ${hours}h ${minutes}m from your original time`;
}

/**
 * Voice guidance text distinguishing a rebook from a credit so buyers never
 * confuse "keep the slot" with "keep the money".
 */
export const CHOICE_HELP: Record<
  RebookingChoice,
  { title: string; description: string }
> = {
  rebook: {
    title: "Rebook with the same supplier",
    description:
      "Replaces this time-token with a booked slot at a new time with the same supplier. The original price, guarantees, and confirmations carry over.",
  },
  credit: {
    title: "Convert to account credit",
    description:
      "Turns the paid value into spendable account credit on any future booking. No deadline, no supplier lock-in, and the value never expires.",
  },
  refund: {
    title: "Request a refund",
    description:
      "Returns the funds to your original payment method. The time-token is cancelled; refunds typically clear within 3–5 business days.",
  },
};