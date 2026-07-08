"use client";

/**
 * useSearch — search state management for the ChronoPay header search affordance.
 *
 * Provides:
 *   - query: current input value
 *   - setQuery: setter for input value
 *   - recentSearches: up to MAX_RECENTS entries persisted in localStorage
 *   - suggestions: filtered suggestion list based on current query
 *   - addRecentSearch: push a new term into the recents list
 *   - clearRecentSearches: wipe the recents list
 *   - removeRecentSearch: remove a single entry from the recents list
 */

import { useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "chronopay:recent-searches";
const MAX_RECENTS = 6;

/**
 * Static suggestion catalogue — represents searchable entities in ChronoPay.
 * In a real implementation these would come from an API or search index.
 */
export const SEARCH_SUGGESTIONS: string[] = [
  "Marketplace",
  "Calendar",
  "History",
  "Wallet",
  "Time Tokens",
  "Active Bookings",
  "Pending Escrow",
  "Available Slots",
  "Buy Time",
  "Sell Time",
  "Schedule Session",
  "Transaction History",
  "Stellar Network",
  "Token Balance",
  "Booking Progress",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadRecents(): string[] {
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

function saveRecents(recents: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
  } catch {
    // localStorage may be unavailable (private browsing quota, etc.)
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  recentSearches: string[];
  suggestions: string[];
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (term: string) => void;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  // Lazy initializer reads from localStorage once on mount (avoids useEffect setState)
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecents);

  // Derive suggestions from the static catalogue, filtered by current query
  const suggestions =
    query.trim().length === 0
      ? []
      : SEARCH_SUGGESTIONS.filter((s) =>
          s.toLowerCase().includes(query.trim().toLowerCase()),
        );

  const addRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      // Move to front if already present, otherwise prepend
      const filtered = prev.filter(
        (r) => r.toLowerCase() !== trimmed.toLowerCase(),
      );
      const next = [trimmed, ...filtered].slice(0, MAX_RECENTS);
      saveRecents(next);
      return next;
    });
  }, []);

  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter(
        (r) => r.toLowerCase() !== term.toLowerCase(),
      );
      saveRecents(next);
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveRecents([]);
  }, []);

  return {
    query,
    setQuery,
    recentSearches,
    suggestions,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}
