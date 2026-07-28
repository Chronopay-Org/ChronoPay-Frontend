"use client";

/**
 * useWallet — Stellar wallet connection and account management hook.
 *
 * This hook is the single integration point between the UI and the Stellar
 * wallet layer. Components call `connect`, `disconnect`, and `signTransaction`
 * without knowing which wallet provider is active.
 *
 * Architecture
 * ────────────
 * - Adapter pattern: each provider (Freighter, Albedo) is a WalletAdapter.
 * - State is managed locally; lift to a context/Zustand store when needed.
 * - Account info is fetched from Horizon after a successful connection.
 * - `signTransaction` is a thin pass-through — transaction building belongs
 *   in feature-level hooks, not here.
 *
 * Usage
 * ─────
 * ```tsx
 * const { connection, accountInfo, connect, disconnect } = useWallet();
 *
 * // Connect via Freighter
 * await connect("freighter");
 *
 * // Sign a pre-built XDR envelope
 * const signed = await signTransaction(xdr);
 * ```
 *
 * Replacing the scaffold with real SDK calls
 * ──────────────────────────────────────────
 * 1. Install the SDK:  npm install @stellar/stellar-sdk @stellar/freighter-api
 * 2. Update adapters in src/lib/stellar/adapters.ts
 * 3. No changes needed in this hook — it delegates entirely to adapters.
 */

import { useCallback, useReducer } from "react";
import type { WalletConnectionState, WalletProviderId, StellarAccountInfo } from "@/lib/stellar/types";
import { getAdapter } from "@/lib/stellar/adapters";
import { fetchAccountInfo } from "@/lib/stellar/horizon";
import { STELLAR_NETWORK } from "@/lib/stellar/config";

// ─── State ────────────────────────────────────────────────────────────────────

interface WalletState {
  connection: WalletConnectionState;
  accountInfo: StellarAccountInfo | null;
  /** True while account info is being fetched from Horizon. */
  loadingAccount: boolean;
}

const initialState: WalletState = {
  connection: {
    status: "idle",
    publicKey: null,
    error: null,
    provider: null,
  },
  accountInfo: null,
  loadingAccount: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "CONNECTING"; provider: WalletProviderId }
  | { type: "CONNECTED"; publicKey: string; provider: WalletProviderId }
  | { type: "CONNECT_ERROR"; error: string }
  | { type: "ACCOUNT_LOADED"; accountInfo: StellarAccountInfo }
  | { type: "ACCOUNT_LOADING" }
  | { type: "DISCONNECTED" };

function reducer(state: WalletState, action: Action): WalletState {
  switch (action.type) {
    case "CONNECTING":
      return {
        ...state,
        connection: {
          status: "connecting",
          publicKey: null,
          error: null,
          provider: action.provider,
        },
      };
    case "CONNECTED":
      return {
        ...state,
        connection: {
          status: "connected",
          publicKey: action.publicKey,
          error: null,
          provider: action.provider,
        },
      };
    case "CONNECT_ERROR":
      return {
        ...state,
        connection: {
          ...state.connection,
          status: "error",
          error: action.error,
        },
        loadingAccount: false,
      };
    case "ACCOUNT_LOADING":
      return { ...state, loadingAccount: true };
    case "ACCOUNT_LOADED":
      return { ...state, accountInfo: action.accountInfo, loadingAccount: false };
    case "DISCONNECTED":
      return initialState;
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseWalletReturn {
  connection: WalletConnectionState;
  accountInfo: StellarAccountInfo | null;
  loadingAccount: boolean;
  /** Attempt to connect using the specified wallet provider. */
  connect: (provider: WalletProviderId) => Promise<void>;
  /** Disconnect and clear all wallet state. */
  disconnect: () => void;
  /**
   * Sign a pre-built XDR transaction envelope.
   * Returns the signed XDR string. Throws on user rejection or error.
   */
  signTransaction: (xdr: string) => Promise<string>;
  /** Re-fetch account info from Horizon (e.g. after a transaction). */
  refreshAccount: () => Promise<void>;
}

export function useWallet(): UseWalletReturn {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadAccount = useCallback(async (publicKey: string) => {
    dispatch({ type: "ACCOUNT_LOADING" });
    try {
      const info = await fetchAccountInfo(publicKey);
      if (info) {
        dispatch({ type: "ACCOUNT_LOADED", accountInfo: info });
      }
    } catch {
      // Non-fatal: account info failure doesn't block the connection
    }
  }, []);

  const connect = useCallback(
    async (providerId: WalletProviderId) => {
      dispatch({ type: "CONNECTING", provider: providerId });

      const adapter = getAdapter(providerId);
      if (!adapter) {
        dispatch({ type: "CONNECT_ERROR", error: `Unknown wallet provider: ${providerId}` });
        return;
      }

      if (!adapter.isAvailable()) {
        dispatch({
          type: "CONNECT_ERROR",
          error: `${adapter.name} is not installed. Please install the browser extension.`,
        });
        return;
      }

      try {
        const publicKey = await adapter.getPublicKey();
        dispatch({ type: "CONNECTED", publicKey, provider: providerId });
        // Load Horizon account data in the background — don't block the UI
        await loadAccount(publicKey);
      } catch (err) {
        dispatch({
          type: "CONNECT_ERROR",
          error: err instanceof Error ? err.message : "Connection failed",
        });
      }
    },
    [loadAccount],
  );

  const disconnect = useCallback(() => {
    dispatch({ type: "DISCONNECTED" });
  }, []);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      const { provider } = state.connection;
      if (!provider) throw new Error("No wallet connected.");

      const adapter = getAdapter(provider);
      if (!adapter) throw new Error(`Adapter for ${provider} not found.`);

      const networkPassphrase =
        STELLAR_NETWORK === "public"
          ? "Public Global Stellar Network ; September 2015"
          : "Test SDF Network ; September 2015";

      return adapter.signTransaction(xdr, networkPassphrase);
    },
    [state.connection],
  );

  const refreshAccount = useCallback(async () => {
    const { publicKey } = state.connection;
    if (publicKey) await loadAccount(publicKey);
  }, [state.connection, loadAccount]);

  return {
    connection: state.connection,
    accountInfo: state.accountInfo,
    loadingAccount: state.loadingAccount,
    connect,
    disconnect,
    signTransaction,
    refreshAccount,
  };
}
