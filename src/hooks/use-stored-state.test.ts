/**
 * useStoredState tests
 */

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStoredState } from "@/hooks/use-stored-state";

function clearCookies() {
  if (typeof document === "undefined") return;
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  }
}

describe("useStoredState", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearCookies();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearCookies();
  });

  describe("defaults, parsing, and serialization", () => {
    it("returns defaultValue when key is missing and sets hydrated to true after mount", () => {
      const { result } = renderHook(() =>
        useStoredState("missing-key", { defaultValue: { count: 0 } }),
      );

      expect(result.current.value).toEqual({ count: 0 });
      expect(result.current.hydrated).toBe(true);
    });

    it("falls back to defaultValue when stored JSON is corrupt", () => {
      window.localStorage.setItem("corrupt-key", "{not-valid-json");

      const { result } = renderHook(() =>
        useStoredState("corrupt-key", { defaultValue: "fallback" }),
      );

      expect(result.current.value).toBe("fallback");
    });

    it("falls back to defaultValue when custom parse returns undefined", () => {
      window.localStorage.setItem("validated-key", "invalid");

      const { result } = renderHook(() =>
        useStoredState<"a" | "b">("validated-key", {
          defaultValue: "a",
          parse: (raw) => (raw === "a" || raw === "b" ? raw : undefined),
        }),
      );

      expect(result.current.value).toBe("a");
    });

    it("supports custom parse and serialize", () => {
      const { result } = renderHook(() =>
        useStoredState("custom-key", {
          defaultValue: 0,
          parse: (raw) => {
            const parsed = Number.parseInt(raw, 10);
            return Number.isNaN(parsed) ? undefined : parsed;
          },
          serialize: (val) => `num:${val}`,
        }),
      );

      act(() => {
        result.current.setValue(42);
      });

      expect(window.localStorage.getItem("custom-key")).toBe("num:42");
      // parse expects integer, so reading "num:42" returns undefined -> defaultValue unless parse strips prefix
      expect(result.current.value).toBe(0);
    });

    it("round-trips with matching custom parse and serialize", () => {
      const { result } = renderHook(() =>
        useStoredState("custom-roundtrip", {
          defaultValue: 0,
          parse: (raw) => {
            if (!raw.startsWith("v1:")) return undefined;
            const n = Number(raw.slice(3));
            return Number.isFinite(n) ? n : undefined;
          },
          serialize: (val) => `v1:${val}`,
        }),
      );

      act(() => {
        result.current.setValue(7);
      });

      expect(window.localStorage.getItem("custom-roundtrip")).toBe("v1:7");
      expect(result.current.value).toBe(7);
    });

    it("returns defaultValue and hydrated=false during SSR", () => {
      window.localStorage.setItem("ssr-key", JSON.stringify("stored"));

      let ssrValue = "";
      let ssrHydrated = true;

      function Probe() {
        const state = useStoredState("ssr-key", { defaultValue: "default" });
        ssrValue = state.value;
        ssrHydrated = state.hydrated;
        return createElement("span", null, state.value);
      }

      const html = renderToString(createElement(Probe));
      expect(html).toContain("default");
      expect(ssrValue).toBe("default");
      expect(ssrHydrated).toBe(false);
    });
  });

  describe("localStorage and same-tab synchronization", () => {
    it("reads current snapshot in functional setValue and notifies two hooks sharing a key", () => {
      const hookA = renderHook(() =>
        useStoredState("shared-counter", { defaultValue: 0 }),
      );
      const hookB = renderHook(() =>
        useStoredState("shared-counter", { defaultValue: 0 }),
      );

      act(() => {
        hookA.result.current.setValue((prev) => prev + 1);
        hookA.result.current.setValue((prev) => prev + 2);
      });

      expect(hookA.result.current.value).toBe(3);
      expect(hookB.result.current.value).toBe(3);
      expect(window.localStorage.getItem("shared-counter")).toBe("3");

      act(() => {
        hookB.result.current.remove();
      });

      expect(hookA.result.current.value).toBe(0);
      expect(hookB.result.current.value).toBe(0);
      expect(window.localStorage.getItem("shared-counter")).toBeNull();
    });
  });

  describe("sessionStorage area", () => {
    it("reads, writes, and removes values in sessionStorage without touching localStorage", () => {
      const { result } = renderHook(() =>
        useStoredState("session-key", {
          area: "sessionStorage",
          defaultValue: "init",
        }),
      );

      expect(result.current.value).toBe("init");

      act(() => {
        result.current.setValue("updated");
      });

      expect(result.current.value).toBe("updated");
      expect(window.sessionStorage.getItem("session-key")).toBe(
        JSON.stringify("updated"),
      );
      expect(window.localStorage.getItem("session-key")).toBeNull();

      act(() => {
        result.current.remove();
      });

      expect(result.current.value).toBe("init");
      expect(window.sessionStorage.getItem("session-key")).toBeNull();
    });
  });

  describe("cookie area", () => {
    it("writes path=/; max-age=31536000 and expires the cookie on remove()", () => {
      const cookieSetter = vi.spyOn(document, "cookie", "set");

      const { result } = renderHook(() =>
        useStoredState("theme-cookie", {
          area: "cookie",
          defaultValue: "light",
        }),
      );

      expect(result.current.value).toBe("light");

      act(() => {
        result.current.setValue("dark mode");
      });

      expect(cookieSetter).toHaveBeenCalledWith(
        expect.stringContaining("theme-cookie="),
      );
      expect(cookieSetter).toHaveBeenCalledWith(
        expect.stringContaining("path=/; max-age=31536000"),
      );
      expect(result.current.value).toBe("dark mode");

      act(() => {
        result.current.remove();
      });

      expect(cookieSetter).toHaveBeenLastCalledWith(
        expect.stringContaining("theme-cookie=; path=/; max-age=0"),
      );
      expect(result.current.value).toBe("light");
    });

    it("falls back to defaultValue when a cookie contains malformed URI encoding", () => {
      vi.spyOn(document, "cookie", "get").mockReturnValue("bad-cookie=%E0%A4%A");

      const { result } = renderHook(() =>
        useStoredState("bad-cookie", {
          area: "cookie",
          defaultValue: "safe",
        }),
      );

      expect(result.current.value).toBe("safe");
    });
  });

  describe("cross-tab StorageEvent handling", () => {
    it("ignores StorageEvent for a different key or storageArea and updates for the matching key", () => {
      const { result } = renderHook(() =>
        useStoredState("sync-key", { defaultValue: "initial" }),
      );

      expect(result.current.value).toBe("initial");

      // Simulate another tab writing directly to localStorage
      window.localStorage.setItem("sync-key", JSON.stringify("from-other-tab"));

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "unrelated-key",
            storageArea: window.localStorage,
          }),
        );
      });

      expect(result.current.value).toBe("initial");

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "sync-key",
            storageArea: window.sessionStorage,
          }),
        );
      });

      expect(result.current.value).toBe("initial");

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "sync-key",
            storageArea: window.localStorage,
          }),
        );
      });

      expect(result.current.value).toBe("from-other-tab");

      // Simulate storage.clear() from another tab (key === null)
      window.localStorage.clear();

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: null,
            storageArea: window.localStorage,
          }),
        );
      });

      expect(result.current.value).toBe("initial");
    });
  });

  describe("storage failure resilience", () => {
    it("returns defaultValue and does not throw when storage methods throw", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("storage read blocked");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("quota exceeded");
      });
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("storage remove blocked");
      });

      const { result } = renderHook(() =>
        useStoredState("throwing-key", { defaultValue: "safe-default" }),
      );

      expect(result.current.value).toBe("safe-default");
      expect(result.current.hydrated).toBe(true);

      expect(() => {
        act(() => {
          result.current.setValue("next");
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.remove();
        });
      }).not.toThrow();

      expect(result.current.value).toBe("safe-default");
    });

    it("returns defaultValue when accessing window.localStorage getter throws", () => {
      vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
        throw new Error("SecurityError");
      });

      const { result } = renderHook(() =>
        useStoredState("blocked-storage", { defaultValue: 99 }),
      );

      expect(result.current.value).toBe(99);

      expect(() => {
        act(() => {
          result.current.setValue(100);
          result.current.remove();
        });
      }).not.toThrow();

      expect(result.current.value).toBe(99);
    });

    it("does not throw when document.cookie getter or setter throws", () => {
      Object.defineProperty(document, "cookie", {
        configurable: true,
        get() {
          throw new Error("cookie read blocked");
        },
        set() {
          throw new Error("cookie write blocked");
        },
      });

      try {
        const { result } = renderHook(() =>
          useStoredState("blocked-cookie", {
            area: "cookie",
            defaultValue: "fallback",
          }),
        );

        expect(result.current.value).toBe("fallback");

        expect(() => {
          act(() => {
            result.current.setValue("next");
            result.current.remove();
          });
        }).not.toThrow();

        expect(result.current.value).toBe("fallback");
      } finally {
        Reflect.deleteProperty(document, "cookie");
      }
    });
  });
});
