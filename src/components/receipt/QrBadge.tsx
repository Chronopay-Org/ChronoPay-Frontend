"use client";

/**
 * QrBadge — A scannable QR verification badge for on-chain receipts.
 *
 * Renders an inline SVG QR code encoding the transaction explorer URL.
 * The badge acts as a tap-to-verify button: clicking/tapping opens the explorer in
 * a new tab. A print-friendly variant is included via the
 * `.receipt-printable` CSS class tree.
 *
 * Security & Privacy:
 *   - Offline / local generation: no external requests to third-party services.
 *   - Transaction hashes are never leaked to external QR generation endpoints.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - The badge is a semantic <button> with an accessible label.
 *   - The QR SVG has role="img" and an accessible aria-label describing its purpose.
 *   - Keyboard operable (Enter/Space).
 *   - `aria-live` region announces the navigation action.
 *   - High-contrast colour scheme; dark-mode compatible.
 */

import { useId, useState, useCallback, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { generateQrMatrix } from "@/lib/qr";

interface QrBadgeProps {
  /** The URL to encode in the QR and open on tap. */
  explorerUrl: string;
  /** Human-readable label for the transaction, used in alt text. */
  label?: string;
}

export function QrBadge({ explorerUrl, label = "transaction" }: QrBadgeProps) {
  const statusId = useId();
  const [navigating, setNavigating] = useState(false);

  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(explorerUrl, "M");
    } catch {
      return [];
    }
  }, [explorerUrl]);

  const moduleCount = matrix.length;

  const handleVerify = useCallback(() => {
    setNavigating(true);
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
    // Reset after a moment so the announcement is fresh
    window.setTimeout(() => setNavigating(false), 1000);
  }, [explorerUrl]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleVerify}
        aria-label={`Verify ${label} on the ledger explorer`}
        className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-cyan-300/30 hover:bg-cyan-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        {/* Offline inline SVG QR code */}
        {moduleCount > 0 && (
          <svg
            role="img"
            aria-label={`QR code for ${label}. Scan or tap to verify on the ledger explorer.`}
            width={120}
            height={120}
            viewBox={`0 0 ${moduleCount} ${moduleCount}`}
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="crispEdges"
            className="rounded-lg bg-white p-2"
            data-testid="receipt-qr-svg"
          >
            <rect width={moduleCount} height={moduleCount} fill="#ffffff" />
            {matrix.map((row, r) =>
              row.map((filled, c) =>
                filled ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c}
                    y={r}
                    width={1}
                    height={1}
                    fill="#0f172a"
                  />
                ) : null,
              ),
            )}
          </svg>
        )}

        {/* Hover overlay hint */}
        <span
          aria-hidden={true}
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/70 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur-sm">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden={true} />
            Verify on explorer
          </span>
        </span>
      </button>

      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        Tap to verify
      </p>

      <span
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {navigating ? `Opening explorer for ${label}.` : ""}
      </span>
    </div>
  );
}
