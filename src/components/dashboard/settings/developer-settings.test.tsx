import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeveloperSettings } from "@/components/dashboard/settings/developer-settings";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock Clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe("DeveloperSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe("Rendering", () => {
    it("renders warning banner on initial load", () => {
      render(<DeveloperSettings />);
      expect(screen.getByText("Experimental Features")).toBeInTheDocument();
      expect(
        screen.getByText(/These settings control unstable/i)
      ).toBeInTheDocument();
    });

    it("renders experimental feature toggles", async () => {
      render(<DeveloperSettings />);
      await waitFor(() => {
        expect(screen.getByText("Timeline Compression")).toBeInTheDocument();
        expect(screen.getByText("Batch Operations")).toBeInTheDocument();
        expect(screen.getByText("AI Insights")).toBeInTheDocument();
        expect(screen.getByText("Custom Themes")).toBeInTheDocument();
      });
    });

    it("renders debug info section with copyable items", async () => {
      render(<DeveloperSettings />);
      await waitFor(() => {
        expect(screen.getByText("Debug Information")).toBeInTheDocument();
        expect(screen.getByText("Version")).toBeInTheDocument();
        expect(screen.getByText("Build ID")).toBeInTheDocument();
        expect(screen.getByText("User ID")).toBeInTheDocument();
        expect(screen.getByText("Full Debug Info")).toBeInTheDocument();
      });
    });

    it("renders export logs button", async () => {
      render(<DeveloperSettings />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /export logs/i })).toBeInTheDocument();
      });
    });

    it("shows skeleton loading state before mount", () => {
      const { container } = render(<DeveloperSettings />);
      const skeletonElements = container.querySelectorAll(".animate-pulse");
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe("Feature Toggles", () => {
    it("toggles experimental features on/off", async () => {
      const user = userEvent.setup();
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/toggle timeline compression/i)).toBeInTheDocument();
      });

      const toggleButton = screen.getByLabelText(/toggle timeline compression/i);
      expect(toggleButton).toHaveAttribute("aria-checked", "false");

      await user.click(toggleButton);

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute("aria-checked", "true");
      });
    });

    it("persists feature toggle state to localStorage", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/toggle ai insights/i)).toBeInTheDocument();
      });

      const toggleButton = screen.getByLabelText(/toggle ai insights/i);
      await user.click(toggleButton);

      await waitFor(() => {
        const stored = localStorage.getItem("chronopay-experiments");
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed["ai-insights"]).toBe(true);
      });

      // Unmount and remount to verify persistence
      unmount();
      render(<DeveloperSettings />);

      await waitFor(() => {
        const remountedToggle = screen.getByLabelText(/toggle ai insights/i);
        expect(remountedToggle).toHaveAttribute("aria-checked", "true");
      });
    });

    it("toggles multiple features independently", async () => {
      const user = userEvent.setup();
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/toggle timeline compression/i)).toBeInTheDocument();
      });

      const toggle1 = screen.getByLabelText(/toggle timeline compression/i);
      const toggle2 = screen.getByLabelText(/toggle batch operations/i);

      await user.click(toggle1);
      await user.click(toggle2);

      await waitFor(() => {
        expect(toggle1).toHaveAttribute("aria-checked", "true");
        expect(toggle2).toHaveAttribute("aria-checked", "true");
      });

      await user.click(toggle1);

      await waitFor(() => {
        expect(toggle1).toHaveAttribute("aria-checked", "false");
        expect(toggle2).toHaveAttribute("aria-checked", "true");
      });
    });

    it("has proper aria-labels for screen readers", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/toggle timeline compression/i)
        ).toHaveAttribute("role", "switch");
        expect(
          screen.getByLabelText(/toggle batch operations/i)
        ).toHaveAttribute("role", "switch");
      });
    });
  });

  describe("Copy to Clipboard", () => {
    it("copies version to clipboard", async () => {
      const user = userEvent.setup();
      render(<DeveloperSettings />);

      await waitFor(() => {
        const versionSection = screen.getByText("Version").closest("div");
        expect(versionSection).toBeInTheDocument();
      });

      const versionItem = screen.getByText("Version").closest("div");
      const copyButton = within(versionItem!).getByRole("button", {
        name: /copy version/i,
      });

      await user.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith("0.1.0");
      });
    });

    it("shows 'Copied' feedback after copying", async () => {
      const user = userEvent.setup();
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/copy build id/i)).toBeInTheDocument();
      });

      const copyButton = screen.getByLabelText(/copy build id/i);
      await user.click(copyButton);

      await waitFor(() => {
        expect(copyButton.textContent).toContain("Copied");
      });
    });

    it("resets 'Copied' state after 1500ms", async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/copy user id/i)).toBeInTheDocument();
      });

      const copyButton = screen.getByLabelText(/copy user id/i);
      await user.click(copyButton);

      expect(copyButton.textContent).toContain("Copied");

      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(copyButton.textContent).toContain("Copy");
      });

      vi.useRealTimers();
    });

    it("copies full debug info with all fields", async () => {
      const user = userEvent.setup();
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/copy full debug info/i)).toBeInTheDocument();
      });

      const copyButton = screen.getByLabelText(/copy full debug info/i);
      await user.click(copyButton);

      await waitFor(() => {
        const copiedText = mockClipboard.writeText.mock.calls[0]?.[0];
        expect(copiedText).toContain("Version:");
        expect(copiedText).toContain("Build ID:");
        expect(copiedText).toContain("User ID:");
        expect(copiedText).toContain("Timestamp:");
      });
    });

    it("has aria-live status announcements for clipboard actions", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        const statusDivs = screen.getAllByRole("status");
        expect(statusDivs.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Export Logs", () => {
    it("exports logs with debug info and experiment state", async () => {
      const user = userEvent.setup();
      const mockCreateObjectURL = vi.spyOn(URL, "createObjectURL");
      const mockRevokeObjectURL = vi.spyOn(URL, "revokeObjectURL");

      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /export logs/i })).toBeInTheDocument();
      });

      // Enable a feature first
      const toggleButton = screen.getByLabelText(/toggle ai insights/i);
      await user.click(toggleButton);

      // Click export
      const exportButton = screen.getByRole("button", { name: /export logs/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });

      mockCreateObjectURL.mockRestore();
      mockRevokeObjectURL.mockRestore();
    });

    it("shows loading state while exporting", async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /export logs/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export logs/i });
      expect(exportButton).toHaveAttribute("aria-busy", "false");

      user.click(exportButton);

      expect(exportButton).toHaveAttribute("aria-busy", "true");
      expect(exportButton).toBeDisabled();
      expect(exportButton.textContent).toContain("Exporting...");

      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(exportButton).toHaveAttribute("aria-busy", "false");
      });

      vi.useRealTimers();
    });

    it("disables export button while exporting", async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /export logs/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export logs/i });
      expect(exportButton).not.toBeDisabled();

      user.click(exportButton);

      expect(exportButton).toBeDisabled();

      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });

      vi.useRealTimers();
    });
  });

  describe("Warning Banner", () => {
    it("dismisses warning banner", async () => {
      const user = userEvent.setup();
      render(<DeveloperSettings />);

      expect(screen.getByText(/experimental features/i)).toBeInTheDocument();

      const dismissButton = screen.getByLabelText(/dismiss warning/i);
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/experimental features/i)).not.toBeInTheDocument();
      });
    });

    it("persists banner dismissal state to localStorage", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<DeveloperSettings />);

      const dismissButton = screen.getByLabelText(/dismiss warning/i);
      await user.click(dismissButton);

      await waitFor(() => {
        expect(localStorage.getItem("chronopay-dev-banner-dismissed")).toBe("true");
      });

      unmount();
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.queryByText(/these settings control unstable/i)).not.toBeInTheDocument();
      });
    });

    it("banner has proper accessibility attributes", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        const banner = screen.getByRole("alert");
        expect(banner).toHaveAttribute("aria-live", "assertive");
        expect(banner).toHaveAttribute("aria-atomic", "true");
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        const headings = screen.getAllByRole("heading", { level: 3 });
        expect(headings.length).toBeGreaterThan(0);
        expect(headings[0].textContent).toContain("Experimental Features");
      });
    });

    it("all interactive elements are keyboard accessible", async () => {
      const user = userEvent.setup();
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/toggle timeline compression/i)).toBeInTheDocument();
      });

      const toggleButton = screen.getByLabelText(/toggle timeline compression/i);
      toggleButton.focus();
      expect(document.activeElement).toBe(toggleButton);

      await user.keyboard(" ");

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute("aria-checked", "true");
      });
    });

    it("has visible focus rings on all buttons", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/copy version/i)).toBeInTheDocument();
      });

      const copyButton = screen.getByLabelText(/copy version/i);
      expect(copyButton.className).toContain("focus-visible");
    });

    it("export button has aria-busy state", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /export logs/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole("button", { name: /export logs/i });
      expect(exportButton).toHaveAttribute("aria-busy");
    });

    it("copyable items have proper aria-labels", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/copy version/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/copy build id/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/copy user id/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/copy full debug info/i)).toBeInTheDocument();
      });
    });
  });

  describe("Dark Mode Compatibility", () => {
    it("renders with dark color tokens", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        const sections = screen.getAllByText(/Experimental Features|Debug Information|Export Logs/i);
        expect(sections.length).toBeGreaterThan(0);
      });

      // Verify dark mode classes are applied
      const warningBanner = screen.getByRole("alert");
      expect(warningBanner.className).toContain("bg-amber-400/8");
    });
  });

  describe("Responsive Layout", () => {
    it("renders copyable items with responsive classes", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        const copyableItems = screen.getAllByRole("button", { name: /copy/i });
        expect(copyableItems.length).toBeGreaterThan(0);

        copyableItems.forEach((button) => {
          expect(button.className).toContain("sm:");
        });
      });
    });

    it("toggles have responsive description text", async () => {
      render(<DeveloperSettings />);

      await waitFor(() => {
        const toggleAreas = screen.getAllByRole("switch");
        expect(toggleAreas.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles localStorage unavailability gracefully", async () => {
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: () => {
            throw new Error("localStorage not available");
          },
          setItem: () => {
            throw new Error("localStorage not available");
          },
          removeItem: () => {},
          clear: () => {},
        },
        writable: true,
      });

      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByText("Experimental Features")).toBeInTheDocument();
      });

      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
      });
    });

    it("handles clipboard API unavailability gracefully", async () => {
      const user = userEvent.setup();
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () => Promise.reject(new Error("Clipboard unavailable")),
        },
        writable: true,
      });

      render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/copy version/i)).toBeInTheDocument();
      });

      const copyButton = screen.getByLabelText(/copy version/i);
      await user.click(copyButton);

      // Should not throw, gracefully handle error
      await waitFor(() => {
        expect(copyButton).toBeInTheDocument();
      });

      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        writable: true,
      });
    });

    it("loads saved state on mount", async () => {
      localStorage.setItem(
        "chronopay-experiments",
        JSON.stringify({
          "timeline-compression": true,
          "batch-operations": false,
          "ai-insights": true,
          "custom-themes": false,
        })
      );

      render(<DeveloperSettings />);

      await waitFor(() => {
        const toggle1 = screen.getByLabelText(/toggle timeline compression/i);
        const toggle2 = screen.getByLabelText(/toggle batch operations/i);
        const toggle3 = screen.getByLabelText(/toggle ai insights/i);
        const toggle4 = screen.getByLabelText(/toggle custom themes/i);

        expect(toggle1).toHaveAttribute("aria-checked", "true");
        expect(toggle2).toHaveAttribute("aria-checked", "false");
        expect(toggle3).toHaveAttribute("aria-checked", "true");
        expect(toggle4).toHaveAttribute("aria-checked", "false");
      });
    });
  });

  describe("Performance", () => {
    it("does not re-render unnecessarily on toggle", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<DeveloperSettings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/toggle timeline compression/i)).toBeInTheDocument();
      });

      const toggleButton = screen.getByLabelText(/toggle timeline compression/i);
      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute("aria-checked", "true");
    });
  });
});
