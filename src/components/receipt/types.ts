/**
 * Data model for the on-chain receipt.
 *
 * Mirrors the settled-transaction fields available on the slot detail page
 * (amount, fees, parties, escrow trace, tx hash, timestamps, status).
 */

export type ReceiptStatus = "settled" | "pending" | "failed";

export type ReceiptParty = {
  /** Human-readable label, e.g. "Dr. Sarah Jenkins". */
  name: string;
  /** Optional secondary label, e.g. "Lead Product Architect" or "You". */
  role?: string;
  /** Stellar account address, shown truncated. */
  address?: string;
};

export type ReceiptLineItem = {
  label: string;
  /** Pre-formatted display value, e.g. "180.00 XLM". */
  value: string;
  /** Optional plain-language note shown beneath the label. */
  note?: string;
};

export type EscrowTraceStep = {
  label: string;
  /** Pre-formatted timestamp, e.g. "12:04:01 UTC". */
  timestamp?: string;
  status: "complete" | "pending" | "failed";
};

export type ReceiptData = {
  /** Stable id for the receipt / underlying booking. */
  id: string;
  /** Minted asset code, e.g. "CHRONO-SLOT-1". */
  assetCode: string;
  title: string;
  status: ReceiptStatus;
  /** Pre-formatted settlement timestamp, e.g. "Apr 1, 2026 · 10:04 UTC". */
  settledAt: string;
  buyer: ReceiptParty;
  seller: ReceiptParty;
  /** Cost breakdown rows (subtotal, fees). */
  lineItems: ReceiptLineItem[];
  /** Pre-formatted total, e.g. "182.81 XLM". */
  total: string;
  /** Pre-formatted net released to the seller, e.g. "180.00 XLM". */
  net: string;
  /** Stellar transaction hash. */
  txHash: string;
  /** Escrow contract address. */
  escrowContract: string;
  /** Ordered escrow lifecycle steps. */
  trace: EscrowTraceStep[];
  /** Base URL of the ledger explorer, e.g. "https://stellar.expert/explorer/public/tx". */
  explorerBaseUrl: string;
};
