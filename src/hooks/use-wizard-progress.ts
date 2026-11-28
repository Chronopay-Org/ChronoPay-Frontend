"use client";

import { useCallback, useState } from "react";
import { readStoredValue, useStoredState } from "@/hooks/use-stored-state";
import { STORAGE_KEYS } from "@/lib/storage-keys";

type WizardProgressState = {
  currentIndex: number;
  furthestIndex: number;
  skippedIds: string[];
};

/** Schema version for persisted wizard progress (see STORAGE_KEYS.wizardProgress). */
const WIZARD_PROGRESS_VERSION = STORAGE_KEYS.wizardProgress.version;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function defaultWizardState(): WizardProgressState {
  return { currentIndex: 0, furthestIndex: 0, skippedIds: [] };
}

/**
 * Validates and clamps a decoded wizard payload. Returns `undefined` when the
 * payload is not a usable state object so callers fall back to the default.
 */
function normalizeWizardState(
  parsed: unknown,
  stepCount: number,
): WizardProgressState | undefined {
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const candidate = parsed as Partial<WizardProgressState>;
  const maxIndex = Math.max(stepCount - 1, 0);
  const currentIndex = clamp(
    typeof candidate.currentIndex === "number" ? candidate.currentIndex : 0,
    0,
    maxIndex,
  );
  const furthestIndex = clamp(
    typeof candidate.furthestIndex === "number"
      ? candidate.furthestIndex
      : currentIndex,
    currentIndex,
    maxIndex,
  );
  const skippedIds = Array.isArray(candidate.skippedIds)
    ? candidate.skippedIds
    : [];
  return { currentIndex, furthestIndex, skippedIds };
}

/**
 * Decodes a raw stored string into wizard state. Used for both the current
 * envelope payload (`parse`) and legacy un-enveloped values (`migrate`), so
 * pre-versioning progress written as plain JSON still loads.
 */
function decodeWizardState(
  raw: string,
  stepCount: number,
): WizardProgressState | undefined {
  try {
    return normalizeWizardState(JSON.parse(raw), stepCount);
  } catch {
    return undefined;
  }
}

/**
 * Persists supplier onboarding wizard progress (current step, furthest step
 * reached, and skipped optional steps) to sessionStorage, keyed per browser
 * tab session. Backed by `useStoredState` under the registry entry
 * `STORAGE_KEYS.wizardProgress`; values are stored as a version envelope and
 * legacy un-enveloped progress is upgraded on read.
 */
export function useWizardProgress(storageKey: string, stepCount: number) {
  const parse = useCallback(
    (raw: string) => decodeWizardState(raw, stepCount),
    [stepCount],
  );
  const migrate = useCallback(
    (raw: string) => decodeWizardState(raw, stepCount),
    [stepCount],
  );

  const { value: state, setValue } = useStoredState<WizardProgressState>(
    storageKey,
    {
      area: "sessionStorage",
      defaultValue: defaultWizardState(),
      version: WIZARD_PROGRESS_VERSION,
      parse,
      migrate,
    },
  );

  // `resumed` reflects whether valid progress was found in storage at mount.
  // It is captured once so in-session navigation does not flip it.
  const [resumed, setResumed] = useState<boolean>(
    () =>
      readStoredValue<WizardProgressState>(storageKey, {
        area: "sessionStorage",
        version: WIZARD_PROGRESS_VERSION,
        parse,
        migrate,
      }) !== undefined,
  );

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = clamp(index, 0, Math.max(stepCount - 1, 0));
      setValue((prev) => ({
        ...prev,
        currentIndex: clamped,
        furthestIndex: Math.max(prev.furthestIndex, clamped),
      }));
    },
    [setValue, stepCount],
  );

  const goNext = useCallback(() => {
    goToIndex(state.currentIndex + 1);
  }, [goToIndex, state.currentIndex]);

  const goBack = useCallback(() => {
    goToIndex(state.currentIndex - 1);
  }, [goToIndex, state.currentIndex]);

  const toggleSkip = useCallback(
    (stepId: string, skipped: boolean) => {
      setValue((prev) => {
        const nextSkipped = skipped
          ? Array.from(new Set([...prev.skippedIds, stepId]))
          : prev.skippedIds.filter((id) => id !== stepId);
        return { ...prev, skippedIds: nextSkipped };
      });
    },
    [setValue],
  );

  const reset = useCallback(() => {
    setResumed(false);
    setValue(defaultWizardState());
  }, [setValue]);

  return {
    currentIndex: state.currentIndex,
    furthestIndex: state.furthestIndex,
    skippedIds: state.skippedIds,
    resumed,
    goToIndex,
    goNext,
    goBack,
    toggleSkip,
    reset,
  };
}
