import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AutosaveIndicator } from "./autosave-indicator";
import type { AutosaveStatus } from "./types";

function renderIndicator(
  status: AutosaveStatus,
  lastSavedAt?: Date,
  onRetry?: () => void,
) {
  return render(
    <AutosaveIndicator
      status={status}
      lastSavedAt={lastSavedAt}
      onRetry={onRetry}
    />,
  );
}

describe("AutosaveIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: no-preference)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ── Correct label/icon per state ─────────────────────────── */

  it("renders 'Saving…' label when status is saving", () => {
    renderIndicator("saving");
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });

  it("renders an animated spinner when status is saving", () => {
    renderIndicator("saving");
    const svg = document.querySelector(".animate-spin");
    expect(svg).toBeInTheDocument();
  });

  it("renders 'Saved' label with relative time when status is saved", () => {
    const now = new Date();
    renderIndicator("saved", now);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it("renders a check icon when status is saved", () => {
    renderIndicator("saved", new Date());
    const path = document.querySelector("path[d*='M3 8l3 3 7-7']");
    expect(path).toBeInTheDocument();
  });

  it("renders 'Offline — changes queued' label when status is offline", () => {
    renderIndicator("offline");
    expect(screen.getByText("Offline — changes queued")).toBeInTheDocument();
  });

  it("renders a warning icon when status is offline", () => {
    renderIndicator("offline");
    const path = document.querySelector("path[d*='M8 5v3']");
    expect(path).toBeInTheDocument();
  });

  it("renders 'Couldn't save' label when status is error", () => {
    renderIndicator("error");
    expect(screen.getByText("Couldn't save")).toBeInTheDocument();
  });

  it("renders an error icon when status is error", () => {
    renderIndicator("error");
    const path = document.querySelector("path[d*='M5.5 5.5l5 5']");
    expect(path).toBeInTheDocument();
  });

  /* ── Relative-time label updates ───────────────────────────── */

  it("shows 'just now' for a save <5 seconds ago", () => {
    const now = new Date();
    renderIndicator("saved", now);
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it("shows '2 mins ago' for a save 2 minutes ago", () => {
    const past = new Date(Date.now() - 120_000);
    renderIndicator("saved", past);
    expect(screen.getByText(/2 mins ago/)).toBeInTheDocument();
  });

  it("updates relative time after interval tick", () => {
    const past = new Date(Date.now() - 30_000);
    renderIndicator("saved", past);
    expect(screen.getByText(/30s ago/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(35_000);
    });
    expect(screen.getByText(/1 min ago/)).toBeInTheDocument();
  });

  /* ── Tooltip reachable on focus ────────────────────────────── */

  it("shows tooltip on focus", () => {
    renderIndicator("saved", new Date("2025-06-15T10:30:00"));
    const badge = screen.getByRole("button", { name: /last saved/i });
    act(() => {
      fireEvent.focus(badge);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText(/Last saved:/)).toBeInTheDocument();
  });

  it("hides tooltip on blur", () => {
    renderIndicator("saved", new Date("2025-06-15T10:30:00"));
    const badge = screen.getByRole("button", { name: /last saved/i });
    act(() => {
      fireEvent.focus(badge);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    act(() => {
      fireEvent.blur(badge);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("badge is focusable via Tab when saved (tabIndex=0)", () => {
    renderIndicator("saved", new Date());
    const badge = screen.getByRole("button", { name: /last saved/i });
    expect(badge).toHaveAttribute("tabIndex", "0");
  });

  it("badge is NOT focusable when not saved", () => {
    renderIndicator("saving");
    const visibleText = screen.getByText("Saving…");
    const badge = visibleText.closest("span[id]");
    expect(badge).toHaveAttribute("id", "autosave-indicator-badge");
    expect(badge).not.toHaveAttribute("tabindex");
  });

  /* ── Live region text updates only on status change ────────── */

  it("announces via live region on status change", () => {
    const { rerender } = render(
      <AutosaveIndicator status="saving" />,
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender(<AutosaveIndicator status="saved" />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const liveRegion = document.querySelector("[role='status']");
    expect(liveRegion?.textContent).toBe("Saved");
  });

  it("does NOT re-announce on relative-time ticks (same status)", () => {
    renderIndicator("saved", new Date());
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    const liveRegion = document.querySelector("[role='status']");
    expect(liveRegion?.textContent).toBe("Saved");
  });

  /* ── Retry button behavior ─────────────────────────────────── */

  it("renders a Retry button when status is error and onRetry is provided", () => {
    const onRetry = vi.fn();
    renderIndicator("error", undefined, onRetry);
    expect(
      screen.getByRole("button", {
        name: /retry saving your booking progress/i,
      }),
    ).toBeInTheDocument();
  });

  it("does NOT render a Retry button when onRetry is omitted", () => {
    renderIndicator("error");
    expect(
      screen.queryByRole("button", { name: /retry/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onRetry when Retry button is clicked", () => {
    const onRetry = vi.fn();
    renderIndicator("error", undefined, onRetry);
    fireEvent.click(
      screen.getByRole("button", {
        name: /retry saving your booking progress/i,
      }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  /* ── Accessibility: aria attributes ────────────────────────── */

  it("has a live region with role=status and aria-live=polite", () => {
    renderIndicator("saving");
    const live = document.querySelector("[role='status']");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveAttribute("aria-atomic", "true");
    expect(live?.classList.contains("sr-only")).toBe(true);
  });

  it("badge has aria-describedby pointing to tooltip when tooltip is visible", () => {
    renderIndicator("saved", new Date("2025-06-15T10:30:00"));
    const badge = screen.getByRole("button", { name: /last saved/i });
    act(() => {
      fireEvent.focus(badge);
    });
    const describedBy = badge.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    if (describedBy) {
      expect(document.getElementById(describedBy)).toHaveAttribute(
        "role",
        "tooltip",
      );
    }
  });

  it("retry button has a descriptive aria-label", () => {
    const onRetry = vi.fn();
    renderIndicator("error", undefined, onRetry);
    expect(
      screen.getByRole("button", {
        name: "Retry saving your booking progress",
      }),
    ).toBeInTheDocument();
  });

  /* ── Reduced motion ────────────────────────────────────────── */

  it("does NOT add animate-spin when reduced motion is preferred", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    renderIndicator("saving");
    const svg = document.querySelector("svg");
    expect(svg?.classList.contains("animate-spin")).toBe(false);
  });

  /* ── RTL logical properties ────────────────────────────────── */

  it("uses logical margin (ms-1) on retry button for RTL support", () => {
    const onRetry = vi.fn();
    const { container } = renderIndicator("error", undefined, onRetry);
    const retryBtn = container.querySelector("button");
    expect(retryBtn?.className).toContain("ms-1");
  });

  it("uses logical positioning on tooltip", () => {
    renderIndicator("saved", new Date("2025-06-15T10:30:00"));
    const badge = screen.getByRole("button", { name: /last saved/i });
    act(() => {
      fireEvent.focus(badge);
    });
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.style.insetInlineStart).toBe("50%");
    const arrow = tooltip.querySelector("span");
    expect(arrow?.classList.contains("start-1/2")).toBe(true);
  });

  /* ── BookingProgress integration ───────────────────────────── */

  it("renders inside BookingProgress when autosaveStatus is provided", async () => {
    const { BookingProgress } = await import("./booking-progress");
    render(
      <BookingProgress
        stages={[]}
        autosaveStatus="saved"
        autosaveLastSavedAt={new Date()}
      />,
    );
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("is not rendered inside BookingProgress when autosaveStatus is omitted", async () => {
    const { BookingProgress } = await import("./booking-progress");
    render(<BookingProgress stages={[]} />);
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
    expect(screen.queryByText("Offline — changes queued")).not.toBeInTheDocument();
    expect(screen.queryByText("Couldn't save")).not.toBeInTheDocument();
  });
});