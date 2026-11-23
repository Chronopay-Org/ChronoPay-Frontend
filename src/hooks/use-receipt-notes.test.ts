import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useReceiptNotes, searchReceiptNotes } from "./use-receipt-notes";

const STORAGE_PREFIX = "chronopay:receipt-notes:";

describe("useReceiptNotes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("loads existing notes from localStorage with initial status 'saved'", () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}rcpt-1`, "Initial note");

    const { result } = renderHook(() => useReceiptNotes("rcpt-1"));

    expect(result.current.text).toBe("Initial note");
    expect(result.current.saveStatus).toBe("saved");
  });

  it("marks status 'unsaved' immediately and transitions to 'saved' only after 1500 ms", () => {
    const { result } = renderHook(() => useReceiptNotes("rcpt-1"));

    act(() => {
      result.current.setText("Updated note");
    });

    expect(result.current.text).toBe("Updated note");
    expect(result.current.saveStatus).toBe("unsaved");
    expect(window.localStorage.getItem(`${STORAGE_PREFIX}rcpt-1`)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1499);
    });

    expect(result.current.saveStatus).toBe("unsaved");
    expect(window.localStorage.getItem(`${STORAGE_PREFIX}rcpt-1`)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.saveStatus).toBe("saved");
    expect(window.localStorage.getItem(`${STORAGE_PREFIX}rcpt-1`)).toBe("Updated note");
  });

  it("resets the debounce timer on rapid typing and persists only the latest value", () => {
    const setItemSpy = vi.spyOn(window.localStorage, "setItem");
    const { result } = renderHook(() => useReceiptNotes("rcpt-1"));

    act(() => {
      result.current.setText("First");
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      result.current.setText("Second");
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.saveStatus).toBe("unsaved");
    expect(setItemSpy).not.toHaveBeenCalled();

    act(() => {
      result.current.setText("Third");
    });

    act(() => {
      vi.advanceTimersByTime(1499);
    });

    expect(result.current.saveStatus).toBe("unsaved");
    expect(setItemSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.saveStatus).toBe("saved");
    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(`${STORAGE_PREFIX}rcpt-1`)).toBe("Third");
  });

  it("sets saveStatus to 'error' when localStorage.setItem throws", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderHook(() => useReceiptNotes("rcpt-1"));

    act(() => {
      result.current.setText("Will fail to save");
    });

    expect(result.current.saveStatus).toBe("unsaved");

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.saveStatus).toBe("error");
  });

  it("saves immediately on forceSave and cancels any pending debounce timer", () => {
    const setItemSpy = vi.spyOn(window.localStorage, "setItem");
    const { result } = renderHook(() => useReceiptNotes("rcpt-1"));

    act(() => {
      result.current.setText("Urgent note");
    });

    expect(result.current.saveStatus).toBe("unsaved");

    act(() => {
      result.current.forceSave();
    });

    expect(result.current.saveStatus).toBe("saved");
    expect(window.localStorage.getItem(`${STORAGE_PREFIX}rcpt-1`)).toBe("Urgent note");
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it("loads the other receipt's text when receiptId changes", () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}rcpt-1`, "First receipt note");
    window.localStorage.setItem(`${STORAGE_PREFIX}rcpt-2`, "Second receipt note");

    const { result, rerender } = renderHook(
      ({ receiptId }) => useReceiptNotes(receiptId),
      { initialProps: { receiptId: "rcpt-1" } },
    );

    expect(result.current.text).toBe("First receipt note");
    expect(result.current.saveStatus).toBe("saved");

    rerender({ receiptId: "rcpt-2" });

    expect(result.current.text).toBe("Second receipt note");
    expect(result.current.saveStatus).toBe("saved");

    rerender({ receiptId: "rcpt-3" });

    expect(result.current.text).toBe("");
    expect(result.current.saveStatus).toBe("saved");
  });

  it("clears pending autosave timer on unmount", () => {
    const setItemSpy = vi.spyOn(window.localStorage, "setItem");
    const { result, unmount } = renderHook(() => useReceiptNotes("rcpt-1"));

    act(() => {
      result.current.setText("Pending before unmount");
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(setItemSpy).not.toHaveBeenCalled();
  });
});

describe("searchReceiptNotes", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns [] for empty or whitespace-only queries", () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}rcpt-1`, "Important invoice");

    expect(searchReceiptNotes("")).toEqual([]);
    expect(searchReceiptNotes("   ")).toEqual([]);
    expect(searchReceiptNotes("\t\n")).toEqual([]);
  });

  it("matches notes case-insensitively and trims the query", () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}rcpt-1`, "Quarterly Consulting Fee");
    window.localStorage.setItem(`${STORAGE_PREFIX}rcpt-2`, "Office supplies");
    window.localStorage.setItem("unrelated:key", "Quarterly Consulting Fee");

    const results = searchReceiptNotes("  cOnSuLtInG  ");

    expect(results).toEqual([
      {
        receiptId: "rcpt-1",
        preview: "Quarterly Consulting Fee",
      },
    ]);
  });

  it("truncates previews longer than 80 characters with an ellipsis", () => {
    const exact80 = "a".repeat(80);
    const over80 = `${"b".repeat(80)}extra-text`;

    window.localStorage.setItem(`${STORAGE_PREFIX}rcpt-exact`, exact80);
    window.localStorage.setItem(`${STORAGE_PREFIX}rcpt-long`, over80);

    expect(searchReceiptNotes("aaa")).toEqual([
      {
        receiptId: "rcpt-exact",
        preview: exact80,
      },
    ]);

    expect(searchReceiptNotes("bbb")).toEqual([
      {
        receiptId: "rcpt-long",
        preview: `${"b".repeat(80)}…`,
      },
    ]);
  });
});
