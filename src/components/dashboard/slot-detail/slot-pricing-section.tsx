"use client";

import type { ReactNode } from "react";
import { OrderSummaryDrawer } from "@/components/dashboard/order-summary-drawer";
import { PromoCodeEntry } from "@/app/components/ui/promo-code-entry";
import { GiftPurchaseToggle, type GiftDetails } from "@/components/dashboard/gift-purchase-toggle";
import { AlertCircle, Info, ShieldCheck, Wallet } from "lucide-react";
import type { WalletStatus } from "./use-slot-booking";

export interface SlotPricingSectionProps {
  rate: string;
  durationHours: number;
  subtotal: number;
  escrowFee: number;
  stellarFee: number;
  totalCost: number;
  discountPercent: number;
  discountedTotal: number;
  effectiveTotalCost: number;
  simWallet: WalletStatus;
  isWalletReady: boolean;
  hasFunds: boolean;
  availableFunds: number;
  displayAddress: string;
  onGiftChange: (details: GiftDetails | null) => void;
  onDiscountApplied: (payload: {
    code: string;
    percent: number;
    discountedTotal: number;
  }) => void;
  actions: ReactNode;
}

export function SlotPricingSection({
  rate,
  durationHours,
  subtotal,
  escrowFee,
  stellarFee,
  totalCost,
  discountPercent,
  discountedTotal,
  effectiveTotalCost,
  simWallet,
  isWalletReady,
  hasFunds,
  availableFunds,
  displayAddress,
  onGiftChange,
  onDiscountApplied,
  actions,
}: SlotPricingSectionProps) {
  return (
    <aside className="lg:col-span-1 space-y-6">
      <OrderSummaryDrawer
        title="Purchase details"
        description="Review pricing, wallet readiness, and confirm the booking before you lock funds."
      >
        <section
          className="glass-panel rounded-[2rem] p-6 border border-white/10 bg-slate-950/20 space-y-6"
          aria-labelledby="pricing-summary-title"
        >
          <h2
            id="pricing-summary-title"
            className="text-sm font-bold uppercase tracking-wider text-slate-300"
          >
            Purchase Details
          </h2>

          {/* Stellar Wallet Integration State Banners */}
          <div className="space-y-3">
            {simWallet === "disconnected" && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-semibold">Stellar Wallet Disconnected</p>
                  <p className="helper-text helper-text--muted mt-1">
                    Please connect your Stellar active wallet to continue.
                  </p>
                </div>
              </div>
            )}

            {simWallet === "error" && (
              <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3.5 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-semibold">Wallet Sync Interrupted</p>
                  <p className="helper-text helper-text--muted mt-1">
                    Network timeout while validating Stellar account trustline.
                  </p>
                </div>
              </div>
            )}

            {isWalletReady && !hasFunds && (
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-semibold">Insufficient Balance</p>
                  <p className="helper-text helper-text--muted mt-1">
                    Your balance ({availableFunds} XLM) is lower than the total cost (
                    {effectiveTotalCost.toFixed(4)} XLM).
                  </p>
                </div>
              </div>
            )}

            {isWalletReady && hasFunds && (
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3.5 text-xs text-cyan-100 flex items-start gap-2.5">
                <Wallet className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">Connected Wallet</p>
                  <p className="helper-text mt-0.5 text-slate-400 truncate">
                    {displayAddress}
                  </p>
                  <p className="helper-text mt-1 text-cyan-300 font-medium">
                    Balance: {availableFunds} XLM
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
              Cost Breakdown
            </h3>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-300">Rate per Hour</dt>
                <dd className="font-semibold text-white">{rate}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-slate-300">Total Hours</dt>
                <dd className="font-semibold text-white">{durationHours} hrs</dd>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-3">
                <dt className="text-slate-300">Token Subtotal</dt>
                <dd className="font-semibold text-white">{subtotal.toFixed(2)} XLM</dd>
              </div>

              {/* Escrow Fee */}
              <div className="flex items-center justify-between gap-1">
                <dt className="text-slate-300 flex items-center gap-1.5">
                  Smart Escrow Fee
                  <span className="group relative">
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-white" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-900 border border-white/10 p-2 text-[10px] text-slate-200 opacity-0 group-hover:opacity-100 transition shadow-xl z-10">
                      1.5% fee held securely in Stellar contract during booking.
                    </span>
                  </span>
                </dt>
                <dd className="font-semibold text-white">{escrowFee.toFixed(4)} XLM</dd>
              </div>

              {/* Network Fee */}
              <div className="flex items-center justify-between gap-1 border-b border-white/5 pb-3">
                <dt className="text-slate-300 flex items-center gap-1.5">
                  Stellar Network Fee
                  <span className="group relative">
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-white" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-900 border border-white/10 p-2 text-[10px] text-slate-200 opacity-0 group-hover:opacity-100 transition shadow-xl z-10">
                      Gas fees paid directly to Stellar validators for ledger commitment.
                    </span>
                  </span>
                </dt>
                <dd className="font-semibold text-white">{stellarFee.toFixed(4)} XLM</dd>
              </div>

              {/* Total Cost */}
              <div className="space-y-2 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3 text-sm">
                {discountPercent > 0 ? (
                  <div className="flex justify-between text-cyan-100">
                    <dt>Discounted total</dt>
                    <dd className="font-semibold">{discountedTotal.toFixed(4)} XLM</dd>
                  </div>
                ) : (
                  <div className="flex justify-between text-cyan-100">
                    <dt>Base total</dt>
                    <dd className="font-semibold">{totalCost.toFixed(4)} XLM</dd>
                  </div>
                )}
                {discountPercent > 0 && (
                  <div className="flex justify-between text-xs text-cyan-200/80">
                    <dt>{discountPercent}% promo applied</dt>
                    <dd>{(totalCost - discountedTotal).toFixed(4)} XLM saved</dd>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-base font-bold text-white pt-1">
                <dt className="text-cyan-300">Total Purchase Cost</dt>
                <dd className="text-cyan-300 font-extrabold">
                  {effectiveTotalCost.toFixed(4)} XLM
                </dd>
              </div>
            </dl>
          </div>

          <GiftPurchaseToggle onChange={onGiftChange} />

          <PromoCodeEntry
            baseTotal={totalCost}
            onDiscountApplied={onDiscountApplied}
          />

          {/* Escrow Guarantee Statement */}
          <div className="rounded-xl bg-white/4 border border-white/8 p-3.5 text-[11px] text-slate-300 flex gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Funds are secured in a Stellar Smart Escrow lockbox. Funds are only released
              after successful slot completion. Cancel safely up to 24 hours prior.
            </p>
          </div>

          {actions}
        </section>
      </OrderSummaryDrawer>
    </aside>
  );
}
