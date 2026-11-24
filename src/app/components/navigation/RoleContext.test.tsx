import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoleProvider, useRole } from "./RoleContext";

describe("RoleContext", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
    vi.restoreAllMocks();
  });

  describe("useRole", () => {
    it("throws an error when used outside of a RoleProvider", () => {
      // Suppress console.error for the expected thrown error
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => renderHook(() => useRole())).toThrow(
        "useRole must be used within a <RoleProvider>"
      );
      consoleSpy.mockRestore();
    });

    it("returns context values when wrapped in RoleProvider", async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RoleProvider>{children}</RoleProvider>
      );
      let result: any;
      await act(async () => {
        const render = renderHook(() => useRole(), { wrapper });
        result = render.result;
      });
      expect(result.current.role).toBe("buyer");
    });
  });

  describe("RoleProvider Storage and Window Behavior", () => {
    it("handles localStorage throwing an error safely (line 74)", async () => {
      // Mock localStorage.getItem to throw
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Access denied");
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RoleProvider initialRole="buyer">{children}</RoleProvider>
      );
      
      let result: any;
      await act(async () => {
        const render = renderHook(() => useRole(), { wrapper });
        result = render.result;
      });

      expect(getItemSpy).toHaveBeenCalledWith("chronopay:role");
      // Since it threw, readStoredRole returned null, so state remains the initial "buyer"
      expect(result.current.role).toBe("buyer");
      getItemSpy.mockRestore();
    });

    it("hydrates successfully from localStorage", async () => {
      window.localStorage.setItem("chronopay:role", "admin");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RoleProvider>{children}</RoleProvider>
      );

      let result: any;
      await act(async () => {
        const render = renderHook(() => useRole(), { wrapper });
        result = render.result;
      });

      expect(result.current.role).toBe("admin");
      expect(result.current.isHydrating).toBe(false);
    });
  });
});
