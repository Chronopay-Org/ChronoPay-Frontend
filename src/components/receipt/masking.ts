import type { ReceiptData } from "./types";
import { truncateHash } from "@/lib/format-address";

export { truncateHash };

/** Mask a counterparty name, keeping only the first initial of each word. */
export function maskName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}.`)
    .join(" ");
}

/**
 * Build a shareable receipt link with sensitive fields masked.
 *
 * The full tx hash, escrow contract, and counterparty names are never put in
 * the URL. Recipients see a truncated hash and masked parties only.
 */
export function buildShareLink(receipt: ReceiptData, origin: string): string {
  const params = new URLSearchParams({
    asset: receipt.assetCode,
    tx: truncateHash(receipt.txHash),
    buyer: maskName(receipt.buyer.name),
    seller: maskName(receipt.seller.name),
    total: receipt.total,
    settled: receipt.settledAt,
  });
  return `${origin}/receipt/verify?${params.toString()}`;
}

export interface VerifyReceiptParams {
  asset: string;
  tx: string;
  buyer: string;
  seller: string;
  total: string;
  settled: string;
}

export type ParseVerifyParamsResult =
  | { ok: true; data: VerifyReceiptParams }
  | { ok: false; error: string };

const ASSET_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,31}$/;
const TRUNCATED_TX_PATTERN = /^[A-Za-z0-9]{4,12}(\.\.\.[A-Za-z0-9]{4,12})?$/;
const MASKED_NAME_PATTERN = /^[A-Z]\.(\s[A-Z]\.)*$/;
const SAFE_TEXT_PATTERN = /^[^<>]{1,64}$/;

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

/**
 * Validate and extract masked receipt fields from `/receipt/verify` query params.
 * Rejects missing, malformed, or unmasked parameters so raw names or full hashes
 * are never rendered on the public verification page.
 */
export function parseVerifyParams(
  query: Record<string, string | string[] | undefined>,
): ParseVerifyParamsResult {
  const asset = firstParam(query.asset);
  const tx = firstParam(query.tx);
  const buyer = firstParam(query.buyer);
  const seller = firstParam(query.seller);
  const total = firstParam(query.total);
  const settled = firstParam(query.settled);

  if (!asset || !tx || !buyer || !seller || !total || !settled) {
    return {
      ok: false,
      error: "This verification link is missing required receipt parameters.",
    };
  }

  if (!ASSET_PATTERN.test(asset)) {
    return { ok: false, error: "Malformed asset code in verification link." };
  }

  if (tx.length > 24 || !TRUNCATED_TX_PATTERN.test(tx)) {
    return {
      ok: false,
      error: "Malformed or unmasked transaction hash in verification link.",
    };
  }

  if (!MASKED_NAME_PATTERN.test(buyer) || !MASKED_NAME_PATTERN.test(seller)) {
    return {
      ok: false,
      error: "Counterparty names must be masked initials (e.g. A. R.).",
    };
  }

  if (total.length > 40 || !SAFE_TEXT_PATTERN.test(total)) {
    return { ok: false, error: "Malformed total amount in verification link." };
  }

  if (!SAFE_TEXT_PATTERN.test(settled)) {
    return {
      ok: false,
      error: "Malformed settlement timestamp in verification link.",
    };
  }

  return {
    ok: true,
    data: { asset, tx, buyer, seller, total, settled },
  };
}

/** Mask a recovery code, replacing characters with bullets if not revealed. */
export function maskRecoveryCode(code: string, reveal: boolean): string {
  return reveal ? code : '•'.repeat(code.length);
}
