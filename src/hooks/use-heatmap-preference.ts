"use client";

import { useState, useCallback } from "react";

/**
 * Hook for persisting the calendar heatmap toggle preference to localStorage.
 * Follows the same pattern as `useViewMode` in browse-toolbar.tsx.
 */
export function useHeatmapPreference(storageKey = "calendar-heatmap-enabled") {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "true" || saved === "false") {
        return saved === "true";
      }
    } catch {
      // localStorage may be unavailable (e.g., private browsing, Safari)
    }
    return false; // Default: heatmap off
  });

  const toggle = useCallback(
    (value: boolean) => {
      setEnabled(value);
      try {
        localStorage.setItem(storageKey, String(value));
      } catch {
        // Ignore localStorage errors
      }
    },
    [storageKey]
  );

  return { enabled, toggle };
}