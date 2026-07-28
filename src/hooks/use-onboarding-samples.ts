"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  SAMPLES_CLEARED_STORAGE_KEY,
  TOUR_DISMISSED_STORAGE_KEY,
} from "@/components/dashboard/dashboard-data";

export type OnboardingSamplesState = {
  /** Client store is always ready after the first snapshot read. */
  ready: boolean;
  /** Sample rows are still visible on the dashboard. */
  showSamples: boolean;
  /** Guided tour should mount (samples present and tour not dismissed). */
  showTour: boolean;
  /** Persistent clear banner when samples remain but tour was skipped/finished. */
  showClearBanner: boolean;
  clearSamples: () => void;
  dismissTour: () => void;
};

type OnboardingSnapshot = {
  samplesCleared: boolean;
  tourDismissed: boolean;
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean) {
  try {
    if (value) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore quota / private-mode failures; in-memory snapshot still updates.
  }
}

const serverSnapshot: OnboardingSnapshot = {
  samplesCleared: false,
  tourDismissed: false,
};

let clientSnapshot: OnboardingSnapshot = serverSnapshot;
let hydrated = false;

function hydrateFromStorage() {
  if (hydrated || typeof window === "undefined") return;
  clientSnapshot = {
    samplesCleared: readFlag(SAMPLES_CLEARED_STORAGE_KEY),
    tourDismissed: readFlag(TOUR_DISMISSED_STORAGE_KEY),
  };
  hydrated = true;
}

function subscribe(listener: () => void) {
  hydrateFromStorage();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getClientSnapshot() {
  hydrateFromStorage();
  return clientSnapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function setSnapshot(next: OnboardingSnapshot) {
  clientSnapshot = next;
  hydrated = true;
  emit();
}

/** Test-only helper to reset module state between cases. */
export function __resetOnboardingSamplesStoreForTests() {
  clientSnapshot = serverSnapshot;
  hydrated = false;
  listeners.clear();
}

/**
 * Persists onboarding sample visibility and tour dismissal in localStorage.
 */
export function useOnboardingSamples(): OnboardingSamplesState {
  const snapshot = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const clearSamples = useCallback(() => {
    writeFlag(SAMPLES_CLEARED_STORAGE_KEY, true);
    writeFlag(TOUR_DISMISSED_STORAGE_KEY, true);
    setSnapshot({ samplesCleared: true, tourDismissed: true });
  }, []);

  const dismissTour = useCallback(() => {
    writeFlag(TOUR_DISMISSED_STORAGE_KEY, true);
    setSnapshot({
      samplesCleared: clientSnapshot.samplesCleared,
      tourDismissed: true,
    });
  }, []);

  const showSamples = !snapshot.samplesCleared;
  const showTour = showSamples && !snapshot.tourDismissed;
  const showClearBanner = showSamples && snapshot.tourDismissed;

  return {
    ready: true,
    showSamples,
    showTour,
    showClearBanner,
    clearSamples,
    dismissTour,
  };
}
