import type { ReceiptData, ReceiptLineItem } from "./types";

export interface BuildReceiptParams {
  slot: {
    id: string;
    title: string;
    rate: string;
    dateLabel: string;
    timeRange: string;
  };
  seller: {
    name: string;
    role?: string;
  };
  durationHours: number;
  subtotal: number;
  escrowFee: number;
  stellarFee: number;
  totalCost: number;
  effectiveTotalCost: number;
  discountPercent?: number;
  promoCode?: string;
  txHash: string;
  mockAddress?: string;
}

export function buildReceipt(params: BuildReceiptParams): ReceiptData {
  const {
    slot,
    seller,
    durationHours,
    subtotal,
    escrowFee,
    stellarFee,
    totalCost,
    effectiveTotalCost,
    discountPercent = 0,
    promoCode = "",
    txHash,
    mockAddress = "GCLUST3R...7X9K",
  } = params;

  const lineItems: ReceiptLineItem[] = [
    {
      label: "Token subtotal",
      value: `${subtotal.toFixed(2)} XLM`,
      note: `${slot.rate} × ${durationHours} hrs`,
    },
    {
      label: "Smart escrow fee",
      value: `${escrowFee.toFixed(4)} XLM`,
      note: "1.5% held in contract",
    },
    {
      label: "Stellar network fee",
      value: `${stellarFee.toFixed(4)} XLM`,
      note: "Paid to validators",
    },
  ];

  if (discountPercent > 0) {
    const discountAmount = Math.max(0, totalCost - effectiveTotalCost);
    const codeLabel = promoCode ? ` (${promoCode})` : "";
    lineItems.push({
      label: `Promo discount${codeLabel}`,
      value: `-${discountAmount.toFixed(4)} XLM`,
      note: `${discountPercent}% promo code applied`,
    });
  }

  return {
    id: slot.id,
    assetCode: `CHRONO-${slot.id.toUpperCase()}`,
    title: slot.title,
    status: "settled",
    settledAt: `${slot.dateLabel} · ${slot.timeRange}`,
    buyer: { name: "You", role: "Buyer", address: mockAddress },
    seller: { name: seller.name, role: seller.role },
    lineItems,
    net: `${subtotal.toFixed(2)} XLM`,
    total: `${effectiveTotalCost.toFixed(4)} XLM`,
    txHash,
    escrowContract: "GCSW67F2Y3MQK4N8Q5RLP9TZB3YH4W8F1S7N6U0X2A5V8T9H3K2",
    trace: [
      { label: "Stellar transaction initiated", status: "complete" },
      { label: "Trustline established for asset", status: "complete" },
      { label: "Funds locked in multi-sig escrow", status: "complete" },
      { label: "Token minted and funds released", status: "complete" },
    ],
    explorerBaseUrl: "https://stellar.expert/explorer/public/tx",
  };
}
