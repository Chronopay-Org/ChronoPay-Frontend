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

/**
 * Conversion note shown when a refund crosses currencies (e.g. XLM → USD).
 * Provides the pegged rate, its authoritative source, and a freshness timestamp
 * so the buyer can detect stale or outdated rate data.
 */
export type RefundConversionRate = {
  /** The source currency code, e.g. "XLM". */
  fromCurrency: string;
  /** The destination (refund) currency code, e.g. "USD". */
  toCurrency: string;
  /**
   * Exchange rate expressed as "1 {fromCurrency} = {rate} {toCurrency}".
   * Pre-formatted string, e.g. "0.1042".
   */
  rate: string;
  /**
   * Authoritative rate source name, e.g. "Stellar DEX USDC/XLM".
   * Used in the tooltip.
   */
  source: string;
  /**
   * ISO-8601 timestamp of when the rate was captured, e.g. "2026-04-01T10:04:00Z".
   * Used to calculate staleness and displayed in the tooltip.
   */
  fetchedAt: string;
  /**
   * Optional opaque reference ID for this rate snapshot (e.g. oracle tx hash).
   * Shown in the copy-to-clipboard affordance.
   */
  referenceId?: string;
  /**
   * When true, a stale-rate warning is surfaced. The component also auto-derives
   * staleness from `fetchedAt` when this flag is omitted.
   */
  isStale?: boolean;
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
  /**
   * Present only when the refund crosses currency boundaries.
   * Drives the RefundConversionNote beneath the total.
   */
  refundConversion?: RefundConversionRate;
};
