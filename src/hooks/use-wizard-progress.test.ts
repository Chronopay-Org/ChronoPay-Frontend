import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useWizardProgress } from "./use-wizard-progress";

const STORAGE_KEY = "test-wizard-progress";

describe("useWizardProgress", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("initializes with default state when sessionStorage is empty", () => {
    const { result } = renderHook(() => useWizardProgress(STORAGE_KEY, 4));

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.furthestIndex).toBe(0);
    expect(result.current.skippedIds).toEqual([]);
  });

  it("stops goNext at stepCount - 1 and stops goBack at 0", () => {
    const { result } = renderHook(() => useWizardProgress(STORAGE_KEY, 3));

    act(() => {
      result.current.goBack();
    });
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.furthestIndex).toBe(0);

    act(() => {
      result.current.goNext();
    });
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.furthestIndex).toBe(1);

    act(() => {
      result.current.goNext();
    });
    expect(result.current.currentIndex).toBe(2);
    expect(result.current.furthestIndex).toBe(2);

    act(() => {
      result.current.goNext();
    });
    expect(result.current.currentIndex).toBe(2);
    expect(result.current.furthestIndex).toBe(2);

    act(() => {
      result.current.goBack();
    });
    expect(result.current.currentIndex).toBe(1);

    act(() => {
      result.current.goBack();
    });
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.goBack();
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it("clamps goToIndex and ensures furthestIndex only increases", () => {
    const { result } = renderHook(() => useWizardProgress(STORAGE_KEY, 5));

    act(() => {
      result.current.goToIndex(3);
    });
    expect(result.current.currentIndex).toBe(3);
    expect(result.current.furthestIndex).toBe(3);

    act(() => {
      result.current.goToIndex(1);
    });
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.furthestIndex).toBe(3);

    act(() => {
      result.current.goToIndex(-10);
    });
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.furthestIndex).toBe(3);

    act(() => {
      result.current.goToIndex(99);
    });
    expect(result.current.currentIndex).toBe(4);
    expect(result.current.furthestIndex).toBe(4);
  });

  it("resumes valid state from sessionStorage", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentIndex: 1,
        furthestIndex: 3,
        skippedIds: ["payout", "branding"],
      }),
    );

    const { result } = renderHook(() => useWizardProgress(STORAGE_KEY, 4));

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.furthestIndex).toBe(3);
    expect(result.current.skippedIds).toEqual(["payout", "branding"]);
  });

  it("clamps pre-seeded out-of-range currentIndex and furthestIndex from sessionStorage", () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentIndex: 99,
        furthestIndex: 150,
        skippedIds: ["step-2"],
      }),
    );

    const { result: highResult } = renderHook(() =>
      useWizardProgress(STORAGE_KEY, 4),
    );
    expect(highResult.current.currentIndex).toBe(3);
    expect(highResult.current.furthestIndex).toBe(3);
    expect(highResult.current.skippedIds).toEqual(["step-2"]);

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentIndex: -5,
        furthestIndex: -10,
        skippedIds: [],
      }),
    );

    const { result: lowResult } = renderHook(() =>
      useWizardProgress(STORAGE_KEY, 4),
    );
    expect(lowResult.current.currentIndex).toBe(0);
    expect(lowResult.current.furthestIndex).toBe(0);

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentIndex: 2,
        furthestIndex: 0,
        skippedIds: "not-an-array",
      }),
    );

    const { result: invertedResult } = renderHook(() =>
      useWizardProgress(STORAGE_KEY, 4),
    );
    expect(invertedResult.current.currentIndex).toBe(2);
    expect(invertedResult.current.furthestIndex).toBe(2);
    expect(invertedResult.current.skippedIds).toEqual([]);
  });

  it("falls back to defaults on corrupt JSON in sessionStorage", () => {
    sessionStorage.setItem(STORAGE_KEY, "{not-valid-json");

    const { result } = renderHook(() => useWizardProgress(STORAGE_KEY, 4));

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.furthestIndex).toBe(0);
    expect(result.current.skippedIds).toEqual([]);
  });

  it("dedupes toggleSkip(id, true), removes on false, and persists to sessionStorage", () => {
    const { result } = renderHook(() => useWizardProgress(STORAGE_KEY, 4));

    act(() => {
      result.current.toggleSkip("optional-1", true);
    });
    expect(result.current.skippedIds).toEqual(["optional-1"]);

    act(() => {
      result.current.toggleSkip("optional-1", true);
    });
    expect(result.current.skippedIds).toEqual(["optional-1"]);

    act(() => {
      result.current.toggleSkip("optional-2", true);
    });
    expect(result.current.skippedIds).toEqual(["optional-1", "optional-2"]);

    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      currentIndex: 0,
      furthestIndex: 0,
      skippedIds: ["optional-1", "optional-2"],
    });

    act(() => {
      result.current.toggleSkip("optional-1", false);
    });
    expect(result.current.skippedIds).toEqual(["optional-2"]);
  });

  it("clears state and updates sessionStorage on reset", () => {
    const { result } = renderHook(() => useWizardProgress(STORAGE_KEY, 4));

    act(() => {
      result.current.goToIndex(2);
      result.current.toggleSkip("optional-1", true);
    });

    expect(result.current.currentIndex).toBe(2);
    expect(result.current.furthestIndex).toBe(2);
    expect(result.current.skippedIds).toEqual(["optional-1"]);

    act(() => {
      result.current.reset();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.furthestIndex).toBe(0);
    expect(result.current.skippedIds).toEqual([]);
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      currentIndex: 0,
      furthestIndex: 0,
      skippedIds: [],
    });
  });
});
