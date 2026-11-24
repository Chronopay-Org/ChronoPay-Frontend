"use client";

import { Wallet } from "lucide-react";
import {
  CURRENCIES,
  truncateAddress,
  type PayoutCurrency,
  type PayoutDestinationType,
  type PayoutPreview,
} from "./types";

export interface PayoutSummaryProps {
  preview: PayoutPreview | null;
  destinationType: PayoutDestinationType;
  customAddress: string;
  memo: string;
  currency: PayoutCurrency;
}

export function PayoutSummary({
  preview,
  destinationType,
  customAddress,
  memo,
  currency,
}: PayoutSummaryProps) {
  const currencyMeta = CURRENCIES.find((c) => c.value === currency);

  if (destinationType === "connected_wallet") {
    if (!preview) return null;
    return (
      <div
        className="rounded-2xl border border-cyan-300/20 bg-cyan-950/20 p-4"
        aria-label="Payout destination preview"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-300">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Payout destination
            </p>
            <p className="text-sm font-medium text-white">
              {preview.walletLabel}
            </p>
            <p className="font-mono text-xs text-slate-400">
              {truncateAddress(preview.walletAddress)}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                Connected
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                {preview.network}
              </span>
              {currencyMeta && (
                <span className="inline-flex items-center rounded-full bg-cyan-900/30 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                  {currencyMeta.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const trimmedAddress = customAddress.trim();
  const trimmedMemo = memo.trim();

  return (
    <div
      className="rounded-2xl border border-cyan-300/20 bg-cyan-950/20 p-4"
      aria-label="Payout destination preview"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-300">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Payout destination
          </p>
          <p className="text-sm font-medium text-white">
            Custom Stellar address
          </p>
          <p className="font-mono text-xs text-slate-400">
            {trimmedAddress ? truncateAddress(trimmedAddress) : "No address entered yet"}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              Stellar
            </span>
            {currencyMeta && (
              <span className="inline-flex items-center rounded-full bg-cyan-900/30 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                {currencyMeta.label}
              </span>
            )}
            {trimmedMemo && (
              <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                Memo: {trimmedMemo}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
