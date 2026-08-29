import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GraceBanner } from "../components/dashboard/grace-banner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a `now` stub that returns a fixed value. */
function fixedNow(ms: number) {
  return () => ms;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GraceBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it("renders the banner with correct countdown when time remains", () => {
    const base = Date.now();
    const expiresAt = base + 5 * 60 * 1000; // 5 min from now

    render(<GraceBanner graceExpiresAt={expiresAt} now={fixedNow(base)} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Late arrival/i)).toBeInTheDocument();
    expect(screen.getByTestId("grace-countdown")).toHaveTextContent("5:00");
  });

  it("renders 'Notify supplier' button", () => {
    const base = Date.now();
    render(
      <GraceBanner
        graceExpiresAt={base + 60_000}
        now={fixedNow(base)}
      />
    );
    expect(
      screen.getByRole("button", { name: /notify supplier/i })
    ).toBeInTheDocument();
  });

  it("shows seconds correctly for sub-minute window", () => {
    const base = Date.now();
    render(
      <GraceBanner
        graceExpiresAt={base + 45_000} // 45 s
        now={fixedNow(base)}
      />
    );
    expect(screen.getByTestId("grace-countdown")).toHaveTextContent("0:45");
  });

  it("shows 0:00 when already expired on mount", () => {
    const base = Date.now();
    render(
      <GraceBanner
        graceExpiresAt={base - 1_000} // already past
        now={fixedNow(base)}
      />
    );
    // Expired view — no countdown
    expect(screen.queryByTestId("grace-countdown")).not.toBeInTheDocument();
    expect(screen.getByText(/please contact the supplier/i)).toBeInTheDocument();
  });

  // ── Countdown ticking ─────────────────────────────────────────────────────

  it("counts down each second", async () => {
    const base = 1_000_000;
    const expiresAt = base + 3_000; // 3 seconds

    let currentTime = base;
    const mockNow = () => currentTime;

    render(<GraceBanner graceExpiresAt={expiresAt} now={mockNow} />);
    expect(screen.getByTestId("grace-countdown")).toHaveTextContent("0:03");

    currentTime = base + 1_000;
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(screen.getByTestId("grace-countdown")).toHaveTextContent("0:02");

    currentTime = base + 2_000;
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(screen.getByTestId("grace-countdown")).toHaveTextContent("0:01");
  });

  it("transitions to expired view when countdown reaches zero", async () => {
    const base = 1_000_000;
    const expiresAt = base + 2_000;

    let currentTime = base;
    const mockNow = () => currentTime;

    render(<GraceBanner graceExpiresAt={expiresAt} now={mockNow} />);
    expect(screen.getByTestId("grace-countdown")).toBeInTheDocument();

    currentTime = base + 2_000;
    act(() => { vi.advanceTimersByTime(2_000); });

    expect(screen.queryByTestId("grace-countdown")).not.toBeInTheDocument();
    expect(screen.getByText(/please contact the supplier/i)).toBeInTheDocument();
  });

  it("calls onExpired when countdown reaches zero", () => {
    const base = 1_000_000;
    const onExpired = vi.fn();

    let currentTime = base;
    render(
      <GraceBanner
        graceExpiresAt={base + 1_000}
        onExpired={onExpired}
        now={() => currentTime}
      />
    );

    currentTime = base + 1_000;
    act(() => { vi.advanceTimersByTime(1_000); });

    expect(onExpired).toHaveBeenCalledOnce();
  });

  // ── Notify action ─────────────────────────────────────────────────────────

  it("calls onNotifySupplier when button is clicked", () => {
    const base = Date.now();
    const onNotify = vi.fn();

    render(
      <GraceBanner
        graceExpiresAt={base + 60_000}
        onNotifySupplier={onNotify}
        now={fixedNow(base)}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /notify supplier/i }));
    expect(onNotify).toHaveBeenCalledOnce();
  });

  it("disables the button after clicking and shows 'Notified' state", () => {
    const base = Date.now();
    render(
      <GraceBanner
        graceExpiresAt={base + 60_000}
        now={fixedNow(base)}
      />
    );

    const btn = screen.getByRole("button", { name: /notify supplier/i });
    fireEvent.click(btn);

    const notifiedBtn = screen.getByRole("button", { name: /supplier notified/i });
    expect(notifiedBtn).toBeDisabled();
    expect(notifiedBtn).toHaveTextContent("✓ Notified");
  });

  it("does not fire onNotifySupplier more than once even if called twice", () => {
    const base = Date.now();
    const onNotify = vi.fn();

    render(
      <GraceBanner
        graceExpiresAt={base + 60_000}
        onNotifySupplier={onNotify}
        now={fixedNow(base)}
      />
    );

    const btn = screen.getByRole("button", { name: /notify supplier/i });
    fireEvent.click(btn);
    // Second click on now-disabled button — handler must not re-fire
    fireEvent.click(btn);
    expect(onNotify).toHaveBeenCalledOnce();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it("has role=alert on the banner", () => {
    const base = Date.now();
    render(
      <GraceBanner graceExpiresAt={base + 60_000} now={fixedNow(base)} />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("expired state also has role=alert", () => {
    const base = Date.now();
    render(
      <GraceBanner
        graceExpiresAt={base - 1_000}
        now={fixedNow(base)}
      />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("notify button has accessible aria-label when not notified", () => {
    const base = Date.now();
    render(
      <GraceBanner graceExpiresAt={base + 60_000} now={fixedNow(base)} />
    );
    const btn = screen.getByRole("button", { name: /notify supplier about late arrival/i });
    expect(btn).toBeInTheDocument();
  });

  it("notify button aria-label changes to 'Supplier notified' after click", () => {
    const base = Date.now();
    render(
      <GraceBanner graceExpiresAt={base + 60_000} now={fixedNow(base)} />
    );
    fireEvent.click(screen.getByRole("button", { name: /notify supplier about late arrival/i }));
    expect(
      screen.getByRole("button", { name: /supplier notified/i })
    ).toBeInTheDocument();
  });

  it("aria-live=polite sr-only region is present for minute announcements", () => {
    const base = Date.now();
    const { container } = render(
      <GraceBanner graceExpiresAt={base + 60_000} now={fixedNow(base)} />
    );
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveClass("sr-only");
  });

  it("publishes polite announcement when minute changes", () => {
    const base = 1_000_000;
    const expiresAt = base + 2 * 60 * 1000; // 2 min

    let currentTime = base;
    const mockNow = () => currentTime;

    const { container } = render(
      <GraceBanner graceExpiresAt={expiresAt} now={mockNow} />
    );

    const liveRegion = container.querySelector('[aria-live="polite"]');

    // Advance 61 s — should cross the 1-minute boundary
    currentTime = base + 61_000;
    act(() => { vi.advanceTimersByTime(61_000); });

    expect(liveRegion?.textContent).toMatch(/1 minute remaining/i);
  });

  it("announces expiry in the polite region", () => {
    const base = 1_000_000;
    let currentTime = base;

    const { container } = render(
      <GraceBanner
        graceExpiresAt={base + 1_000}
        now={() => currentTime}
      />
    );

    const liveRegion = container.querySelector('[aria-live="polite"]');

    currentTime = base + 1_000;
    act(() => { vi.advanceTimersByTime(1_000); });

    expect(liveRegion?.textContent).toMatch(/grace window has expired/i);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it("accepts optional className and merges it", () => {
    const base = Date.now();
    const { container } = render(
      <GraceBanner
        graceExpiresAt={base + 60_000}
        now={fixedNow(base)}
        className="mt-4"
      />
    );
    // The alert div has the class
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.className).toContain("mt-4");
  });

  it("works without optional callbacks (no crash)", () => {
    const base = Date.now();
    expect(() =>
      render(
        <GraceBanner graceExpiresAt={base + 500} now={fixedNow(base)} />
      )
    ).not.toThrow();
  });

  it("handles clock drift gracefully — never shows negative countdown", () => {
    const base = Date.now();
    // expiresAt is already 10 s in the past
    render(
      <GraceBanner
        graceExpiresAt={base - 10_000}
        now={fixedNow(base)}
      />
    );
    // Should render expired view, not a negative countdown
    expect(screen.queryByTestId("grace-countdown")).not.toBeInTheDocument();
    expect(screen.getByText(/please contact the supplier/i)).toBeInTheDocument();
  });

  it("formats multi-minute countdown correctly", () => {
    const base = Date.now();
    render(
      <GraceBanner
        graceExpiresAt={base + 10 * 60 * 1000 + 5_000} // 10 min 5 s
        now={fixedNow(base)}
      />
    );
    expect(screen.getByTestId("grace-countdown")).toHaveTextContent("10:05");
  });

  it("cleans up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const base = Date.now();

    const { unmount } = render(
      <GraceBanner graceExpiresAt={base + 60_000} now={fixedNow(base)} />
    );
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
