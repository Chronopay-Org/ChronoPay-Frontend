/**
 * Shared middle-truncation utilities for Stellar addresses and on-chain hashes.
 */

/**
 * Truncate the middle of an identifier, keeping `head` leading characters and
 * `tail` trailing characters separated by `ellipsis`.
 *
 * Returns `value` unchanged when it is empty or short enough that truncation
 * would not meaningfully shorten it (`value.length <= head + tail + Math.max(ellipsis.length, 2)`).
 *
 * @example truncateMiddle("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN")
 *   → "GAAZI4…CCWN"
 */
export function truncateMiddle(
  value: string,
  head = 6,
  tail = 4,
  ellipsis = "…",
): string {
  if (!value) return value;
  const threshold = head + tail + Math.max(ellipsis.length, 2);
  if (value.length <= threshold) return value;
  const start = head > 0 ? value.slice(0, head) : "";
  const end = tail > 0 ? value.slice(-tail) : "";
  return `${start}${ellipsis}${end}`;
}

/**
 * Truncate a Stellar address for compact display: first `head` (default 6)
 * chars + "…" + last `tail` (default 4) chars.
 */
export function truncateAddress(address: string, head = 6, tail = 4): string {
  return truncateMiddle(address, head, tail, "…");
}

/**
 * Truncate a long on-chain hash or identifier to a head/tail preview,
 * stripping any trailing `...minted` placeholder suffix first.
 */
export function truncateHash(value: string, head = 6, tail = 6): string {
  const clean = value.replace(/\.\.\.minted$/, "");
  return truncateMiddle(clean, head, tail, "...");
}
