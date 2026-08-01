"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type StellarNetwork = "mainnet" | "testnet";

interface NetworkContextValue {
  network: StellarNetwork;
  setNetwork: (network: StellarNetwork) => void;
}

interface NetworkSelectorProps {
  /** Optional controlled value. Falls back to localStorage-persisted or "mainnet" */
  network?: StellarNetwork;
  /** Called when the user selects a network */
  onChange?: (network: StellarNetwork) => void;
  /** When true, renders compact label only (for header use). Default false. */
  compact?: boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "chronopay:stellar-network";

const NetworkContext = createContext<NetworkContextValue>({
  network: "mainnet",
  setNetwork: () => {},
});

/**
 * Reads the persisted network preference. Returns "mainnet" as default.
 */
export function readPersistedNetwork(): StellarNetwork {
  if (typeof window === "undefined") return "mainnet";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "mainnet" || raw === "testnet") return raw;
  } catch {
    // localStorage may be unavailable
  }
  return "mainnet";
}

/**
 * Provider that reads the initial network from localStorage and keeps it
 * in sync. Wrap near the app root or the checkout subtree.
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<StellarNetwork>("mainnet");

  // Hydrate from localStorage on mount
  useEffect(() => {
    setNetworkState(readPersistedNetwork());
  }, []);

  const setNetwork = useCallback((next: StellarNetwork) => {
    setNetworkState(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage may be unavailable
      }
    }
  }, []);

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * Hook to read and update the current Stellar network within a NetworkProvider.
 */
export function useNetwork(): NetworkContextValue {
  return useContext(NetworkContext);
}

// ─── Warning Modal ──────────────────────────────────────────────────────────────

interface WarningModalProps {
  from: StellarNetwork;
  to: StellarNetwork;
  onConfirm: () => void;
  onCancel: () => void;
}

function WarningModal({ from, to, onConfirm, onCancel }: WarningModalProps) {
  const isLeavingTestnet = from === "testnet" && to === "mainnet";
  const title = isLeavingTestnet
    ? "Switch to Stellar Mainnet?"
    : "Switch to Stellar Testnet?";
  const description = isLeavingTestnet
    ? "You are about to switch from Testnet to Mainnet. Mainnet uses real XLM. Ensure you intend to transact with live funds."
    : "You are about to switch from Mainnet to Testnet. Testnet uses play XLM and is intended for development and testing only.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="network-warning-title"
      aria-describedby="network-warning-desc"
    >
      <div className="elevation-4 w-full max-w-sm rounded-xl bg-white p-6 dark:bg-slate-900">
        <h3
          id="network-warning-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-50"
        >
          {title}
        </h3>
        <p
          id="network-warning-desc"
          className="mt-3 text-sm text-slate-600 dark:text-slate-400"
        >
          {description}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              to === "testnet"
                ? "bg-amber-600 hover:bg-amber-500 focus-visible:ring-amber-300"
                : "bg-cyan-600 hover:bg-cyan-500 focus-visible:ring-cyan-300"
            }`}
          >
            {to === "testnet" ? "Switch to Testnet" : "Switch to Mainnet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Segmented Control ──────────────────────────────────────────────────────────

/**
 * NetworkSelector
 *
 * A compact segmented control for switching between Stellar Mainnet and Testnet.
 * Persists selection to localStorage and shows a warning modal when the user
 * changes the network. Includes icons, WCAG 2.1 AA support, and dark mode.
 *
 * @example
 * <NetworkSelector />
 * <NetworkSelector compact />
 * <NetworkSelector network="testnet" onChange={(n) => console.log(n)} />
 */
export function NetworkSelector({
  network: controlledNetwork,
  onChange,
  compact = false,
}: NetworkSelectorProps) {
  const ctx = useNetwork();
  const labelId = useId();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingNetwork, setPendingNetwork] = useState<StellarNetwork | null>(
    null,
  );

  // Use controlled value if provided, otherwise fall back to context
  const currentNetwork =
    controlledNetwork !== undefined ? controlledNetwork : ctx.network;

  const handleSelect = useCallback(
    (next: StellarNetwork) => {
      if (next === currentNetwork) return;

      // Show warning modal before switching
      setPendingNetwork(next);
      setShowWarning(true);
    },
    [currentNetwork],
  );

  const confirmSwitch = useCallback(() => {
    if (!pendingNetwork) return;
    setShowWarning(false);

    if (controlledNetwork === undefined) {
      // Uncontrolled: update context
      ctx.setNetwork(pendingNetwork);
    }
    onChange?.(pendingNetwork);
    setPendingNetwork(null);
  }, [pendingNetwork, controlledNetwork, ctx, onChange]);

  const cancelSwitch = useCallback(() => {
    setShowWarning(false);
    setPendingNetwork(null);
  }, []);

  return (
    <>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={`inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <span id={labelId} className="sr-only">
          Select Stellar network
        </span>

        {/* Mainnet */}
        <button
          type="button"
          role="radio"
          aria-checked={currentNetwork === "mainnet"}
          onClick={() => handleSelect("mainnet")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800 ${
            currentNetwork === "mainnet"
              ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-700 dark:text-cyan-300"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          aria-label="Stellar Mainnet — live network with real XLM"
        >
          {/* Globe icon */}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="h-3.5 w-3.5"
          >
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="8" cy="8" rx="3" ry="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Mainnet
        </button>

        {/* Testnet */}
        <button
          type="button"
          role="radio"
          aria-checked={currentNetwork === "testnet"}
          onClick={() => handleSelect("testnet")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800 ${
            currentNetwork === "testnet"
              ? "bg-white text-amber-700 shadow-sm dark:bg-slate-700 dark:text-amber-300"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
          aria-label="Stellar Testnet — development network with play XLM"
        >
          {/* Flask/beaker icon */}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="h-3.5 w-3.5"
          >
            <path
              d="M5 2v4L2.4 12.2A1 1 0 0 0 3.3 13.5h9.4a1 1 0 0 0 .9-1.3L11 6V2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M5 2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M3.5 10.5A4 4 0 0 1 5 10c1.5 0 2 .8 3 .8s1.5-.8 3-.8a4 4 0 0 1 1.5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Testnet
        </button>
      </div>

      {/* Warning modal */}
      {showWarning && pendingNetwork && (
        <WarningModal
          from={currentNetwork}
          to={pendingNetwork}
          onConfirm={confirmSwitch}
          onCancel={cancelSwitch}
        />
      )}
    </>
  );
}

// ─── Testnet Ribbon ────────────────────────────────────────────────────────────

/**
 * TestnetRibbon
 *
 * A small warning ribbon displayed on the wallet card when Testnet is active.
 * Shows a distinct warning colour and "Testnet" label.
 */
export function TestnetRibbon({ network }: { network: StellarNetwork }) {
  if (network !== "testnet") return null;

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-amber-200/30 bg-amber-400/10 px-2.5 py-0.5"
      aria-label="Testnet network — play XLM"
    >
      <svg
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className="h-2.5 w-2.5 text-amber-400"
      >
        <path
          d="M6 1.5L1.5 10.5h9L6 1.5Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M6 4.5v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="6" cy="9" r="0.5" fill="currentColor" />
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
        Testnet
      </span>
    </div>
  );
}
