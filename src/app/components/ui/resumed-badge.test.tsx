import { ResumedBadge } from "@/app/components/ui/resumed-badge";
import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VISIBLE_MS = 3000;

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("ResumedBadge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Normal path (visible)", () => {
    it("renders the badge immediately on mount", () => {
      render(<ResumedBadge itemId="item-1" />);

      expect(
        screen.getByText("Resumed where you left off"),
      ).toBeInTheDocument();
    });

    it("exposes a polite status region for screen readers", () => {
      render(<ResumedBadge itemId="item-1" />);

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-live", "polite");
    });

    it("hides the decorative icon from assistive tech", () => {
      const { container } = render(<ResumedBadge itemId="item-1" />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("does not intercept pointer events", () => {
      render(<ResumedBadge itemId="item-1" />);

      expect(screen.getByRole("status").className).toContain(
        "pointer-events-none",
      );
    });

    it("is absolutely positioned at the top-right corner", () => {
      render(<ResumedBadge itemId="item-1" />);

      const { className } = screen.getByRole("status");
      expect(className).toContain("absolute");
      expect(className).toContain("top-0");
      expect(className).toContain("right-0");
    });
  });

  describe("Empty path (`if (!visible) return null`)", () => {
    it("renders nothing once the timer elapses", () => {
      const { container } = render(<ResumedBadge itemId="item-1" />);

      advance(VISIBLE_MS);

      expect(container).toBeEmptyDOMElement();
    });

    it("removes the status role and text once hidden", () => {
      render(<ResumedBadge itemId="item-1" />);

      advance(VISIBLE_MS);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Resumed where you left off"),
      ).not.toBeInTheDocument();
    });

    it("returns null (no wrapper, no icon) when hidden", () => {
      const { container } = render(<ResumedBadge itemId="item-1" />);

      advance(VISIBLE_MS);

      expect(container.firstChild).toBeNull();
      expect(container.querySelector("svg")).toBeNull();
    });
  });

  describe("Timer boundaries", () => {
    it("is still visible at 0ms", () => {
      render(<ResumedBadge itemId="item-1" />);

      advance(0);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("is still visible 1ms before the deadline", () => {
      render(<ResumedBadge itemId="item-1" />);

      advance(VISIBLE_MS - 1);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("is hidden exactly at the deadline", () => {
      render(<ResumedBadge itemId="item-1" />);

      advance(VISIBLE_MS - 1);
      expect(screen.getByRole("status")).toBeInTheDocument();

      advance(1);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("stays hidden long after the deadline", () => {
      const { container } = render(<ResumedBadge itemId="item-1" />);

      advance(VISIBLE_MS * 10);

      expect(container).toBeEmptyDOMElement();
    });

    it("schedules exactly one timeout of 3000ms", () => {
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

      render(<ResumedBadge itemId="item-1" />);

      const calls = setTimeoutSpy.mock.calls.filter(
        ([, ms]) => ms === VISIBLE_MS,
      );
      expect(calls).toHaveLength(1);
    });

    it("never becomes visible again after hiding without a remount", () => {
      render(<ResumedBadge itemId="item-1" />);

      advance(VISIBLE_MS);
      advance(VISIBLE_MS);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("Cleanup", () => {
    it("clears the pending timer on unmount", () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      const { unmount } = render(<ResumedBadge itemId="item-1" />);

      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("does not throw or log errors if time advances after unmount", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { unmount } = render(<ResumedBadge itemId="item-1" />);

      unmount();

      expect(() => advance(VISIBLE_MS * 2)).not.toThrow();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("restarts the visibility window when remounted", () => {
      const first = render(<ResumedBadge itemId="item-1" />);
      advance(VISIBLE_MS);
      expect(first.container).toBeEmptyDOMElement();
      first.unmount();

      render(<ResumedBadge itemId="item-1" />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      advance(VISIBLE_MS);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("still hides after 3000ms under StrictMode's double effect run", () => {
      render(
        <StrictMode>
          <ResumedBadge itemId="item-1" />
        </StrictMode>,
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      // StrictMode cleans up and re-runs the effect; only one timer may remain.
      expect(vi.getTimerCount()).toBe(1);

      advance(VISIBLE_MS);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("itemId prop (accepted for API symmetry, does not affect behavior)", () => {
    it.each([
      ["a normal id", "item-1"],
      ["an empty string", ""],
      ["a very long id", "x".repeat(10_000)],
      ["special characters", '<script>alert(1)</script> & "quotes"'],
    ])("renders and hides identically for %s", (_label, itemId) => {
      const { container } = render(<ResumedBadge itemId={itemId} />);

      expect(
        screen.getByText("Resumed where you left off"),
      ).toBeInTheDocument();

      advance(VISIBLE_MS);

      expect(container).toBeEmptyDOMElement();
    });

    it("does not leak itemId into the rendered output", () => {
      const { container } = render(<ResumedBadge itemId="secret-item-id" />);

      expect(container.innerHTML).not.toContain("secret-item-id");
    });

    it("does not restart the timer when itemId changes", () => {
      const { rerender } = render(<ResumedBadge itemId="item-1" />);

      advance(2000);
      rerender(<ResumedBadge itemId="item-2" />);
      expect(screen.getByRole("status")).toBeInTheDocument();

      advance(1000);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("does not re-show a hidden badge when itemId changes", () => {
      const { rerender, container } = render(<ResumedBadge itemId="item-1" />);

      advance(VISIBLE_MS);
      rerender(<ResumedBadge itemId="item-2" />);

      expect(container).toBeEmptyDOMElement();
    });
  });
});
