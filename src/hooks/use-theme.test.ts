import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useTheme,
  readPersistedTheme,
  resolveTheme,
  getServerSnapshot,
  THEME_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
} from "./use-theme";

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("defaults to auto when no theme is persisted", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe("auto");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("persists theme selection to localStorage and sets data-theme on documentElement", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.changeTheme("light");
    });

    expect(result.current.mode).toBe("light");
    expect(result.current.resolved).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => {
      result.current.changeTheme("dark");
    });

    expect(result.current.mode).toBe("dark");
    expect(result.current.resolved).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("cycles through auto -> light -> dark -> scheduled -> auto", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe("auto");

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.mode).toBe("light");

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.mode).toBe("dark");

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.mode).toBe("scheduled");

    act(() => {
      result.current.cycleTheme();
    });
    expect(result.current.mode).toBe("auto");
  });

  it("migrates legacy chronopay-theme key to chronopay:theme", () => {
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, "light");

    expect(readPersistedTheme()).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)).toBeNull();
  });

  it("does not overwrite existing chronopay:theme when migrating legacy key", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, "light");

    expect(readPersistedTheme()).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)).toBeNull();
  });

  it("resolves auto mode dynamically according to prefers-color-scheme matchMedia", () => {
    let changeHandler: (() => void) | null = null;
    let matchesLight = false;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query === "(prefers-color-scheme: light)" ? matchesLight : false;
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "change") changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe("auto");
    expect(result.current.resolved).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Simulate OS switching to light mode
    matchesLight = true;
    act(() => {
      changeHandler?.();
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("synchronizes across multiple hook instances and reacts to storage events", () => {
    const { result: hook1 } = renderHook(() => useTheme());
    const { result: hook2 } = renderHook(() => useTheme());

    expect(hook1.current.mode).toBe("auto");
    expect(hook2.current.mode).toBe("auto");

    act(() => {
      hook1.current.changeTheme("light");
    });

    expect(hook1.current.mode).toBe("light");
    expect(hook2.current.mode).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => {
      window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
      window.dispatchEvent(
        new StorageEvent("storage", { key: THEME_STORAGE_KEY })
      );
      window.dispatchEvent(
        new StorageEvent("storage", { key: LEGACY_THEME_STORAGE_KEY })
      );
      window.dispatchEvent(new StorageEvent("storage", { key: "other-key" }));
    });

    expect(hook1.current.mode).toBe("dark");
    expect(hook2.current.mode).toBe("dark");
  });

  it("supports scheduled mode and switches theme at boundary times", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 17, 59, 0));

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.changeTheme("scheduled");
    });

    expect(result.current.mode).toBe("scheduled");
    expect(result.current.scheduleConfig.type).toBe("custom");
    expect(result.current.resolved).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Advance 1 minute to 18:00 boundary (dark time)
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Update custom schedule so 18:00 is within light hours
    act(() => {
      result.current.updateScheduleConfig({
        lightTime: "06:00",
        darkTime: "20:00",
      });
    });

    expect(result.current.resolved).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Switching out of scheduled mode resets schedule type to none
    act(() => {
      result.current.changeTheme("dark");
    });
    expect(result.current.scheduleConfig.type).toBe("none");
  });

  it("handles localStorage errors gracefully and resolves scheduled fallback", () => {
    expect(resolveTheme("scheduled")).toBeDefined();
    expect(getServerSnapshot()).toBe("auto");

    const getItemSpy = vi
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(() => {
        throw new Error("Storage blocked");
      });
    const setItemSpy = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage blocked");
      });

    expect(readPersistedTheme()).toBe("auto");

    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.changeTheme("light");
    });

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
