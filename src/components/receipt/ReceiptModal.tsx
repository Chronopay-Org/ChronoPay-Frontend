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
import { Printer, Share2, X, Check, Calendar, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { FocusTrap } from "@/components/common/FocusTrap";
import { LiveRegion } from "@/components/common/LiveRegion";
import { Receipt } from "./Receipt";
import { buildShareLink } from "./masking";
import type { ReceiptData } from "./types";
import confetti from "canvas-confetti";

type ReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  receipt?: ReceiptData | null;
  loading?: boolean;
  error?: string | null;
};

const generateICS = (receipt: ReceiptData | null | undefined) => {
  if (!receipt) return "";
  // Create a naive start time (current date/time for demo purposes)
  // since the receipt only has a pre-formatted settledAt string.
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ChronoPay//EN
BEGIN:VEVENT
UID:${receipt.id}@chronopay.app
DTSTAMP:${now}
DTSTART:${now}
DTEND:${now}
SUMMARY:${receipt.title}
DESCRIPTION:Booking ID: ${receipt.id}\\nTx Hash: ${receipt.txHash}
END:VEVENT
END:VCALENDAR`;
  return icsContent;
};

export function ReceiptModal({
  isOpen,
  onClose,
  receipt,
  loading = false,
  error = null,
}: ReceiptModalProps) {
  const titleId = useId();
  const tipInputId = useId();
  const tipCustomNoteId = useId();
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [selectedTipAmount, setSelectedTipAmount] = useState<number | null>(
    null,
  );
  const [customTipValue, setCustomTipValue] = useState("");
  const [tipPromptCompleted, setTipPromptCompleted] = useState(false);
  const [tipMessage, setTipMessage] = useState("");

  const tipPresets = [1, 2.5, 5] as const;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Stop the Escape from also reaching the booking modal's window-level
      // listener; otherwise a single press would close both stacked dialogs.
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Reset tip state when dialog opens. This is a state initialisation
  // pattern triggered by props, not cascading renders.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!isOpen) return;
    setSelectedTipAmount(null);
    setCustomTipValue("");
    setTipPromptCompleted(false);
    setTipMessage("");
  }, [isOpen]);

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
      setLiveMessage("Masked share link copied to clipboard.");
      window.setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      setShareStatus("idle");
    }
  };

  const handlePresetTip = (amount: number) => {
    setSelectedTipAmount(amount);
    setCustomTipValue("");
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTipValue(value);
    const parsed = parseFloat(value);
    setSelectedTipAmount(Number.isFinite(parsed) ? parsed : null);
  };

  const handleSkipTip = () => {
    setSelectedTipAmount(0);
    setTipPromptCompleted(true);
    setTipMessage("Tip skipped. The receipt is ready.");
  };

  const handleConfirmTip = () => {
    if (selectedTipAmount === null) return;
    setTipPromptCompleted(true);
    const message =
      selectedTipAmount > 0
        ? `Added ${selectedTipAmount.toFixed(2)} XLM tip.`
        : "No tip added. The receipt is ready.";
    setTipMessage(message);
  };

  const tipAmount = tipPromptCompleted ? (selectedTipAmount ?? 0) : 0;

  const enhancedReceipt = receipt
    ? {
        ...receipt,
        lineItems:
          tipPromptCompleted && tipAmount > 0
            ? [
                ...receipt.lineItems,
                {
                  label: "Supplier tip",
                  value: `${tipAmount.toFixed(4)} XLM`,
                  note: "Directly supports seller availability and fast response.",
                },
              ]
            : receipt.lineItems,
        total:
          tipPromptCompleted && tipAmount > 0
            ? `${(parseFloat(receipt.total) + tipAmount).toFixed(4)} XLM`
            : receipt.total,
        net:
          tipPromptCompleted && tipAmount > 0
            ? `${(parseFloat(receipt.net) + tipAmount).toFixed(4)} XLM`
            : receipt.net,
      }
    : receipt;

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
          className="receipt-dialog elevation-4 relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/12 bg-slate-900 p-4 sm:p-6"
        >
          <div className="receipt-no-print mb-4 flex items-center justify-between gap-3">
            <h2
              id={titleId}
              className="text-sm font-bold uppercase tracking-wider text-slate-300"
            >
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
                  <Check
                    className="h-3.5 w-3.5 text-emerald-300"
                    aria-hidden="true"
                  />
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
                <Printer className="h-3.5 w-3.5" aria-hidden={true} />
                Print / Save PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close receipt"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <X className="h-4 w-4" aria-hidden={true} />
              </button>
            </div>
          </div>

          {!tipPromptCompleted && receipt && (
            <section className="receipt-no-print mb-6 rounded-3xl border border-white/10 bg-slate-950/80 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                    Optional tip for the supplier
                  </p>
                  <h3 className="text-base font-semibold text-white">
                    Support faster availability and lower platform fees.
                  </h3>
                  <p className="text-sm leading-6 text-slate-400 max-w-2xl">
                    Tips go directly to the seller for reliable booking service.
                    You can skip this step without affecting your receipt.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSkipTip}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-300/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  No thanks, continue
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
                {tipPresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePresetTip(amount)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                      selectedTipAmount === amount
                        ? "border-cyan-300 bg-cyan-300/15 text-white"
                        : "border-white/10 bg-slate-900 text-slate-200 hover:border-cyan-300/30 hover:bg-white/5"
                    }`}
                    aria-pressed={selectedTipAmount === amount}
                  >
                    {amount.toFixed(2)} XLM
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label htmlFor={tipInputId} className="sr-only">
                  Custom tip amount in XLM
                </label>
                <div className="relative rounded-2xl border border-white/10 bg-slate-950/90 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Custom tip
                      </p>
                      <p
                        id={tipCustomNoteId}
                        className="helper-text helper-text--muted mt-1"
                      >
                        Enter any amount to support the seller directly.
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      XLM
                    </span>
                  </div>
                  <input
                    id={tipInputId}
                    aria-describedby={tipCustomNoteId}
                    value={customTipValue}
                    onChange={(event) =>
                      handleCustomTipChange(event.target.value)
                    }
                    inputMode="decimal"
                    pattern="^\d*(\.\d{0,4})?$"
                    placeholder="0.00"
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-lg font-semibold text-white outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirmTip}
                  disabled={selectedTipAmount === null}
                  className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirm tip
                </button>
              </div>
            </section>
          )}

          {tipPromptCompleted && tipMessage && (
            <div className="receipt-no-print mb-6 rounded-3xl border border-cyan-300/20 bg-cyan-950/20 p-4 text-sm text-cyan-100">
              {tipMessage}
            </div>
          )}

          <Receipt receipt={enhancedReceipt} loading={loading} error={error} />

          <LiveRegion>
            {shareStatus === "copied"
              ? "Masked share link copied to clipboard."
              : ""}
          </LiveRegion>
        </div>
      </FocusTrap>
    </div>
  );
}
