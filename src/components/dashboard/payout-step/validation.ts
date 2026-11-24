/**
 * Stellar payout validation utilities.
 *
 * - Public keys (G-addresses): 56 characters, starting with "G", RFC 4648 base32 (A-Z, 2-7).
 * - Text memos: optional, at most 28 UTF-8 bytes per Stellar protocol MEMO_TEXT limit.
 */

export const STELLAR_ADDRESS_LENGTH = 56;
export const STELLAR_MEMO_MAX_BYTES = 28;

const STELLAR_PUBLIC_KEY_REGEX = /^G[A-Z2-7]{55}$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface MemoValidationResult extends ValidationResult {
  byteLength: number;
}

export function validateStellarAddress(address: string): ValidationResult {
  const trimmed = address.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: "Enter a Stellar public key starting with G.",
    };
  }

  if (!trimmed.startsWith("G")) {
    return {
      valid: false,
      error: 'Stellar public keys must start with "G".',
    };
  }

  if (trimmed.length !== STELLAR_ADDRESS_LENGTH) {
    return {
      valid: false,
      error: `Stellar public keys must be exactly ${STELLAR_ADDRESS_LENGTH} characters.`,
    };
  }

  if (!STELLAR_PUBLIC_KEY_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Stellar public key must use valid base32 characters (A–Z and 2–7).",
    };
  }

  return { valid: true };
}

export function getUtf8ByteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return unescape(encodeURIComponent(value)).length;
}

export function validateStellarMemo(memo: string): MemoValidationResult {
  const byteLength = getUtf8ByteLength(memo);

  if (byteLength > STELLAR_MEMO_MAX_BYTES) {
    return {
      valid: false,
      byteLength,
      error: `Memo must be ${STELLAR_MEMO_MAX_BYTES} bytes or fewer (currently ${byteLength}).`,
    };
  }

  return { valid: true, byteLength };
}
