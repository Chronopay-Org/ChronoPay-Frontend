"use client";

import { useEffect, useId } from "react";
import { Wallet, Clock, Zap, X, Check } from "lucide-react";
import { FocusTrap } from "@/components/common/FocusTrap";
import { LiveRegion } from "@/components/common/LiveRegion";
import { REFUND_ICON_MAP } from "./refund-destination-selector";
import type { RefundDestinationOption } from "./types";

export type RefundConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  destination: RefundDestinationOption;
};

/**
 * RefundConfirmationModal — accessible confirmation dialog for refund
 * destination selection. Shows a summary of the selected destination
 * with tradeoff details (ETA, fees) before final confirmation.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - role="dialog" with aria-modal="true"
 *   - FocusTrap for keyboard navigation
 *   - Escape to dismiss
 *   - LiveRegion for screen reader announcements
 */
export function RefundConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  destination,
}: RefundConfirmationModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="elevation-4 relative w-full max-w-md overflow-y-auto rounded-3xl border border-white/12 bg-slate-900 p-6"
        >
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-3">
            <h2
              id={titleId}
              className="text-lg font-semibold text-white"
            >
              Confirm refund destination
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close confirmation"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Selected destination summary card */}
          <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-300">
                {REFUND_ICON_MAP[destination.icon] ?? (
                  <Wallet className="h-6 w-6" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {destination.label}
                </p>
                {destination.recommended ? (
                  <span className="mt-0.5 inline-flex items-center rounded-full bg-cyan-300/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-300">
                    Recommended
                  </span>
                ) : null}
              </div>
              <span
                className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300"
                aria-hidden="true"
              >
                <Check className="h-4 w-4 text-slate-950" />
              </span>
            </div>
          </div>

          {/* Tradeoff details */}
          <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Refund details
            </h3>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-300">
                <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Estimated arrival
              </span>
              <span className="font-medium text-white">{destination.eta}</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-300">
                <Zap className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Fees
              </span>
              <span className="font-medium text-white">{destination.fee}</span>
            </div>

            <p className="text-xs leading-5 text-slate-400">
              {destination.description}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-200/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Confirm refund to {destination.label}
            </button>
          </div>
        </div>
      </FocusTrap>

      <LiveRegion>
        Confirmation dialog opened. Review your refund destination choice.
      </LiveRegion>
    </div>
  );
}
