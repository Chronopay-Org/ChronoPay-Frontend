"use client";

/**
 * RefundConversionNote
 *
 * A subtle, accessible inline note displayed beneath the refund amount
 * whenever a refund crosses currency boundaries (e.g. XLM → USD).
 *
 * Features
 * ─────────
 * • Shows the pegged rate, source, and timestamp at a glance.
 * • Tooltip (using project Tooltip component) reveals full rate-source detail
 *   and exact fetch time; keyboard-accessible (Enter/Space toggle, Escape close).
 * • Copy-to-clipboard for the referenceId via the project CopyButton.
 * • Stale-rate warning (auto-derived when `fetchedAt` is >10 min old, or forced
 *   via `isStale` prop) — WCAG 2.1 AA colour contrast maintained.
 * • RTL-safe: uses logical CSS properties (start/end) via Tailwind's `ltr:`/`rtl:` variants.
 * • Dark-mode: palette uses the existing slate/cyan token scale.
 * • Print: hidden via `.receipt-no-print` to keep the printed receipt clean.
 * • All decorative icons carry `aria-hidden`; the live region announces copy success.
 *
 * Accessibility
 * ─────────────
 * • `role="note"` + `aria-label` gives screen readers a descriptive landmark.
 * • Stale warning uses `role="alert"` so it is announced immediately.
 * • Rate value is in a `<data>` element with a machine-readable `value` attribute.
 *
 * Usage
 * ─────
 * <RefundConversionNote conversion={receipt.refundConversion} />
 */

import { AlertTriangle, Clock, Info } from "lucide-react";
import { Tooltip } from "@/app/components/ui/tooltip";
import { CopyButton } from "@/app/components/ui/copy-button";
import type { RefundConversionRate } from "./types";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Rates older than this (ms) are considered stale. */
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Returns true when the rate is stale, either explicitly via the `isStale`
 * flag or implicitly because `fetchedAt` is older than STALE_THRESHOLD_MS.
 */
export function isRateStale(conversion: RefundConversionRate): boolean {
  if (conversion.isStale === true) return true;
  if (conversion.isStale === false) return false;
  try {
    const age = Date.now() - new Date(conversion.fetchedAt).getTime();
    return age > STALE_THRESHOLD_MS;
  } catch {
    return false;
  }
}

/**
 * Formats an ISO-8601 timestamp into a human-readable string.
 * Falls back to the raw string if parsing fails.
 */
export function formatFetchedAt(fetchedAt: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(fetchedAt)) + " UTC";
  } catch {
    return fetchedAt;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StaleWarning({ fetchedAt }: { fetchedAt: string }) {
  return (
    <span
      role="alert"
      className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-400/20"
      aria-label={`Rate may be outdated. Last fetched ${formatFetchedAt(fetchedAt)}`}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden={true} />
      Rate may be outdated
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export interface RefundConversionNoteProps {
  /** Conversion metadata. When undefined/null the component renders nothing. */
  conversion?: RefundConversionRate | null;
  /** Extra Tailwind classes applied to the outer wrapper. */
  className?: string;
}

export function RefundConversionNote({
  conversion,
  className = "",
}: RefundConversionNoteProps) {
  // Render nothing when there is no cross-currency conversion.
  if (!conversion) return null;

  const stale = isRateStale(conversion);
  const formattedFetchedAt = formatFetchedAt(conversion.fetchedAt);

  const tooltipContent = (
    <div className="space-y-1.5 text-sm">
      <p className="font-semibold text-white">Rate details</p>
      <p className="text-slate-300">
        <span className="font-medium text-slate-100">Source:</span>{" "}
        {conversion.source}
      </p>
      <p className="text-slate-300">
        <span className="font-medium text-slate-100">Rate:</span>{" "}
        1&nbsp;{conversion.fromCurrency}&nbsp;=&nbsp;{conversion.rate}&nbsp;{conversion.toCurrency}
      </p>
      <p className="flex items-center gap-1 text-slate-400">
        <Clock className="h-3 w-3 shrink-0" aria-hidden={true} />
        Fetched {formattedFetchedAt}
      </p>
      {stale && (
        <p className="text-amber-300 text-xs">
          This rate is more than 10&nbsp;minutes old. Actual settlement may differ slightly.
        </p>
      )}
    </div>
  );

  return (
    <div
      role="note"
      aria-label={`Refund currency conversion: 1 ${conversion.fromCurrency} = ${conversion.rate} ${conversion.toCurrency}`}
      className={[
        "receipt-no-print",
        "mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5",
        "rounded-lg border border-cyan-400/15 bg-cyan-400/5 px-3 py-2",
        "text-xs text-slate-300",
        // RTL support: text direction follows document but layout flips
        "ltr:text-left rtl:text-right",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid="refund-conversion-note"
    >
      {/* Rate label */}
      <span className="flex items-center gap-1.5 font-medium text-slate-200">
        <Info className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden={true} />
        Refund rate:
      </span>

      {/* Rate value — machine-readable <data> element */}
      <data
        value={`1 ${conversion.fromCurrency} = ${conversion.rate} ${conversion.toCurrency}`}
        className="font-mono font-semibold text-cyan-300 tabular-nums"
      >
        1&nbsp;{conversion.fromCurrency}&nbsp;=&nbsp;
        <span className="text-white">{conversion.rate}</span>
        &nbsp;{conversion.toCurrency}
      </data>

      {/* Tooltip — rate source detail */}
      <Tooltip
        content={tooltipContent}
        ariaLabel="Rate source details"
        className="inline-flex"
      />

      {/* Stale warning badge */}
      {stale && <StaleWarning fetchedAt={conversion.fetchedAt} />}

      {/* Copy reference ID */}
      {conversion.referenceId && (
        <span className="flex items-center gap-1 ms-auto text-slate-400">
          <span>Ref:</span>
          <span className="font-mono text-slate-300" aria-label={`Reference ID: ${conversion.referenceId}`}>
            {conversion.referenceId.length > 12
              ? `${conversion.referenceId.slice(0, 6)}…${conversion.referenceId.slice(-4)}`
              : conversion.referenceId}
          </span>
          <CopyButton
            text={conversion.referenceId}
            variant="icon"
            label={`Copy reference ID ${conversion.referenceId}`}
            className="h-5 w-5"
          />
        </span>
      )}
    </div>
  );
}
