"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { FocusTrap } from "@/components/common/FocusTrap";
import type { GiftDetails } from "@/components/dashboard/gift-purchase-toggle";
import {
  AlertCircle,
  Check,
  ExternalLink,
  Info,
  Loader2,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ChargedSnapshot, PurchaseStep } from "./use-slot-booking";

export interface SlotCheckoutModalProps {
  isOpen: boolean;
  modalRef?: RefObject<HTMLDivElement | null>;
  purchaseStep: PurchaseStep;
  slotId: string;
  slotTitle: string;
  slotDateLabel: string;
  sellerName: string;
  giftDetails: GiftDetails | null;
  escrowFee: number;
  stellarFee: number;
  effectiveTotalCost: number;
  chargedSnapshot: ChargedSnapshot | null;
  loadingMessage: string;
  txHash: string;
  onClose: () => void;
  onProceedToConfirm: () => void;
  onProceedPurchase: () => void;
  onOpenRedeem: () => void;
  onOpenReceipt: () => void;
}

export function SlotCheckoutModal({
  isOpen,
  modalRef,
  purchaseStep,
  slotId,
  slotTitle,
  slotDateLabel,
  sellerName,
  giftDetails,
  escrowFee,
  stellarFee,
  effectiveTotalCost,
  chargedSnapshot,
  loadingMessage,
  txHash,
  onClose,
  onProceedToConfirm,
  onProceedPurchase,
  onOpenRedeem,
  onOpenReceipt,
}: SlotCheckoutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all animate-fade-in"
      role="presentation"
    >
      <FocusTrap>
        <div
          ref={modalRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
          className="w-full max-w-md rounded-3xl border border-white/12 bg-slate-900 p-6 sm:p-8 shadow-2xl relative focus:outline-none animate-scale-up"
        >
          {/* CLOSE BUTTON (Only visible in auth/confirm/success states) */}
          {purchaseStep !== "loading" && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 z-10"
              aria-label="Close modal dialog"
            >
              ✕
            </button>
          )}

          {/* STEP 0: AUTHENTICATION / PATH SELECTION */}
          {purchaseStep === "auth" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 id="modal-headline" className="text-xl font-bold text-white">
                  How would you like to continue?
                </h3>
                <p className="text-xs leading-relaxed text-slate-400 max-w-sm mx-auto">
                  Choose your checkout path to secure this booking.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Guest Card */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition-all hover:border-cyan-400/30">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-bold text-white">Guest (Wallet Only)</h4>
                  </div>
                  <ul className="space-y-2 mb-4 text-xs text-slate-300">
                    <li className="flex gap-2 items-start">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Fast checkout</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>No booking history or preferences saved</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={onProceedToConfirm}
                    className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 px-4 py-2.5 text-xs border border-white/10 text-slate-300 hover:bg-white/5"
                  >
                    Continue as Guest
                  </button>
                </div>

                {/* Sign In Card */}
                <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-4 transition-all hover:border-cyan-400/50 relative">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                      Sign In
                      <span className="group relative ml-1">
                        <Info
                          className="h-3.5 w-3.5 text-cyan-400/60 cursor-pointer hover:text-cyan-300"
                          aria-label="Why sign in?"
                        />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-900 border border-white/10 p-2 text-[10px] text-slate-200 opacity-0 group-hover:opacity-100 transition shadow-xl z-20">
                          Signing in syncs your wallet with your profile, giving you access
                          to purchase history, saved settings, and priority support.
                        </span>
                      </span>
                    </h4>
                    <span className="inline-flex rounded bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400 uppercase border border-cyan-400/20">
                      Recommended
                    </span>
                  </div>
                  <ul className="space-y-2 mb-4 text-xs text-slate-300">
                    <li className="flex gap-2 items-start">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Full booking history &amp; receipts</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Saved preferences &amp; notifications</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={onProceedToConfirm}
                    className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 px-4 py-2.5 text-xs bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/30 border border-cyan-400/30"
                  >
                    Sign In to Continue
                  </button>
                </div>

                {/* Create Account Card */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition-all hover:border-cyan-400/30">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-bold text-white">Create Account</h4>
                  </div>
                  <ul className="space-y-2 mb-4 text-xs text-slate-300">
                    <li className="flex gap-2 items-start">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Unlock all platform features</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Setup takes &lt; 1 minute</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={onProceedToConfirm}
                    className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 px-4 py-2.5 text-xs border border-white/10 text-slate-300 hover:bg-white/5"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: INITIAL CONFIRMATION DETAILS */}
          {purchaseStep === "confirm" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 id="modal-headline" className="text-xl font-bold text-white">
                  Confirm Escrow Booking
                </h3>
                <p className="text-xs leading-relaxed text-slate-400 max-w-xs mx-auto">
                  You are committing Stellar funds into smart escrow to tokenize
                  availability.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Token</span>
                  <span className="font-semibold text-white max-w-[180px] truncate text-right">
                    {slotTitle}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Scheduled Date</span>
                  <span className="font-semibold text-white">{slotDateLabel}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Seller</span>
                  <span className="font-semibold text-white">{sellerName}</span>
                </div>

                {giftDetails?.isGift && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gift for</span>
                    <span className="font-semibold text-white max-w-[180px] truncate text-right">
                      {giftDetails.recipientName ||
                        giftDetails.recipientEmail ||
                        "Recipient"}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t border-white/5 pt-3.5">
                  <span className="text-slate-400">Network + Escrow Fee</span>
                  <span className="font-semibold text-slate-200">
                    {(escrowFee + stellarFee).toFixed(4)} XLM
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold border-t border-white/5 pt-3.5">
                  <span className="text-cyan-300">Total locked</span>
                  <span className="text-cyan-300 font-extrabold">
                    {effectiveTotalCost.toFixed(4)} XLM
                  </span>
                </div>
              </div>

              {/* Confirm / Commit Action CTAs */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={onProceedPurchase}
                  className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 px-5 py-3 text-sm bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                >
                  Confirm &amp; Lock Funds
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white px-5 py-3 text-sm border border-white/10 text-slate-300 hover:bg-white/5"
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BLOCKCHAIN TX LOG LOADING STATE */}
          {purchaseStep === "loading" && (
            <div className="text-center py-6 space-y-6">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
                <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
                <span className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" />
              </div>

              <div className="space-y-2">
                <h3 id="modal-headline" className="text-lg font-bold text-white">
                  Stellar Blockchain Syncing
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto h-8 flex items-center justify-center">
                  {loadingMessage}
                </p>
              </div>

              <div className="max-w-[240px] mx-auto space-y-2" aria-hidden={true}>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-cyan-400 animate-[loading-bar_4s_ease-out_forwards]" />
                </div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  Ledger validation in progress
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: TRANSACTION SUCCESS CONFIRMATION RECEIPT */}
          {purchaseStep === "success" && (
            <div className="space-y-6 animate-scale-up">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                  <Check className="h-6 w-6" />
                </div>
                <h3
                  id="modal-headline"
                  className="text-xl font-bold text-white flex items-center justify-center gap-1.5"
                >
                  Time Token Purchased
                  <Sparkles className="h-4 w-4 text-cyan-300 shrink-0" />
                </h3>
                <p className="text-xs text-slate-400">
                  Your availability block has been secured and tokenized on Stellar ledger.
                </p>
              </div>

              {/* Successful Tx Receipt Table */}
              <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4 space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Minted Asset Code</span>
                  <span className="font-mono text-cyan-300 font-semibold uppercase">
                    CHRONO-{slotId.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-400 shrink-0">Stellar Txn Hash</span>
                  <span
                    className="font-mono text-slate-300 truncate max-w-[160px]"
                    title={txHash}
                  >
                    {txHash}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-400 shrink-0">Escrow Contract</span>
                  <span className="font-mono text-slate-300 truncate max-w-[160px]">
                    GCSW67F2Y...T9H3K2
                  </span>
                </div>

                <div className="flex justify-between border-t border-white/5 pt-3.5">
                  <span className="text-slate-400">Total Locked</span>
                  <span className="font-bold text-white">
                    {(chargedSnapshot?.effectiveTotalCost ?? effectiveTotalCost).toFixed(4)}{" "}
                    XLM
                  </span>
                </div>
              </div>

              {/* Auxiliary Booking CTAs */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onOpenRedeem}
                  className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 px-4 py-2.5 text-xs border border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20"
                >
                  Redeem Time Token
                </button>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Simulated Calendar Link: Dynamic Google Calendar invite dispatched successfully.",
                    )
                  }
                  className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 px-4 py-2.5 text-xs border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                >
                  Add Booking to Calendar
                </button>

                <button
                  type="button"
                  onClick={onOpenReceipt}
                  className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 px-4 py-2.5 text-xs border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                >
                  View Receipt
                  <Receipt className="h-3 w-3 ml-1.5" />
                </button>

                <a
                  href="https://stellar.expert"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white px-4 py-2.5 text-xs border border-white/10 text-slate-300 hover:bg-white/5"
                >
                  View Ledger Transaction
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </a>

                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 px-5 py-3 text-sm bg-cyan-300 text-slate-950 hover:bg-cyan-200 text-center mt-2"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </FocusTrap>
    </div>
  );
}
