"use client";

import { useMemo } from "react";
import { ReceiptModal, buildReceipt, type ReceiptData } from "@/components/receipt";
import { RedeemTokenModal } from "@/components/dashboard/redeem-token-modal";
import type { ChargedSnapshot } from "./use-slot-booking";

export interface SlotReceiptSectionProps {
  slot: {
    id: string;
    title: string;
    rate: string;
    dateLabel: string;
    timeRange: string;
  };
  seller: {
    name: string;
    role: string;
  };
  durationHours: number;
  subtotal: number;
  escrowFee: number;
  stellarFee: number;
  totalCost: number;
  effectiveTotalCost: number;
  discountPercent: number;
  promoCode: string;
  chargedSnapshot: ChargedSnapshot | null;
  isSettled: boolean;
  txHash: string;
  walletAddress: string;
  isReceiptOpen: boolean;
  isRedeemModalOpen: boolean;
  onCloseReceipt: () => void;
  onCloseRedeem: () => void;
}

export function SlotReceiptSection({
  slot,
  seller,
  durationHours,
  subtotal,
  escrowFee,
  stellarFee,
  totalCost,
  effectiveTotalCost,
  discountPercent,
  promoCode,
  chargedSnapshot,
  isSettled,
  txHash,
  walletAddress,
  isReceiptOpen,
  isRedeemModalOpen,
  onCloseReceipt,
  onCloseRedeem,
}: SlotReceiptSectionProps) {
  const receipt: ReceiptData | null = isSettled
    ? buildReceipt({
        slot: {
          id: slot.id,
          title: slot.title,
          rate: slot.rate,
          dateLabel: slot.dateLabel,
          timeRange: slot.timeRange,
        },
        seller: {
          name: seller.name,
          role: seller.role,
        },
        durationHours,
        subtotal: chargedSnapshot?.subtotal ?? subtotal,
        escrowFee: chargedSnapshot?.escrowFee ?? escrowFee,
        stellarFee: chargedSnapshot?.stellarFee ?? stellarFee,
        totalCost: chargedSnapshot?.totalCost ?? totalCost,
        effectiveTotalCost: chargedSnapshot?.effectiveTotalCost ?? effectiveTotalCost,
        discountPercent: chargedSnapshot?.discountPercent ?? discountPercent,
        promoCode: chargedSnapshot?.promoCode ?? promoCode,
        txHash,
        mockAddress: walletAddress,
      })
    : null;

  const tokenCode = useMemo(
    () => `CHR-${slot.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slot.id, txHash],
  );

  return (
    <>
      <ReceiptModal isOpen={isReceiptOpen} onClose={onCloseReceipt} receipt={receipt} />
      <RedeemTokenModal
        isOpen={isRedeemModalOpen}
        onClose={onCloseRedeem}
        tokenCode={tokenCode}
      />
    </>
  );
}
