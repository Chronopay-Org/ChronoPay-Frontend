"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacetCountMap {
  [facetId: string]: number;
}

export interface UseFacetCountsOptions {
  /**
   * Debounce delay in ms before updating the displayed counts.
   * Helps avoid rapid flickering when the user adjusts filters quickly.
   * @default 150
   */
  debounceMs?: number;
}

export interface UseFacetCountsReturn {
  /** Current (debounced) facet counts keyed by facet option id. */
  counts: FacetCountMap;
  /**
   * Update the counts. Pass the latest raw counts; the hook debounces
   * before writing to `counts` state.
   */
  updateCounts: (next: FacetCountMap) => void;
  /**
   * Get a live announcement string suitable for a LiveRegion.
   * Returns `""` when there is nothing new to announce.
   */
  announcement: string;
  /**
   * Acknowledge the current announcement so it is cleared.
   * Call this after the LiveRegion has consumed it (e.g. after a timeout).
   */
  clearAnnouncement: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * `useFacetCounts` — manage debounced facet counts for marketplace filter
 * facets. Writes to state after a configurable debounce, and produces
 * polite screen-reader announcements when counts change significantly
 * (by more than 10).
 *
 * Timers are cleaned up on unmount to avoid stale state updates.
 *
 * @example
 * ```tsx
 * const { counts, updateCounts, announcement, clearAnnouncement } =
 *   useFacetCounts({ debounceMs: 200 });
 *
 * // In a useEffect when the raw facet data changes:
 * useEffect(() => {
 *   updateCounts(rawFacetCounts);
 * }, [rawFacetCounts]);
 * ```
 */
export function useFacetCounts({
  debounceMs = 150,
}: UseFacetCountsOptions = {}): UseFacetCountsReturn {
  const [counts, setCounts] = useState<FacetCountMap>({});
  const [announcement, setAnnouncement] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCountsRef = useRef<FacetCountMap>({});
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up pending timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    };
  }, []);

  const clearAnnouncement = useCallback(() => {
    setAnnouncement("");
    if (announceTimerRef.current) {
      clearTimeout(announceTimerRef.current);
      announceTimerRef.current = null;
    }
  }, []);

  const updateCounts = useCallback(
    (next: FacetCountMap) => {
      // Cancel any pending debounce
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setCounts(next);

        // Detect significant changes for screen reader announcement
        const prev = lastCountsRef.current;
        const changedIds: string[] = [];
        const allIds = new Set([...Object.keys(prev), ...Object.keys(next)]);

        for (const id of allIds) {
          const prevVal = prev[id] ?? 0;
          const nextVal = next[id] ?? 0;
          if (Math.abs(nextVal - prevVal) > 10) {
            changedIds.push(id);
          }
        }

        if (changedIds.length > 0 && changedIds.length <= 3) {
          const detail = changedIds
            .map((id) => `${id}: ${next[id] ?? 0}`)
            .join(", ");
          setAnnouncement(`Filter counts updated: ${detail}`);
          // Auto-clear after 4 seconds
          if (announceTimerRef.current) {
            clearTimeout(announceTimerRef.current);
          }
          announceTimerRef.current = setTimeout(() => {
            setAnnouncement("");
          }, 4000);
        }

        lastCountsRef.current = next;
      }, debounceMs);
    },
    [debounceMs],
  );

  return { counts, updateCounts, announcement, clearAnnouncement };
}
