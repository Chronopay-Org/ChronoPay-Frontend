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

import { useState, useCallback, useMemo } from "react";
import { readStoredValue, useStoredState } from "@/hooks/use-stored-state";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export interface RecentSearchItem {
  term: string;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const STORAGE_KEY = STORAGE_KEYS.recentSearches.key;
export const MAX_RECENTS = 6;

/** Schema version for persisted recents (see STORAGE_KEYS.recentSearches). */
const RECENTS_VERSION = STORAGE_KEYS.recentSearches.version;

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

// ─── Fuzzy matching helpers (did-you-mean) ────────────────────────────────────

/**
 * Computes the Levenshtein distance between two strings.
 * Used to find typo-tolerant suggestions for the did-you-mean feature.
 */
export function levenshteinDistance(a: string, b: string): number {
  const alen = a.length;
  const blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;

  // Use two-row optimisation for O(n) space
  let prev = new Array<number>(blen + 1);
  let curr = new Array<number>(blen + 1);

  for (let j = 0; j <= blen; j++) prev[j] = j;

  for (let i = 1; i <= alen; i++) {
    curr[0] = i;
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // deletion
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[blen];
}

/**
 * Returns the maximum allowed Levenshtein distance for a "close match"
 * given the length of the query. Shorter strings get a tighter threshold.
 */
function didYouMeanThreshold(queryLength: number): number {
  if (queryLength <= 3) return 1;
  if (queryLength <= 6) return 2;
  return Math.min(3, Math.floor(queryLength / 4));
}

/**
 * Finds the closest suggestion from the known catalogue that is within
 * a typo-tolerant threshold of the given query. Returns `null` when no
 * suggestion is close enough, or when the query already has exact matches.
 */
export function findDidYouMean(
  query: string,
  suggestions: string[],
  catalogue: string[],
): string | null {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return null;

  // If there are already exact/prefix matches, no need for a correction
  if (suggestions.length > 0) return null;

  const threshold = didYouMeanThreshold(trimmed.length);
  let best: string | null = null;
  let bestDistance = Infinity;

  for (const term of catalogue) {
    const d = levenshteinDistance(trimmed, term.toLowerCase());
    if (d < bestDistance && d <= threshold) {
      bestDistance = d;
      best = term;
    }
  }

  return best;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isRecentSearchItem(item: unknown): item is RecentSearchItem {
  if (typeof item !== "object" || item === null) return false;
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.term === "string" &&
    candidate.term.trim().length > 0 &&
    typeof candidate.timestamp === "number" &&
    Number.isFinite(candidate.timestamp)
  );
}

/**
 * Normalizes a decoded recents payload: maps legacy plain strings to
 * timestamp 0, drops invalid/blank entries, dedupes case-insensitively
 * (keeping the newest), and caps the list at MAX_RECENTS. Returns
 * `undefined` when the payload is not an array.
 */
function normalizeRecents(parsed: unknown): RecentSearchItem[] | undefined {
  if (!Array.isArray(parsed)) return undefined;

  const deduped = new Map<string, RecentSearchItem>();

  for (const item of parsed) {
    let normalized: RecentSearchItem | null = null;

    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed.length > 0) {
        normalized = { term: trimmed, timestamp: 0 };
      }
    } else if (isRecentSearchItem(item)) {
      normalized = { term: item.term.trim(), timestamp: item.timestamp };
    }

    if (!normalized) continue;

    const key = normalized.term.toLowerCase();
    const existing = deduped.get(key);
    if (!existing || normalized.timestamp > existing.timestamp) {
      deduped.set(key, normalized);
    }
  }

  return Array.from(deduped.values()).slice(0, MAX_RECENTS);
}

/**
 * Decodes a raw stored string into recents. Used for both the current
 * envelope payload (`parse`) and legacy un-enveloped values (`migrate`), so
 * pre-versioning recents — including string arrays — still load.
 */
function decodeRecents(raw: string): RecentSearchItem[] | undefined {
  try {
    return normalizeRecents(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export function loadRecents(): RecentSearchItem[] {
  return (
    readStoredValue<RecentSearchItem[]>(STORAGE_KEY, {
      version: RECENTS_VERSION,
      parse: decodeRecents,
      migrate: decodeRecents,
    }) ?? []
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  recentSearches: RecentSearchItem[];
  suggestions: string[];
  /** The closest typo-tolerant suggestion, or null when the query already matches or nothing is close enough. */
  didYouMeanSuggestion: string | null;
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (term: string) => void;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  // Recents are backed by `useStoredState` under the registry key
  // `STORAGE_KEYS.recentSearches`, stored as a version envelope. Legacy
  // un-enveloped arrays are upgraded on read via `migrate`.
  const { value: recentSearches, setValue: setRecentSearches } =
    useStoredState<RecentSearchItem[]>(STORAGE_KEY, {
      defaultValue: [],
      version: RECENTS_VERSION,
      parse: decodeRecents,
      migrate: decodeRecents,
    });

  // Derive suggestions from the static catalogue, filtered by current query
  const suggestions =
    query.trim().length === 0
      ? []
      : SEARCH_SUGGESTIONS.filter((s) =>
          s.toLowerCase().includes(query.trim().toLowerCase()),
        );

  // Derive did-you-mean suggestion (only when exact suggestions are empty)
  const didYouMeanSuggestion = useMemo(
    () => findDidYouMean(query, suggestions, SEARCH_SUGGESTIONS),
    [query, suggestions],
  );

  const addRecentSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setRecentSearches((prev) => {
        // Move to front if already present, otherwise prepend
        const filtered = prev.filter(
          (r) => r.term.toLowerCase() !== trimmed.toLowerCase(),
        );
        return [{ term: trimmed, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENTS);
      });
    },
    [setRecentSearches],
  );

  const removeRecentSearch = useCallback(
    (term: string) => {
      setRecentSearches((prev) =>
        prev.filter((r) => r.term.toLowerCase() !== term.toLowerCase()),
      );
    },
    [setRecentSearches],
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  return {
    query,
    setQuery,
    recentSearches,
    suggestions,
    didYouMeanSuggestion,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}
