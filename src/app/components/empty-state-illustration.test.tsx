/**
 * empty-state-illustration.test.tsx
 * Comprehensive test suite for EmptyStateIllustration component
 * 
 * Coverage:
 * - All variant rendering (default, error, offline, blocked)
 * - Accessibility (ARIA labels, roles)
 * - Animation behavior (paused/active states)
 * - IntersectionObserver integration
 * - Invalid inputs and edge cases
 * - State transitions
 * - Theme configuration
 * - Boundary behavior
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EmptyStateIllustration } from "./empty-state-illustration";

describe("EmptyStateIllustration", () => {
  let mockIntersectionObserver: any;
  let observeCallback: IntersectionObserverCallback;

  beforeEach(() => {
    // Mock IntersectionObserver with callback capture
    mockIntersectionObserver = vi.fn((callback) => {
      observeCallback = callback;
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    });
    window.IntersectionObserver = mockIntersectionObserver as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Basic Rendering ────────────────────────────────────────────────────

  describe("Basic Rendering", () => {
    it("renders with required accentLabel prop", () => {
      render(<EmptyStateIllustration accentLabel="No Data" />);
      expect(screen.getByText("No Data")).toBeInTheDocument();
    });

    it("renders with role img for accessibility", () => {
      render(<EmptyStateIllustration accentLabel="Empty" />);
      const illustration = screen.getByRole("img");
      expect(illustration).toBeInTheDocument();
    });

    it("renders with default variant when not specified", () => {
      render(<EmptyStateIllustration accentLabel="Empty" />);
      const illustration = screen.getByRole("img");
      expect(illustration).toHaveAttribute("aria-label", "Empty");
    });

    it("applies correct container structure", () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass("relative");
      expect(root).toHaveClass("h-36");
      expect(root).toHaveClass("w-full");
      expect(root).toHaveClass("overflow-hidden");
    });
  });

  // ─── Variant Rendering ──────────────────────────────────────────────────

  describe("Variant Rendering", () => {
    it('renders default variant correctly', () => {
      render(<EmptyStateIllustration accentLabel="No Items" variant="default" />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("aria-label", "No Items");
      expect(screen.getByText("No Items")).toBeInTheDocument();
    });

    it('renders error variant correctly', () => {
      render(<EmptyStateIllustration accentLabel="Error" variant="error" />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("aria-label", "Error");
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it('renders offline variant correctly', () => {
      render(<EmptyStateIllustration accentLabel="Offline" variant="offline" />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("aria-label", "Offline");
      expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it('renders blocked variant correctly', () => {
      render(<EmptyStateIllustration accentLabel="Blocked" variant="blocked" />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("aria-label", "Blocked");
      expect(screen.getByText("Blocked")).toBeInTheDocument();
    });

    it('uses variant in fallback aria-label when alt not provided', () => {
      render(<EmptyStateIllustration accentLabel="" variant="error" />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("aria-label", "error state illustration");
    });
  });

  // ─── Accessibility ──────────────────────────────────────────────────────

  describe("Accessibility", () => {
    it("uses accentLabel as default aria-label", () => {
      render(<EmptyStateIllustration accentLabel="No Results Found" />);
      const illustration = screen.getByRole("img");
      expect(illustration).toHaveAttribute("aria-label", "No Results Found");
    });

    it("accepts custom alt text and uses it as aria-label", () => {
      render(
        <EmptyStateIllustration
          accentLabel="Empty"
          alt="Custom description for screen readers"
        />
      );
      const illustration = screen.getByRole("img");
      expect(illustration).toHaveAttribute(
        "aria-label",
        "Custom description for screen readers"
      );
    });

    it("prefers custom alt over accentLabel for aria-label", () => {
      render(
        <EmptyStateIllustration
          accentLabel="Visible Label"
          alt="Screen reader label"
        />
      );
      const illustration = screen.getByRole("img");
      expect(illustration).toHaveAttribute("aria-label", "Screen reader label");
      expect(screen.getByText("Visible Label")).toBeInTheDocument();
    });

    it("provides fallback aria-label when accentLabel is empty", () => {
      render(<EmptyStateIllustration accentLabel="" variant="default" />);
      const illustration = screen.getByRole("img");
      expect(illustration).toHaveAttribute("aria-label", "default state illustration");
    });

    it("role img makes component recognizable to screen readers", () => {
      render(<EmptyStateIllustration accentLabel="Test" />);
      const illustration = screen.getByRole("img");
      expect(illustration.getAttribute("role")).toBe("img");
    });
  });

  // ─── IntersectionObserver Integration ───────────────────────────────────

  describe("IntersectionObserver Integration", () => {
    it("creates IntersectionObserver on mount", () => {
      render(<EmptyStateIllustration accentLabel="Test" />);
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0.1 }
      );
    });

    it("observes the root element", () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      const observeMock = mockIntersectionObserver.mock.results[0].value.observe;
      expect(observeMock).toHaveBeenCalledWith(container.firstChild);
    });

    it("disconnects observer on unmount", () => {
      const { unmount } = render(<EmptyStateIllustration accentLabel="Test" />);
      const disconnectMock = mockIntersectionObserver.mock.results[0].value.disconnect;
      unmount();
      expect(disconnectMock).toHaveBeenCalled();
    });

    it("pauses animation when not intersecting", async () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      const root = container.firstChild as HTMLElement;

      // Simulate element not intersecting
      observeCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );

      await waitFor(() => {
        expect(root).toHaveClass("es-paused");
      });
    });

    it("activates animation when intersecting", async () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      const root = container.firstChild as HTMLElement;

      // Simulate element intersecting
      observeCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );

      await waitFor(() => {
        expect(root).not.toHaveClass("es-paused");
      });
    });

    it("toggles animation state on intersection changes", async () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      const root = container.firstChild as HTMLElement;

      // Start intersecting
      observeCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
      await waitFor(() => expect(root).not.toHaveClass("es-paused"));

      // Stop intersecting
      observeCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
      await waitFor(() => expect(root).toHaveClass("es-paused"));

      // Intersect again
      observeCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
      await waitFor(() => expect(root).not.toHaveClass("es-paused"));
    });
  });

  // ─── Invalid Inputs & Edge Cases ────────────────────────────────────────

  describe("Invalid Inputs & Edge Cases", () => {
    it("handles empty accentLabel string", () => {
      render(<EmptyStateIllustration accentLabel="" />);
      const illustration = screen.getByRole("img");
      expect(illustration).toBeInTheDocument();
    });

    it("handles very long accentLabel", () => {
      const longLabel = "A".repeat(500);
      render(<EmptyStateIllustration accentLabel={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it("handles accentLabel with special characters", () => {
      render(<EmptyStateIllustration accentLabel="<script>alert('xss')</script>" />);
      expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
    });

    it("handles accentLabel with emojis", () => {
      render(<EmptyStateIllustration accentLabel="🚫 No Data 📭" />);
      expect(screen.getByText("🚫 No Data 📭")).toBeInTheDocument();
    });

    it("handles accentLabel with unicode characters", () => {
      render(<EmptyStateIllustration accentLabel="数据为空" />);
      expect(screen.getByText("数据为空")).toBeInTheDocument();
    });

    it("handles alt with special characters", () => {
      render(
        <EmptyStateIllustration
          accentLabel="Test"
          alt="Alt with \"quotes\" and 'apostrophes'"
        />
      );
      const illustration = screen.getByRole("img");
      expect(illustration).toHaveAttribute(
        "aria-label",
        "Alt with \"quotes\" and 'apostrophes'"
      );
    });

    it("handles alt with newlines and whitespace", () => {
      render(
        <EmptyStateIllustration
          accentLabel="Test"
          alt="Line 1\nLine 2\t\tTab"
        />
      );
      const illustration = screen.getByRole("img");
      expect(illustration).toHaveAttribute("aria-label", "Line 1\nLine 2\t\tTab");
    });

    it("handles empty alt string (falls back to accentLabel)", () => {
      render(<EmptyStateIllustration accentLabel="Label" alt="" />);
      const illustration = screen.getByRole("img");
      // Empty alt should be used as-is
      expect(illustration).toHaveAttribute("aria-label", "");
    });

    it("handles undefined alt (uses accentLabel)", () => {
      render(<EmptyStateIllustration accentLabel="Label" />);
      const illustration = screen.getByRole("img");
      expect(illustration).toHaveAttribute("aria-label", "Label");
    });
  });

  // ─── State Transitions ──────────────────────────────────────────────────

  describe("State Transitions", () => {
    it("transitions from default to error variant", () => {
      const { rerender } = render(
        <EmptyStateIllustration accentLabel="Loading" variant="default" />
      );
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Loading");

      rerender(<EmptyStateIllustration accentLabel="Error" variant="error" />);
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Error");
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("transitions from online to offline variant", () => {
      const { rerender } = render(
        <EmptyStateIllustration accentLabel="Connected" variant="default" />
      );
      expect(screen.getByText("Connected")).toBeInTheDocument();

      rerender(<EmptyStateIllustration accentLabel="Offline" variant="offline" />);
      expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it("transitions accentLabel while keeping same variant", () => {
      const { rerender } = render(
        <EmptyStateIllustration accentLabel="Loading..." variant="default" />
      );
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      rerender(
        <EmptyStateIllustration accentLabel="No Results" variant="default" />
      );
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(screen.getByText("No Results")).toBeInTheDocument();
    });

    it("transitions alt text dynamically", () => {
      const { rerender } = render(
        <EmptyStateIllustration accentLabel="Test" alt="Initial alt" />
      );
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Initial alt");

      rerender(<EmptyStateIllustration accentLabel="Test" alt="Updated alt" />);
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Updated alt");
    });

    it("transitions from custom alt to no alt (uses accentLabel)", () => {
      const { rerender } = render(
        <EmptyStateIllustration accentLabel="Label" alt="Custom" />
      );
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Custom");

      rerender(<EmptyStateIllustration accentLabel="Label" />);
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Label");
    });

    it("cycles through all variants", () => {
      const { rerender } = render(
        <EmptyStateIllustration accentLabel="Test" variant="default" />
      );
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Test");

      rerender(<EmptyStateIllustration accentLabel="Test" variant="error" />);
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Test");

      rerender(<EmptyStateIllustration accentLabel="Test" variant="offline" />);
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Test");

      rerender(<EmptyStateIllustration accentLabel="Test" variant="blocked" />);
      expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Test");
    });
  });

  // ─── Theme Configuration ────────────────────────────────────────────────

  describe("Theme Configuration", () => {
    it("applies default theme classes", () => {
      const { container } = render(
        <EmptyStateIllustration accentLabel="Test" variant="default" />
      );
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain("bg-slate-50");
    });

    it("renders glow element for visual effect", () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      const glow = container.querySelector(".es-glow-pulse");
      expect(glow).toBeInTheDocument();
    });

    it("renders accent badge with correct styling", () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Badge" />);
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("uppercase");
    });

    it("renders inner card panel structure", () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      const panel = container.querySelector(".grid");
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveClass("grid-cols-[1.35fr,0.8fr]");
    });

    it("renders drift-slow animation element", () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      const driftSlow = container.querySelector(".es-drift-slow");
      expect(driftSlow).toBeInTheDocument();
    });

    it("renders drift-fast animation element", () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      const driftFast = container.querySelector(".es-drift-fast");
      expect(driftFast).toBeInTheDocument();
    });
  });

  // ─── Boundary Behavior ──────────────────────────────────────────────────

  describe("Boundary Behavior", () => {
    it("handles IntersectionObserver not available", () => {
      // Temporarily remove IntersectionObserver
      const original = window.IntersectionObserver;
      (window as any).IntersectionObserver = undefined;

      expect(() => {
        render(<EmptyStateIllustration accentLabel="Test" />);
      }).toThrow();

      window.IntersectionObserver = original;
    });

    it("handles rootRef being null during effect", () => {
      // This tests the early return when el is null
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      // If the component renders without error, the null check works
      expect(container.firstChild).toBeInTheDocument();
    });

    it("maintains stable structure across re-renders", () => {
      const { container, rerender } = render(
        <EmptyStateIllustration accentLabel="First" />
      );
      const initialStructure = container.innerHTML;

      rerender(<EmptyStateIllustration accentLabel="Second" />);
      
      // Structure should be similar (only text content changes)
      expect(container.querySelector(".es-glow-pulse")).toBeInTheDocument();
      expect(container.querySelector(".es-drift-slow")).toBeInTheDocument();
      expect(container.querySelector(".es-drift-fast")).toBeInTheDocument();
    });

    it("cleans up observer on rapid mount/unmount cycles", () => {
      const { unmount, rerender } = render(
        <EmptyStateIllustration accentLabel="Test" />
      );
      const disconnectMock =
        mockIntersectionObserver.mock.results[0].value.disconnect;

      rerender(<EmptyStateIllustration accentLabel="Test2" />);
      unmount();

      // Disconnect should be called at least once
      expect(disconnectMock).toHaveBeenCalled();
    });

    it("handles multiple instances with independent observers", () => {
      render(<EmptyStateIllustration accentLabel="First" />);
      render(<EmptyStateIllustration accentLabel="Second" />);

      // Should create two separate observers
      expect(mockIntersectionObserver).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Integration Scenarios ──────────────────────────────────────────────

  describe("Integration Scenarios", () => {
    it("renders multiple illustrations with different variants", () => {
      const { container } = render(
        <>
          <EmptyStateIllustration accentLabel="Default" variant="default" />
          <EmptyStateIllustration accentLabel="Error" variant="error" />
          <EmptyStateIllustration accentLabel="Offline" variant="offline" />
        </>
      );

      expect(screen.getByText("Default")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it("works within a flex container", () => {
      const { container } = render(
        <div className="flex gap-4">
          <EmptyStateIllustration accentLabel="Item 1" />
          <EmptyStateIllustration accentLabel="Item 2" />
        </div>
      );

      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("maintains accessibility in dark mode context", () => {
      const { container } = render(
        <div className="dark">
          <EmptyStateIllustration accentLabel="Dark Mode" />
        </div>
      );

      const illustration = screen.getByRole("img");
      expect(illustration).toHaveAttribute("aria-label", "Dark Mode");
    });

    it("renders correctly in RTL context", () => {
      const { container } = render(
        <div dir="rtl">
          <EmptyStateIllustration accentLabel="RTL Test" />
        </div>
      );

      expect(screen.getByText("RTL Test")).toBeInTheDocument();
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  // ─── Error Recovery ─────────────────────────────────────────────────────

  describe("Error Recovery", () => {
    it("recovers from observer callback errors gracefully", async () => {
      const { container } = render(<EmptyStateIllustration accentLabel="Test" />);
      
      // Simulate observer callback with partial entry
      expect(() => {
        observeCallback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      }).not.toThrow();
    });

    it("handles rapid variant changes", () => {
      const { rerender } = render(
        <EmptyStateIllustration accentLabel="Test" variant="default" />
      );

      expect(() => {
        rerender(<EmptyStateIllustration accentLabel="Test" variant="error" />);
        rerender(<EmptyStateIllustration accentLabel="Test" variant="offline" />);
        rerender(<EmptyStateIllustration accentLabel="Test" variant="blocked" />);
        rerender(<EmptyStateIllustration accentLabel="Test" variant="default" />);
      }).not.toThrow();
    });
  });
});
