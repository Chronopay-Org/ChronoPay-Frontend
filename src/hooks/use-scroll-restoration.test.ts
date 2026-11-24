import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollRestoration } from "./use-scroll-restoration";

const listId = "supplier-1";
const itemId = "slot-1";
const storageKey = `scroll-restoration-${listId}`;
const now = new Date("2026-11-23T12:00:00.000Z");

function createSessionStorageMock() {
  const entries = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => entries.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      entries.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      entries.delete(key);
    }),
    clear: vi.fn(() => entries.clear()),
  };
}

describe("useScrollRestoration", () => {
  let sessionStorageMock: ReturnType<typeof createSessionStorageMock>;
  let animationFrames: FrameRequestCallback[];
  let requestAnimationFrameMock: ReturnType<typeof vi.fn>;
  let scrollIntoViewMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorageMock = createSessionStorageMock();
    vi.stubGlobal("sessionStorage", sessionStorageMock);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    animationFrames = [];
    requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);

    const item = document.createElement("div");
    item.id = `list-item-${itemId}`;
    scrollIntoViewMock = vi.fn();
    Object.defineProperty(item, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    });
    document.body.append(item);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function storeViewedItem(timestamp: number) {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ listId, itemId, timestamp }),
    );
  }

  function flushAnimationFrame() {
    const callback = animationFrames.shift();
    expect(callback).toBeDefined();
    act(() => callback?.(0));
  }

  it("restores a recently viewed item and clears its highlight after three seconds", () => {
    storeViewedItem(now.getTime() - 3_599_999);

    const { result } = renderHook(() => useScrollRestoration(listId));

    expect(result.current.restoredItemId).toBeNull();
    expect(requestAnimationFrameMock).toHaveBeenCalledOnce();

    flushAnimationFrame();

    expect(result.current.restoredItemId).toBe(itemId);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "instant",
      block: "center",
    });

    act(() => {
      vi.advanceTimersByTime(2_999);
    });
    expect(result.current.restoredItemId).toBe(itemId);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.restoredItemId).toBeNull();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
  });

  it("ignores an item older than one hour", () => {
    storeViewedItem(now.getTime() - 3_600_001);

    const { result } = renderHook(() => useScrollRestoration(listId));

    expect(result.current.restoredItemId).toBeNull();
    expect(requestAnimationFrameMock).not.toHaveBeenCalled();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(storageKey)).not.toBeNull();
  });

  it("does not throw when saving to session storage fails", () => {
    const error = new Error("storage blocked");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorageMock.setItem.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useScrollRestoration(listId));

    expect(() => {
      act(() => result.current.markItemAsViewed(itemId));
    }).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to save scroll restoration",
      error,
    );
  });

  it("does not throw when resetting session storage fails", () => {
    const error = new Error("storage blocked");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorageMock.removeItem.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useScrollRestoration(listId));

    expect(() => {
      act(() => result.current.resetScrollRestoration());
    }).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to reset scroll restoration",
      error,
    );
  });

  it("clears the restoration timer when unmounted", () => {
    storeViewedItem(now.getTime());
    const removeItem = sessionStorageMock.removeItem;
    const { result, unmount } = renderHook(() => useScrollRestoration(listId));

    flushAnimationFrame();
    expect(result.current.restoredItemId).toBe(itemId);

    unmount();
    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(removeItem).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(storageKey)).not.toBeNull();
  });

  it("handles session storage removal failures when the highlight expires", () => {
    storeViewedItem(now.getTime());
    const error = new Error("storage blocked");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorageMock.removeItem.mockImplementation(() => {
      throw error;
    });

    renderHook(() => useScrollRestoration(listId));
    flushAnimationFrame();

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(3_000);
      });
    }).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to clear scroll restoration",
      error,
    );
  });
});
