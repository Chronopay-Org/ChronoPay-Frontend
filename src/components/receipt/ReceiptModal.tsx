"use client";

/**
 * ReceiptModal — accessible dialog that presents the on-chain Receipt with
 * export (print to PDF) and share (copy masked link) affordances.
 *
 * Print uses window.print() plus the @media print block scoped to
 * .receipt-printable in globals.css (no PDF dependency added). The share link
 * masks sensitive fields (truncated tx hash, masked counterparty names).
 */

import { useEffect, useId, useState } from "react";
import { Printer, Share2, X, Check } from "lucide-react";
import { FocusTrap } from "@/components/common/FocusTrap";
import { LiveRegion } from "@/components/common/LiveRegion";
import { Receipt } from "./Receipt";
import { buildShareLink } from "./masking";
import type { ReceiptData } from "./types";

type ReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  receipt?: ReceiptData | null;
  loading?: boolean;
  error?: string | null;
};

export function ReceiptModal({
  isOpen,
  onClose,
  receipt,
  loading = false,
  error = null,
}: ReceiptModalProps) {
  const titleId = useId();
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!receipt) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = buildShareLink(receipt, origin);
    try {
      await navigator.clipboard.writeText(link);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      setShareStatus("idle");
    }
  };

  const canShare = Boolean(receipt) && !loading && !error;

  return (
    <div
      className="receipt-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="receipt-dialog relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/12 bg-slate-900 p-4 shadow-2xl sm:p-6"
        >
          <div className="receipt-no-print mb-4 flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Transaction Receipt
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                disabled={!canShare}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-300/30 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {shareStatus === "copied" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {shareStatus === "copied" ? "Link copied" : "Copy share link"}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!canShare}
                className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close receipt"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <Receipt receipt={receipt} loading={loading} error={error} />

          <LiveRegion>
            {shareStatus === "copied" ? "Masked share link copied to clipboard." : ""}
          </LiveRegion>
        </div>
      </FocusTrap>
    </div>
  );
}
