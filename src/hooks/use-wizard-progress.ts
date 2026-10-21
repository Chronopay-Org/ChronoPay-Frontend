"use client";

import { useCallback, useState } from "react";

type WizardProgressState = {
  currentIndex: number;
  furthestIndex: number;
  skippedIds: string[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readState(storageKey: string, stepCount: number): WizardProgressState {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WizardProgressState>;
      const currentIndex = clamp(
        typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0,
        0,
        Math.max(stepCount - 1, 0),
      );
      const furthestIndex = clamp(
        typeof parsed.furthestIndex === "number" ? parsed.furthestIndex : currentIndex,
        currentIndex,
        Math.max(stepCount - 1, 0),
      );
      const skippedIds = Array.isArray(parsed.skippedIds) ? parsed.skippedIds : [];
      return { currentIndex, furthestIndex, skippedIds };
    }
  } catch {
    // sessionStorage may be unavailable (private browsing, storage disabled)
  }
  return { currentIndex: 0, furthestIndex: 0, skippedIds: [] };
}

/**
 * Persists supplier onboarding wizard progress (current step, furthest step
 * reached, and skipped optional steps) to sessionStorage, keyed per browser
 * tab session. Follows the try/catch storage pattern used by
 * `useHeatmapPreference` and `useScrollRestoration`.
 */
export function useWizardProgress(storageKey: string, stepCount: number) {
  const [state, setState] = useState<WizardProgressState>(() =>
    readState(storageKey, stepCount),
  );

  const persist = useCallback(
    (next: WizardProgressState) => {
      setState(next);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Ignore sessionStorage write errors
      }
    },
    [storageKey],
  );

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = clamp(index, 0, Math.max(stepCount - 1, 0));
      setState((prev) => {
        const next = {
          ...prev,
          currentIndex: clamped,
          furthestIndex: Math.max(prev.furthestIndex, clamped),
        };
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore sessionStorage write errors
        }
        return next;
      });
    },
    [stepCount, storageKey],
  );

  const goNext = useCallback(() => {
    goToIndex(state.currentIndex + 1);
  }, [goToIndex, state.currentIndex]);

  const goBack = useCallback(() => {
    goToIndex(state.currentIndex - 1);
  }, [goToIndex, state.currentIndex]);

  const toggleSkip = useCallback(
    (stepId: string, skipped: boolean) => {
      setState((prev) => {
        const nextSkipped = skipped
          ? Array.from(new Set([...prev.skippedIds, stepId]))
          : prev.skippedIds.filter((id) => id !== stepId);
        const next = { ...prev, skippedIds: nextSkipped };
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore sessionStorage write errors
        }
        return next;
      });
    },
    [storageKey],
  );

  const reset = useCallback(() => {
    persist({ currentIndex: 0, furthestIndex: 0, skippedIds: [] });
  }, [persist]);

  return {
    currentIndex: state.currentIndex,
    furthestIndex: state.furthestIndex,
    skippedIds: state.skippedIds,
    goToIndex,
    goNext,
    goBack,
    toggleSkip,
    reset,
  };
}
