/**
 * Stellar wallet adapter layer.
 *
 * `useWallet` no longer simulates a connection: it talks to a `WalletAdapter`,
 * so adding a wallet means implementing this interface rather than editing the
 * hook. Freighter ships first, with a deterministic mock adapter backing tests
 * and demo mode.
 */

export type WalletErrorCode =
  | "NOT_INSTALLED"
  | "USER_REJECTED"
  | "WRONG_NETWORK"
  | "INVALID_ADDRESS"
  | "UNKNOWN";

export class WalletError extends Error {
  readonly code: WalletErrorCode;

  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

/** The Stellar network this app expects connected wallets to use. */
export const EXPECTED_NETWORK = "PUBLIC";

export interface WalletConnection {
  address: string;
  network: string;
}

export interface WalletAccountChange {
  address: string | null;
  network?: string | null;
}

export interface WalletAdapter {
  readonly id: string;
  readonly name: string;
  connect(): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  getAddress(): Promise<string | null>;
  getNetwork(): Promise<string>;
  onChange(listener: (change: WalletAccountChange) => void): () => void;
}

/**
 * Stellar public keys are 56 characters and start with `G`. We only gate on the
 * documented shape so a malformed address never reaches the store.
 */
export function isValidStellarAddress(value: unknown): value is string {
  return typeof value === "string" && value.length === 56 && value.startsWith("G");
}

/**
 * Normalises anything a wallet throws into a typed `WalletError` so callers can
 * branch on `code` instead of parsing free-form messages.
 */
export function toWalletError(error: unknown): WalletError {
  if (error instanceof WalletError) return error;

  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";
  const message = raw.toLowerCase();

  if (
    message.includes("reject") ||
    message.includes("declin") ||
    message.includes("denied") ||
    message.includes("cancel")
  ) {
    return new WalletError(
      "USER_REJECTED",
      "You rejected the connection request in your wallet.",
    );
  }

  if (message.includes("network")) {
    return new WalletError(
      "WRONG_NETWORK",
      "Your wallet is connected to the wrong Stellar network.",
    );
  }

  if (message.includes("install") || message.includes("not found")) {
    return new WalletError(
      "NOT_INSTALLED",
      "The wallet extension is not installed.",
    );
  }

  return new WalletError("UNKNOWN", raw || "Unable to connect to your wallet.");
}

interface FreighterApi {
  requestAccess?: () => Promise<unknown>;
  getPublicKey?: () => Promise<string>;
  getNetwork?: () => Promise<string>;
}

function getFreighterApi(): FreighterApi | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { freighterApi?: FreighterApi })
    .freighterApi;
  return candidate ?? null;
}

export const freighterAdapter: WalletAdapter = {
  id: "freighter",
  name: "Freighter",

  async connect(): Promise<WalletConnection> {
    const api = getFreighterApi();
    if (!api || typeof api.getPublicKey !== "function") {
      throw new WalletError(
        "NOT_INSTALLED",
        "Freighter is not installed. Install the extension and reload the page.",
      );
    }

    let address: string;
    try {
      if (typeof api.requestAccess === "function") {
        await api.requestAccess();
      }
      address = await api.getPublicKey();
    } catch (error) {
      throw toWalletError(error);
    }

    if (!isValidStellarAddress(address)) {
      throw new WalletError(
        "INVALID_ADDRESS",
        "Freighter returned an address that is not a valid Stellar public key.",
      );
    }

    const network =
      typeof api.getNetwork === "function"
        ? await api.getNetwork()
        : EXPECTED_NETWORK;

    if (network !== EXPECTED_NETWORK) {
      throw new WalletError(
        "WRONG_NETWORK",
        `Freighter is connected to ${network}. Switch to the ${EXPECTED_NETWORK} network.`,
      );
    }

    return { address, network };
  },

  async disconnect(): Promise<void> {
    // Freighter owns its session; there is nothing to tear down locally.
  },

  async getAddress(): Promise<string | null> {
    const api = getFreighterApi();
    if (!api || typeof api.getPublicKey !== "function") return null;
    try {
      return await api.getPublicKey();
    } catch {
      return null;
    }
  },

  async getNetwork(): Promise<string> {
    const api = getFreighterApi();
    if (!api || typeof api.getNetwork !== "function") {
      throw new WalletError("NOT_INSTALLED", "Freighter is not installed.");
    }
    return api.getNetwork();
  },

  onChange(): () => void {
    // Freighter does not expose a stable account-change event on the injected
    // API; account changes are picked up on the next connect().
    return () => {};
  },
};

export const MOCK_ADDRESS =
  "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";

export interface MockWalletAdapter extends WalletAdapter {
  emitAccountChange(change: WalletAccountChange): void;
}

export interface MockAdapterOptions {
  address?: string;
  network?: string;
  connectError?: unknown;
}

/**
 * Deterministic adapter for tests and demo mode. `emitAccountChange` lets tests
 * drive the account-change subscription without a real extension.
 */
export function createMockAdapter(
  options: MockAdapterOptions = {},
): MockWalletAdapter {
  const address = options.address ?? MOCK_ADDRESS;
  const network = options.network ?? EXPECTED_NETWORK;
  const listeners = new Set<(change: WalletAccountChange) => void>();

  function emit(change: WalletAccountChange) {
    listeners.forEach((listener) => listener(change));
  }

  return {
    id: "mock",
    name: "Demo Wallet",

    async connect(): Promise<WalletConnection> {
      if (options.connectError) {
        throw toWalletError(options.connectError);
      }
      return { address, network };
    },

    async disconnect(): Promise<void> {
      emit({ address: null, network: null });
    },

    async getAddress(): Promise<string | null> {
      return address;
    },

    async getNetwork(): Promise<string> {
      return network;
    },

    onChange(listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    emitAccountChange(change) {
      emit(change);
    },
  };
}

export const mockAdapter: MockWalletAdapter = createMockAdapter();

/** Demo mode swaps in the mock adapter so the UI is explorable without an extension. */
export function resolveDefaultAdapter(): WalletAdapter {
  const mode =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_WALLET_MODE
      : undefined;
  return mode === "demo" ? mockAdapter : freighterAdapter;
}
