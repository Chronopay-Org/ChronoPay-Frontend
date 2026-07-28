/**
 * Shared Stellar integration types.
 *
 * These types form the contract between the UI layer and any wallet adapter
 * (Freighter, Albedo, or a custom implementation). They are intentionally
 * wallet-agnostic so that adapters can be swapped without touching components.
 */

// ─── Wallet provider IDs ──────────────────────────────────────────────────────

export type WalletProviderId = "freighter" | "albedo" | "xbull";

// ─── Connection states ────────────────────────────────────────────────────────

export type WalletConnectionStatus =
  | "idle"        // no connection attempted yet
  | "connecting"  // connection in progress
  | "connected"   // public key available
  | "error";      // last attempt failed

export interface WalletConnectionState {
  status: WalletConnectionStatus;
  /** Stellar G… public key of the connected account. */
  publicKey: string | null;
  /** Human-readable error when status === "error". */
  error: string | null;
  /** The provider that established the connection. */
  provider: WalletProviderId | null;
}

// ─── Account info ─────────────────────────────────────────────────────────────

export interface StellarAccountInfo {
  publicKey: string;
  /** XLM balance as a formatted string, e.g. "1,240.00 XLM". */
  xlmBalance: string;
  /** Raw XLM balance as a number for calculations. */
  xlmBalanceRaw: number;
  /** True if the account has an existing trustline for CHRONO tokens. */
  hasChronoTrustline: boolean;
  /** CHRONO token balance as a formatted string. */
  chronoBalance: string;
}

// ─── Transaction types ────────────────────────────────────────────────────────

export type TransactionStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "success"
  | "error";

export interface TransactionState {
  status: TransactionStatus;
  /** Transaction hash once submitted. */
  txHash: string | null;
  error: string | null;
}

// ─── Wallet adapter interface ─────────────────────────────────────────────────

/**
 * All wallet adapters must satisfy this interface.
 * The hook `use-wallet.ts` accepts any conforming adapter, making it easy
 * to add new providers (e.g. xBull, Rabet) without changing hook logic.
 */
export interface WalletAdapter {
  id: WalletProviderId;
  name: string;
  /** Returns true if the browser extension / wallet app is detectable. */
  isAvailable(): boolean;
  /** Requests the user's public key. Throws on denial or unavailability. */
  getPublicKey(): Promise<string>;
  /**
   * Signs an XDR-encoded transaction envelope and returns the signed XDR.
   * Throws if the user rejects or signing fails.
   */
  signTransaction(xdr: string, network: string): Promise<string>;
}
