"use client";

/**
 * useAccounts — manages multiple wallet accounts for the account switcher.
 *
 * This hook provides:
 *   - A list of connected accounts with address, label, and avatar seed
 *   - The currently active account, pinned at top of the switcher
 *   - Switching between accounts with recent-accounts tracking
 *   - Removing an account
 *   - Triggering the "add account" flow (opens the WalletConnectModal)
 *   - A sorted recent-accounts list (up to MAX_RECENTS, persisted in localStorage)
 *
 * The data layer is intentionally shallow (in-memory state) so the real
 * Stellar SDK or wallet-extension integration can be dropped in later.
 */

import { useCallback, useReducer } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "chronopay:recent-accounts";
export const MAX_RECENTS = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Account {
  /** Stellar public key – full 56-character G… address */
  address: string;
  /** Human-readable label set by the user, e.g. "Savings" */
  label?: string;
  /** Wallet provider id, e.g. "freighter" | "albedo" */
  provider?: string;
}

export type AccountsStatus = "idle" | "loading" | "error";

export interface AccountsState {
  accounts: Account[];
  /** Ordered list of recently used account addresses (most recent first), up to MAX_RECENTS */
  recentAddresses: string[];
  activeAddress: string | null;
  status: AccountsStatus;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Truncate a Stellar address for display: first 6 chars + "…" + last 4 chars.
 * Full address is preserved in aria-label on the calling component.
 *
 * @example truncateAddress("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN")
 *   → "GAAZI4…OCCWN"
 */
export function truncateAddress(address: string): string {
  if (!address || address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Derive a deterministic background colour for an avatar from the address.
 * Returns one of several Tailwind-safe colour strings so the avatar has
 * consistent colour per account without needing a stored image.
 */
export function avatarColour(address: string): string {
  const colours = [
    "bg-cyan-600",
    "bg-violet-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-sky-600",
    "bg-indigo-600",
    "bg-teal-600",
  ];
  if (!address) return colours[0];
  // Sum char codes of the first 8 chars for a stable index
  const sum = Array.from(address.slice(0, 8)).reduce(
    (acc, c) => acc + c.charCodeAt(0),
    0,
  );
  return colours[sum % colours.length];
}

/**
 * Derive initials for an avatar from label or address.
 *   - If label is set: first two characters, uppercased
 *   - Otherwise: first character of the address
 */
export function avatarInitials(account: Account): string {
  if (account.label) {
    return account.label.slice(0, 2).toUpperCase();
  }
  return account.address.slice(0, 2).toUpperCase();
}

// ─── localStorage helpers for recent accounts ────────────────────────────────

function loadRecentAddresses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return (parsed as string[]).slice(0, MAX_RECENTS);
    }
    return [];
  } catch {
    return [];
  }
}

function saveRecentAddresses(addresses: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Update the recent list when an account is activated:
 * - Move the address to the front
 * - Cap at MAX_RECENTS
 * - Persist to localStorage
 */
function bumpRecent(
  prev: string[],
  address: string,
): string[] {
  const filtered = prev.filter((a) => a !== address);
  const next = [address, ...filtered].slice(0, MAX_RECENTS);
  saveRecentAddresses(next);
  return next;
}

function removeFromRecent(prev: string[], address: string): string[] {
  const next = prev.filter((a) => a !== address);
  saveRecentAddresses(next);
  return next;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_ACTIVE"; address: string }
  | { type: "ADD_ACCOUNT"; account: Account }
  | { type: "REMOVE_ACCOUNT"; address: string }
  | { type: "SET_STATUS"; status: AccountsStatus; error?: string }
  | { type: "RESET" };

function accountsReducer(state: AccountsState, action: Action): AccountsState {
  switch (action.type) {
    case "SET_ACTIVE": {
      const exists = state.accounts.some((a) => a.address === action.address);
      if (!exists) return state;
      return {
        ...state,
        activeAddress: action.address,
        recentAddresses: bumpRecent(state.recentAddresses, action.address),
      };
    }
    case "ADD_ACCOUNT": {
      const alreadyExists = state.accounts.some(
        (a) => a.address === action.account.address,
      );
      if (alreadyExists) {
        // Switch to it and bump recents
        return {
          ...state,
          activeAddress: action.account.address,
          recentAddresses: bumpRecent(
            state.recentAddresses,
            action.account.address,
          ),
        };
      }
      return {
        ...state,
        accounts: [...state.accounts, action.account],
        activeAddress: action.account.address,
        recentAddresses: bumpRecent(
          state.recentAddresses,
          action.account.address,
        ),
      };
    }
    case "REMOVE_ACCOUNT": {
      const remaining = state.accounts.filter(
        (a) => a.address !== action.address,
      );
      const newActive =
        state.activeAddress === action.address
          ? (remaining[0]?.address ?? null)
          : state.activeAddress;
      return {
        ...state,
        accounts: remaining,
        activeAddress: newActive,
        recentAddresses: removeFromRecent(
          state.recentAddresses,
          action.address,
        ),
      };
    }
    case "SET_STATUS":
      return {
        ...state,
        status: action.status,
        error: action.error ?? null,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// ─── Demo seed data ───────────────────────────────────────────────────────────
// Three accounts are pre-seeded so recent-accounts list is non-empty on first render.
// Replace this with real wallet-extension reads in production.

const DEMO_ACCOUNTS: Account[] = [
  {
    address: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
    label: "Primary",
    provider: "freighter",
  },
  {
    address: "GD6WNTESP5HB7SRDKOZNVPHKBF7BQHK7VMQFHPVDG3XMHXF3CRXOYZK",
    label: "Savings",
    provider: "albedo",
  },
  {
    address: "GCLRFH5J3ZY7E5QFU65S2QOAJF7Q4XJSE4Z6NVKZX3F6P3VK4LQMG5JR",
    label: "Business",
    provider: "freighter",
  },
];

const recentFromStorage = loadRecentAddresses();

const initialState: AccountsState = {
  accounts: DEMO_ACCOUNTS,
  activeAddress: DEMO_ACCOUNTS[0].address,
  recentAddresses:
    recentFromStorage.length > 0
      ? recentFromStorage
      : DEMO_ACCOUNTS.map((a) => a.address),
  status: "idle",
  error: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAccountsReturn extends AccountsState {
  activeAccount: Account | null;
  switchAccount: (address: string) => void;
  addAccount: (account: Account) => void;
  removeAccount: (address: string) => void;
}

export function useAccounts(): UseAccountsReturn {
  const [state, dispatch] = useReducer(accountsReducer, initialState);

  const activeAccount =
    state.accounts.find((a) => a.address === state.activeAddress) ?? null;

  const switchAccount = useCallback((address: string) => {
    dispatch({ type: "SET_ACTIVE", address });
  }, []);

  const addAccount = useCallback((account: Account) => {
    dispatch({ type: "ADD_ACCOUNT", account });
  }, []);

  const removeAccount = useCallback((address: string) => {
    dispatch({ type: "REMOVE_ACCOUNT", address });
  }, []);

  return {
    ...state,
    activeAccount,
    switchAccount,
    addAccount,
    removeAccount,
  };
}
