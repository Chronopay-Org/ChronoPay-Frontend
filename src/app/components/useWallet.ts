import { useCallback, useSyncExternalStore } from "react";
import {
  isValidStellarAddress,
  resolveDefaultAdapter,
  toWalletError,
  type WalletAdapter,
  type WalletErrorCode,
} from "@/lib/wallet/adapter";

export type WalletStatus = "connected" | "disconnected" | "loading" | "error";

export interface WalletState {
  status: WalletStatus;
  address?: string;
  error?: string;
  errorCode?: WalletErrorCode;
}

export interface WalletStore {
  getState(): WalletState;
  subscribe(listener: () => void): () => void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  setAdapter(adapter: WalletAdapter | null): void;
}

const INITIAL_STATE: WalletState = { status: "disconnected" };

/**
 * Adapter-backed store. Exposed as a factory so tests can drive it with a
 * deterministic adapter instead of reaching into module-level state.
 */
export function createWalletStore(
  adapter: WalletAdapter | null = null,
): WalletStore {
  let currentAdapter = adapter;
  let state: WalletState = INITIAL_STATE;
  let unsubscribeAdapter: (() => void) | null = null;
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function setState(next: WalletState) {
    state = next;
    emit();
  }

  function applyConnection(address: string): boolean {
    if (!isValidStellarAddress(address)) {
      setState({
        status: "error",
        error:
          "The wallet returned an address that is not a valid Stellar public key.",
        errorCode: "INVALID_ADDRESS",
      });
      return false;
    }
    setState({ status: "connected", address });
    return true;
  }

  function watchAdapter(target: WalletAdapter) {
    unsubscribeAdapter?.();
    unsubscribeAdapter = target.onChange((change) => {
      if (!change.address) {
        setState(INITIAL_STATE);
        return;
      }
      applyConnection(change.address);
    });
  }

  async function connect() {
    if (state.status === "loading") return;

    const target = currentAdapter;
    if (!target) {
      setState({
        status: "error",
        error: "No wallet adapter is configured.",
        errorCode: "UNKNOWN",
      });
      return;
    }

    setState({ status: "loading" });

    try {
      const connection = await target.connect();
      if (target !== currentAdapter) return;
      if (applyConnection(connection.address)) {
        watchAdapter(target);
      }
    } catch (error) {
      if (target !== currentAdapter) return;
      const walletError = toWalletError(error);
      setState({
        status: "error",
        error: walletError.message,
        errorCode: walletError.code,
      });
    }
  }

  async function disconnect() {
    unsubscribeAdapter?.();
    unsubscribeAdapter = null;

    try {
      await currentAdapter?.disconnect();
    } catch {
      // Local state is authoritative; a failed disconnect still signs out.
    }

    setState(INITIAL_STATE);
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect,
    disconnect,
    setAdapter(nextAdapter) {
      unsubscribeAdapter?.();
      unsubscribeAdapter = null;
      currentAdapter = nextAdapter;
      setState(INITIAL_STATE);
    },
  };
}

export const walletStore: WalletStore = createWalletStore(resolveDefaultAdapter());

export function useWallet() {
  const state = useSyncExternalStore(
    walletStore.subscribe,
    walletStore.getState,
    walletStore.getState,
  );

  const connect = useCallback(() => walletStore.connect(), []);
  const disconnect = useCallback(() => walletStore.disconnect(), []);

  return {
    status: state.status,
    address: state.address,
    error: state.error,
    errorCode: state.errorCode,
    connect,
    disconnect,
  };
}
