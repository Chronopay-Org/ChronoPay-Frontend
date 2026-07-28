/**
 * useOnboardingSamples tests
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useOnboardingSamples, __resetOnboardingSamplesStoreForTests } from "@/hooks/use-onboarding-samples";
import {
  SAMPLES_CLEARED_STORAGE_KEY,
  TOUR_DISMISSED_STORAGE_KEY,
} from "@/components/dashboard/dashboard-data";

describe("useOnboardingSamples", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetOnboardingSamplesStoreForTests();
  });

  afterEach(() => {
    window.localStorage.clear();
    __resetOnboardingSamplesStoreForTests();
    vi.restoreAllMocks();
  });

  it("starts the tour when samples have not been cleared", () => {
    const { result } = renderHook(() => useOnboardingSamples());
    expect(result.current.ready).toBe(true);
    expect(result.current.showSamples).toBe(true);
    expect(result.current.showTour).toBe(true);
    expect(result.current.showClearBanner).toBe(false);
  });

  it("hides samples after clearSamples", () => {
    const { result } = renderHook(() => useOnboardingSamples());
    act(() => {
      result.current.clearSamples();
    });
    expect(result.current.showSamples).toBe(false);
    expect(result.current.showTour).toBe(false);
    expect(window.localStorage.getItem(SAMPLES_CLEARED_STORAGE_KEY)).toBe("1");
    expect(window.localStorage.getItem(TOUR_DISMISSED_STORAGE_KEY)).toBe("1");
  });

  it("keeps samples and shows the clear banner after dismissTour", () => {
    const { result } = renderHook(() => useOnboardingSamples());
    act(() => {
      result.current.dismissTour();
    });
    expect(result.current.showSamples).toBe(true);
    expect(result.current.showTour).toBe(false);
    expect(result.current.showClearBanner).toBe(true);
  });

  it("restores cleared state from localStorage", () => {
    window.localStorage.setItem(SAMPLES_CLEARED_STORAGE_KEY, "1");
    window.localStorage.setItem(TOUR_DISMISSED_STORAGE_KEY, "1");
    const { result } = renderHook(() => useOnboardingSamples());
    expect(result.current.showSamples).toBe(false);
    expect(result.current.showTour).toBe(false);
  });

  it("survives localStorage write failures", () => {
    const { result } = renderHook(() => useOnboardingSamples());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    act(() => {
      result.current.clearSamples();
    });
    expect(result.current.showSamples).toBe(false);
  });

  it("survives localStorage read failures", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useOnboardingSamples());
    expect(result.current.showSamples).toBe(true);
    expect(result.current.showTour).toBe(true);
  });
});
