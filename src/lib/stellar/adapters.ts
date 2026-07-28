/**
 * Wallet adapters for Freighter and Albedo.
 *
 * Each adapter implements WalletAdapter and wraps the provider's browser
 * extension API. They are thin shims — no business logic lives here.
 *
 * To add a new provider:
 *   1. Create a new adapter object conforming to WalletAdapter.
 *   2. Add it to ALL_ADAPTERS below.
 *   3. Add its WalletProvider entry in wallet-card.tsx.
 *
 * SDK installation (run when ready to integrate):
 *   npm install @stellar/freighter-api
 *   npm install @albedo-link/intent
 */

import type { WalletAdapter, WalletProviderId } from "./types";
import { STELLAR_NETWORK } from "./config";

// ─── Freighter adapter ────────────────────────────────────────────────────────

/**
 * Freighter is a browser extension wallet for Stellar.
 * https://www.freighter.app/
 *
 * This adapter uses the window.freighter global injected by the extension.
 * Once @stellar/freighter-api is installed, replace the window.freighter
 * calls with the typed SDK equivalents:
 *
 *   import {
 *     isConnected,
 *     getPublicKey,
 *     signTransaction,
 *   } from "@stellar/freighter-api";
 */
export const freighterAdapter: WalletAdapter = {
  id: "freighter" as WalletProviderId,
  name: "Freighter",

  isAvailable() {
    // Freighter injects window.freighter when the extension is installed.
    return (
      typeof window !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (window as any).freighter !== "undefined"
    );
  },

  async getPublicKey(): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error(
        "Freighter extension not found. Install it from freighter.app.",
      );
    }
    // Replace with: return getPublicKey(); from @stellar/freighter-api
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (window as any).freighter.getPublicKey();
    if (result.error) throw new Error(result.error);
    return result.publicKey as string;
  },

  async signTransaction(xdr: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("Freighter extension not found.");
    }
    const network = STELLAR_NETWORK === "public" ? "MAINNET" : "TESTNET";
    // Replace with: return signTransaction(xdr, { network }); from @stellar/freighter-api
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (window as any).freighter.signTransaction(xdr, network);
    if (result.error) throw new Error(result.error);
    return result.signedTransaction as string;
  },
};

// ─── Albedo adapter ───────────────────────────────────────────────────────────

/**
 * Albedo is a web-based intent signing service for Stellar.
 * https://albedo.link/
 *
 * Once @albedo-link/intent is installed, replace the fetch-based call with:
 *   import albedo from "@albedo-link/intent";
 *   const { pubkey } = await albedo.publicKey({ require_existing: true });
 */
export const albedoAdapter: WalletAdapter = {
  id: "albedo" as WalletProviderId,
  name: "Albedo",

  isAvailable() {
    // Albedo is a web service — always "available" (opens a popup)
    return typeof window !== "undefined";
  },

  async getPublicKey(): Promise<string> {
    // Replace with: const { pubkey } = await albedo.publicKey({});
    throw new Error(
      "Albedo integration requires @albedo-link/intent. " +
        "Run: npm install @albedo-link/intent",
    );
  },

  async signTransaction(xdr: string): Promise<string> {
    // Replace with: const { signed_envelope_xdr } = await albedo.tx({ xdr, ... });
    void xdr;
    throw new Error(
      "Albedo integration requires @albedo-link/intent. " +
        "Run: npm install @albedo-link/intent",
    );
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ALL_ADAPTERS: WalletAdapter[] = [freighterAdapter, albedoAdapter];

export function getAdapter(id: WalletProviderId): WalletAdapter | undefined {
  return ALL_ADAPTERS.find((a) => a.id === id);
}
