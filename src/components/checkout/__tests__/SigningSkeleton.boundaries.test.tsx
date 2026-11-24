/**
 * Dedicated regression suite for SigningSkeleton branches that
 * `src/__tests__/signing-skeleton.test.tsx` does not reach.
 *
 * That suite checks the visible copy, the cancel/help affordances and the
 * badge's presence at 10s / 15s / 61s. It never touches the wallet-icon
 * selection, the `role="timer"` accessible label, the 9-second boundary, the
 * sr-only message switch, or the 300-second safety cutoff. This file covers:
 *
 * - `getWalletIcon` picking the Freighter / Albedo / fallback artwork, including
 *   case-insensitive matching and the fallback for an unknown wallet,
 * - the exact boundary at 9s versus 10s,
 * - the timer's `aria-label` pluralisation (`minute`/`minute(s)`,
 *   `second`/`second(s)`) and its `m:ss`-free rounding at 60s and 120s,
 * - the sr-only live region switching to the "It has been N seconds" sentence,
 * - the 300-second cutoff, after which the interval is cleared and the badge
 *   stops advancing,
 * - the interval being cleared on unmount,
 * - the container's full `role="status"` / `aria-live` / `aria-atomic` wiring.
 *
 * Fake timers are used throughout, as in the existing suite.
 */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SigningSkeleton } from "@/components/checkout/SigningSkeleton";

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const timer = () => document.querySelector('[role="timer"]');

const srOnlyRegion = (container: HTMLElement) =>
  container.querySelector('span[role="status"]') as HTMLElement;

describe("SigningSkeleton — wallet artwork", () => {
  it("renders the Freighter artwork for 'Freighter'", () => {
    const { container } = render(<SigningSkeleton walletName="Freighter" />);
    expect(container.innerHTML).toContain("text-cyan-400");
    expect(container.innerHTML).not.toContain("text-violet-200");
  });

  it("matches the wallet name case-insensitively", () => {
    const upper = render(<SigningSkeleton walletName="FREIGHTER" />);
    const lower = render(<SigningSkeleton walletName="freighter" />);

    expect(upper.container.innerHTML).toContain("text-cyan-400");
    expect(lower.container.innerHTML).toContain("text-cyan-400");
  });

  it("renders the Albedo artwork for 'albedo'", () => {
    const { container } = render(<SigningSkeleton walletName="albedo" />);
    expect(container.innerHTML).toContain("text-violet-200");
    expect(container.innerHTML).not.toContain("text-cyan-400");
  });

  it("falls back to the neutral artwork for an unknown wallet", () => {
    const { container } = render(<SigningSkeleton walletName="Rando Wallet" />);
    expect(container.innerHTML).toContain("text-slate-500/30");
    expect(container.innerHTML).not.toContain("text-violet-200");
    expect(container.innerHTML).not.toContain("text-cyan-400");
  });

  it("uses the neutral artwork when no wallet name is given", () => {
    const { container } = render(<SigningSkeleton />);
    expect(container.innerHTML).toContain("text-slate-500/30");
  });

  it("hides the decorative artwork from assistive technology", () => {
    const { container } = render(<SigningSkeleton walletName="Freighter" />);
    for (const svg of Array.from(container.querySelectorAll("svg"))) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });
});

describe("SigningSkeleton — elapsed badge boundaries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("still hides the badge one second before the threshold", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    advance(9000);

    expect(timer()).toBeNull();
    expect(screen.queryByText(/Elapsed/i)).not.toBeInTheDocument();
  });

  it("shows the badge exactly at the threshold", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    advance(10000);

    expect(timer()).not.toBeNull();
  });

  it("labels the timer with zero minutes below the first minute", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    advance(10000);

    expect(timer()).toHaveAttribute(
      "aria-label",
      "Waiting for signature. Elapsed time: 0 minutes 10 seconds",
    );
  });

  it("switches to a singular minute label at exactly 60 seconds", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    advance(60000);

    expect(timer()).toHaveAttribute(
      "aria-label",
      "Waiting for signature. Elapsed time: 1 minute 0 seconds",
    );
    // The visible label keeps a non-breaking space between "Elapsed" and the time.
    expect(timer()?.textContent).toContain("1m 0s");
  });

  it("uses a singular second label at 61 seconds", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    advance(61000);

    expect(timer()).toHaveAttribute(
      "aria-label",
      "Waiting for signature. Elapsed time: 1 minute 1 second",
    );
  });

  it("pluralises both units at two minutes", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    advance(120000);

    expect(timer()).toHaveAttribute(
      "aria-label",
      "Waiting for signature. Elapsed time: 2 minutes 0 seconds",
    );
    expect(timer()?.textContent).toContain("2m 0s");
  });

  it("keeps the badge live and polite", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    advance(10000);

    expect(timer()).toHaveAttribute("role", "timer");
    expect(timer()).toHaveAttribute("aria-live", "polite");
  });
});

describe("SigningSkeleton — sr-only announcements", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces only the waiting message before the threshold", () => {
    const { container } = render(<SigningSkeleton walletName="Freighter" />);
    advance(9000);

    expect(srOnlyRegion(container)).toHaveTextContent(
      "Waiting for signature in Freighter. Please check your wallet extension to approve the transaction.",
    );
    expect(srOnlyRegion(container).textContent).not.toContain("It has been");
  });

  it("appends the elapsed sentence once the threshold is reached", () => {
    const { container } = render(<SigningSkeleton walletName="Freighter" />);
    advance(10000);

    expect(srOnlyRegion(container)).toHaveTextContent(
      "It has been 10 seconds since this request began.",
    );
  });

  it("names the fallback wallet in the announcement", () => {
    const { container } = render(<SigningSkeleton />);
    advance(10000);

    expect(srOnlyRegion(container)).toHaveTextContent("Waiting for signature in wallet.");
  });

  it("marks the sr-only region assertive while the container stays polite", () => {
    const { container } = render(<SigningSkeleton walletName="Freighter" />);

    expect(srOnlyRegion(container)).toHaveAttribute("aria-live", "assertive");
    expect(srOnlyRegion(container)).toHaveAttribute("aria-atomic", "true");
    expect(srOnlyRegion(container).className).toContain("sr-only");
  });
});

describe("SigningSkeleton — interval lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stops advancing once the 300-second safety cutoff is reached", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    advance(300000);
    expect(timer()?.textContent).toContain("5m 0s");

    advance(5000);

    expect(timer()?.textContent).toContain("5m 0s");
    expect(screen.queryByText(/5m 5s/i)).not.toBeInTheDocument();
  });

  it("is still ticking just before the cutoff", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    advance(299000);
    expect(timer()?.textContent).toContain("4m 59s");

    advance(1000);
    expect(timer()?.textContent).toContain("5m 0s");
  });

  it("clears the interval on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = render(<SigningSkeleton walletName="Freighter" />);
    advance(1000);

    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("does not warn about state updates after unmount", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(<SigningSkeleton walletName="Freighter" />);
    unmount();

    advance(5000);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("SigningSkeleton — container semantics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exposes role=status with a polite, atomic live region", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    const container = screen.getByLabelText(/Waiting for signature in Freighter/i);

    expect(container).toHaveAttribute("role", "status");
    expect(container).toHaveAttribute("aria-live", "polite");
    expect(container).toHaveAttribute("aria-atomic", "true");
    expect(container).toHaveAttribute("aria-busy", "true");
  });

  it("keeps the container label stable as the elapsed time grows", () => {
    render(<SigningSkeleton walletName="Freighter" />);
    const label = screen
      .getByLabelText(/Waiting for signature in Freighter/i)
      .getAttribute("aria-label");

    advance(30000);

    expect(screen.getByLabelText(/Waiting for signature in Freighter/i)).toHaveAttribute(
      "aria-label",
      label as string,
    );
  });
});
