"use client";

import { useState, useCallback } from "react";

/**
 * Hook for managing the first-run onboarding tour state.
 * Persists completion status to localStorage so the tour only shows once per user.
 */
export function useOnboardingTour(storageKey = "onboarding-tour-completed") {
  const [tourOpen, setTourOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      // Show tour if not explicitly marked as completed
      return saved !== "true";
    } catch {
      // localStorage may be unavailable (e.g., private browsing)
      return true;
    }
  });

  const completeTour = useCallback(() => {
    setTourOpen(false);
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  const resetTour = useCallback(() => {
    setTourOpen(true);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  return { tourOpen, completeTour, resetTour };
}
