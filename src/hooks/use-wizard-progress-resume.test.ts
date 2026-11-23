import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWizardProgress } from "./use-wizard-progress";

describe("useWizardProgress (resume state)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns resumed: false on a fresh session with no stored data", () => {
    const { result } = renderHook(() => useWizardProgress("wizard-fresh", 3));

    expect(result.current.resumed).toBe(false);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.furthestIndex).toBe(0);
    expect(result.current.skippedIds).toEqual([]);
  });

  it("returns resumed: true when readState finds stored data in sessionStorage", () => {
    sessionStorage.setItem(
      "wizard-saved",
      JSON.stringify({
        currentIndex: 1,
        furthestIndex: 2,
        skippedIds: ["branding"],
      }),
    );

    const { result } = renderHook(() => useWizardProgress("wizard-saved", 3));

    expect(result.current.resumed).toBe(true);
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.furthestIndex).toBe(2);
    expect(result.current.skippedIds).toEqual(["branding"]);
  });

  it("keeps resumed: false during in-session navigation on a fresh session", () => {
    const { result } = renderHook(() => useWizardProgress("wizard-nav", 3));

    expect(result.current.resumed).toBe(false);

    act(() => {
      result.current.goNext();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.resumed).toBe(false);

    act(() => {
      result.current.toggleSkip("branding", true);
    });

    expect(result.current.skippedIds).toEqual(["branding"]);
    expect(result.current.resumed).toBe(false);
  });

  it("becomes resumed: true on a subsequent mount after progress was saved", () => {
    const first = renderHook(() => useWizardProgress("wizard-remount", 3));
    expect(first.result.current.resumed).toBe(false);

    act(() => {
      first.result.current.goNext();
    });
    first.unmount();

    const second = renderHook(() => useWizardProgress("wizard-remount", 3));
    expect(second.result.current.resumed).toBe(true);
    expect(second.result.current.currentIndex).toBe(1);
  });

  it("resets resumed to false when reset() is called", () => {
    sessionStorage.setItem(
      "wizard-reset",
      JSON.stringify({ currentIndex: 2, furthestIndex: 2, skippedIds: [] }),
    );

    const { result } = renderHook(() => useWizardProgress("wizard-reset", 3));
    expect(result.current.resumed).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.resumed).toBe(false);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.furthestIndex).toBe(0);
    expect(result.current.skippedIds).toEqual([]);
  });

  it("returns resumed: false when stored JSON is malformed or sessionStorage throws", () => {
    sessionStorage.setItem("wizard-corrupt", "{not-valid-json");

    const { result } = renderHook(() => useWizardProgress("wizard-corrupt", 3));
    expect(result.current.resumed).toBe(false);
    expect(result.current.currentIndex).toBe(0);
  });

  it("clamps out-of-range stored indices while still marking resumed: true", () => {
    sessionStorage.setItem(
      "wizard-clamp",
      JSON.stringify({ currentIndex: 99, furthestIndex: 99, skippedIds: "bad" }),
    );

    const { result } = renderHook(() => useWizardProgress("wizard-clamp", 3));
    expect(result.current.resumed).toBe(true);
    expect(result.current.currentIndex).toBe(2);
    expect(result.current.furthestIndex).toBe(2);
    expect(result.current.skippedIds).toEqual([]);
  });
});
