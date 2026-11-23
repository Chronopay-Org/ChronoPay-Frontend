"use client";

import type { RefObject } from "react";
import { Scale, Wallet } from "lucide-react";
import type { WalletStatus } from "./use-slot-booking";

export interface SlotActionsSectionProps {
  simWallet: WalletStatus;
  isWalletReady: boolean;
  hasFunds: boolean;
  existingDisputesCount: number;
  purchaseBtnRef?: RefObject<HTMLButtonElement | null>;
  disputeBtnRef?: RefObject<HTMLButtonElement | null>;
  onConnectWallet: () => void;
  onRetryConnection: () => void;
  onOpenPurchase: () => void;
  onOpenDispute: () => void;
}

export function SlotActionsSection({
  simWallet,
  isWalletReady,
  hasFunds,
  existingDisputesCount,
  purchaseBtnRef,
  disputeBtnRef,
  onConnectWallet,
  onRetryConnection,
  onOpenPurchase,
  onOpenDispute,
}: SlotActionsSectionProps) {
  return (
    <div className="pt-2">
      {simWallet === "disconnected" && (
        <button
          type="button"
          onClick={onConnectWallet}
          className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 px-5 py-3 text-sm bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-[0_16px_34px_rgba(34,211,238,0.15)]"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect Stellar Wallet
        </button>
      )}

      {simWallet === "error" && (
        <button
          type="button"
          onClick={onRetryConnection}
          className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 px-5 py-3 text-sm border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
        >
          Retry Connection Sync
        </button>
      )}

      {isWalletReady && !hasFunds && (
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center rounded-full font-bold px-5 py-3 text-sm border border-white/10 bg-white/5 text-slate-400 cursor-not-allowed"
        >
          Insufficient Stellar Funds
        </button>
      )}

      {isWalletReady && hasFunds && (
        <button
          type="button"
          ref={purchaseBtnRef}
          onClick={onOpenPurchase}
          className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 px-5 py-3 text-sm bg-cyan-300 text-slate-950 hover:bg-cyan-200 hover:scale-[1.01] hover:shadow-[0_16px_34px_rgba(34,211,238,0.22)] active:scale-[0.99]"
        >
          Purchase Time Token
        </button>
      )}

      {existingDisputesCount > 0 && (
        <button
          ref={disputeBtnRef}
          type="button"
          onClick={onOpenDispute}
          className="w-full flex items-center justify-center rounded-full font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 px-5 py-3 text-sm border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 mt-3"
        >
          <Scale className="h-4 w-4 mr-2" />
          View Dispute ({existingDisputesCount})
        </button>
      )}
    </div>
  );
}
