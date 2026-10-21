import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useFacetCounts } from "./use-facet-counts";

describe("useFacetCounts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Basic updates ─────────────────────────────────────────────────────────

  it("starts with empty counts and no announcement", () => {
    const { result } = renderHook(() => useFacetCounts());
    expect(result.current.counts).toEqual({});
    expect(result.current.announcement).toBe("");
  });

  it("updates counts after the debounce delay", () => {
    const { result } = renderHook(() => useFacetCounts({ debounceMs: 150 }));

    act(() => {
      result.current.updateCounts({ cat: 12 });
    });

    // Counts should still be empty before debounce
    expect(result.current.counts).toEqual({});

    // Advance past the debounce
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.counts).toEqual({ cat: 12 });
  });

  it("debounces rapid successive updates", () => {
    const { result } = renderHook(() => useFacetCounts({ debounceMs: 100 }));

    act(() => {
      result.current.updateCounts({ a: 1 });
      result.current.updateCounts({ a: 2 });
      result.current.updateCounts({ a: 3 });
    });

    // Advance by the debounce interval — only the last value should win
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.counts).toEqual({ a: 3 });
  });

  // ── Announcements ─────────────────────────────────────────────────────────

  it("does not announce small changes (≤10 delta)", () => {
    const { result } = renderHook(() => useFacetCounts({ debounceMs: 50 }));

    // Establish a baseline first (delta of 25 from 0 → triggers announcement, but that's fine)
    act(() => {
      result.current.updateCounts({ cat: 25 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Clear the baseline announcement
    act(() => {
      result.current.clearAnnouncement();
    });

    // Now make a small change: 25 → 28 (delta = 3, ≤ 10)
    act(() => {
      result.current.updateCounts({ cat: 28 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Delta is 3, which is ≤10 — no announcement
    expect(result.current.announcement).toBe("");
  });

  it("announces large changes (>10 delta)", () => {
    const { result } = renderHook(() => useFacetCounts({ debounceMs: 50 }));

    // First update establishes the baseline
    act(() => {
      result.current.updateCounts({ cat: 10 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Second update with large delta
    act(() => {
      result.current.updateCounts({ cat: 50 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.announcement).toContain("Filter counts updated");
    expect(result.current.announcement).toContain("cat: 50");
  });

  it("auto-clears the announcement after 4 seconds", () => {
    const { result } = renderHook(() => useFacetCounts({ debounceMs: 50 }));

    // Establish baseline
    act(() => {
      result.current.updateCounts({ a: 5 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Trigger announcement
    act(() => {
      result.current.updateCounts({ a: 30 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.announcement).not.toBe("");

    // Advance past the 4s auto-clear
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.announcement).toBe("");
  });

  it("limits announcements to at most 3 changed facet IDs", () => {
    const { result } = renderHook(() => useFacetCounts({ debounceMs: 50 }));

    // Establish baselines
    act(() => {
      result.current.updateCounts({ a: 5, b: 5, c: 5, d: 5 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Change all four by large amounts
    act(() => {
      result.current.updateCounts({ a: 50, b: 50, c: 50, d: 50 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // With 4 changed IDs (over the 3 limit), no announcement is produced
    expect(result.current.announcement).toBe("");
  });

  // ── clearAnnouncement ─────────────────────────────────────────────────────

  it("clearAnnouncement resets the announcement and cancels auto-clear", () => {
    const { result } = renderHook(() => useFacetCounts({ debounceMs: 50 }));

    // Establish baseline + trigger announcement
    act(() => {
      result.current.updateCounts({ x: 3 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      result.current.updateCounts({ x: 25 });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.announcement).not.toBe("");

    // Clear manually
    act(() => {
      result.current.clearAnnouncement();
    });
    expect(result.current.announcement).toBe("");

    // Even after 4s, it should stay cleared (timer was cancelled)
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.announcement).toBe("");
  });
});
