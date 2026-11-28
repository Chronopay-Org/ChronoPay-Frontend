"use client";

import { useCallback } from "react";
import { useStoredState } from "@/hooks/use-stored-state";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * Hook for persisting the calendar heatmap toggle preference to localStorage.
 * Backed by `useStoredState` under the registry key
 * `STORAGE_KEYS.heatmapPreference` (a custom key may be passed instead).
 * The value is stored as the plain strings "true" / "false" for backwards
 * compatibility with the pre-registry format.
 */

function parseHeatmapPreference(raw: string): boolean | undefined {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

function serializeHeatmapPreference(value: boolean): string {
  return value ? "true" : "false";
}

export function useHeatmapPreference(
  storageKey = STORAGE_KEYS.heatmapPreference.key,
) {
  const { value: enabled, setValue } = useStoredState<boolean>(storageKey, {
    defaultValue: false,
    parse: parseHeatmapPreference,
    serialize: serializeHeatmapPreference,
  });

  const toggle = useCallback(
    (value: boolean) => {
      setValue(value);
    },
    [setValue],
  );

  return { enabled, toggle };
}
