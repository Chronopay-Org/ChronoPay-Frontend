import type { ReceiptData } from "./types";

/** Truncate a long on-chain identifier to a head/tail preview. */
export function truncateHash(value: string, head = 6, tail = 6): string {
  const clean = value.replace(/\.\.\.minted$/, "");
  if (clean.length <= head + tail + 1) return clean;
  return `${clean.slice(0, head)}...${clean.slice(-tail)}`;
}

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
  return `${origin}/dashboard/slots/${receipt.id}/receipt?${params.toString()}`;
}
