import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useTheme,
  readPersistedTheme,
  THEME_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
} from "./use-theme";

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
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

  it("cycles through auto -> light -> dark -> auto", () => {
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
    expect(result.current.mode).toBe("auto");
  });

  it("migrates legacy chronopay-theme key to chronopay:theme", () => {
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, "light");

    expect(readPersistedTheme()).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
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

  it("synchronizes across multiple hook instances", () => {
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
  });
});
