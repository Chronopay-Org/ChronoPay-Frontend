import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHeatmapPreference } from "@/hooks/use-heatmap-preference";

describe("useHeatmapPreference", () => {
  const storageKey = "test-calendar-heatmap-enabled";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns default value (false) when localStorage is empty", () => {
    const { result } = renderHook(() => useHeatmapPreference(storageKey));

    expect(result.current.enabled).toBe(false);
  });

  it("reads saved value from localStorage on initial render", () => {
    localStorage.setItem(storageKey, "true");

    const { result } = renderHook(() => useHeatmapPreference(storageKey));

    expect(result.current.enabled).toBe(true);
  });

  it("returns false for invalid localStorage value", () => {
    localStorage.setItem(storageKey, "invalid");

    const { result } = renderHook(() => useHeatmapPreference(storageKey));

    expect(result.current.enabled).toBe(false);
  });

  it("toggles value and persists to localStorage", () => {
    const { result } = renderHook(() => useHeatmapPreference(storageKey));

    act(() => {
      result.current.toggle(true);
    });

    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem(storageKey)).toBe("true");
  });

  it("toggles back to false and persists", () => {
    localStorage.setItem(storageKey, "true");
    const { result } = renderHook(() => useHeatmapPreference(storageKey));

    act(() => {
      result.current.toggle(false);
    });

    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem(storageKey)).toBe("false");
  });

  it("handles localStorage unavailable gracefully", () => {
    const originalLocalStorage = global.localStorage;
    // @ts-expect-error - deliberately removing localStorage
    delete global.localStorage;

    const { result } = renderHook(() => useHeatmapPreference(storageKey));

    expect(result.current.enabled).toBe(false);

    act(() => {
      result.current.toggle(true);
    });

    expect(result.current.enabled).toBe(true);

    global.localStorage = originalLocalStorage;
  });

  it("uses custom storage key", () => {
    const customKey = "custom-heatmap-key";
    localStorage.setItem(customKey, "true");

    const { result } = renderHook(() => useHeatmapPreference(customKey));

    expect(result.current.enabled).toBe(true);
  });
});