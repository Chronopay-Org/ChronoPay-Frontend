import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { SigningSkeleton } from "@/components/checkout/SigningSkeleton";

describe("SigningSkeleton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the waiting-for-signature message", () => {
    render(
      <SigningSkeleton walletName="Freighter" onCancel={vi.fn()} />,
    );

    // The message appears both in a visible <p> and an sr-only <span>
    const messages = screen.getAllByText(/Waiting for signature/i);
    expect(messages.length).toBeGreaterThanOrEqual(1);
    // "Freighter" also appears in the visible <span> and sr-only <span>
    const freighterElements = screen.getAllByText(/Freighter/i);
    expect(freighterElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders with default 'wallet' text when no wallet name is provided", () => {
    render(<SigningSkeleton />);

    const messages = screen.getAllByText(/wallet/i);
    expect(messages.length).toBeGreaterThanOrEqual(1);
  });

  it("shows cancel button when onCancel is provided", () => {
    const onCancel = vi.fn();
    render(
      <SigningSkeleton walletName="Freighter" onCancel={onCancel} />,
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it("does not show cancel button when onCancel is not provided", () => {
    render(<SigningSkeleton walletName="Albedo" />);

    expect(
      screen.queryByRole("button", { name: /Cancel/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a help link", () => {
    render(<SigningSkeleton walletName="Freighter" />);

    const helpLink = screen.getByText(/Help with signing/i);
    expect(helpLink).toBeInTheDocument();
    expect(helpLink).toHaveAttribute("href", "https://docs.chronopay.dev/wallet-signing");
    expect(helpLink).toHaveAttribute("target", "_blank");
    expect(helpLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("uses custom helpHref when provided", () => {
    render(
      <SigningSkeleton
        walletName="Freighter"
        helpHref="https://example.com/help"
      />,
    );

    const helpLink = screen.getByText(/Help with signing/i);
    expect(helpLink).toHaveAttribute("href", "https://example.com/help");
  });

  it("does not show elapsed time badge before 10 seconds", () => {
    render(<SigningSkeleton walletName="Freighter" />);

    expect(screen.queryByText(/Elapsed/i)).not.toBeInTheDocument();
  });

  it("shows elapsed time badge after 10 seconds", () => {
    render(<SigningSkeleton walletName="Freighter" />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText(/Elapsed/i)).toBeInTheDocument();
    expect(screen.getByText(/10s/i)).toBeInTheDocument();
  });

  it("updates elapsed time badge every second", () => {
    render(<SigningSkeleton walletName="Freighter" />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText(/10s/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/15s/i)).toBeInTheDocument();
  });

  it("shows minutes in elapsed time badge after 60 seconds", () => {
    render(<SigningSkeleton walletName="Freighter" />);

    act(() => {
      vi.advanceTimersByTime(61000);
    });

    expect(screen.getByText(/1m 1s/i)).toBeInTheDocument();
  });

  it("has a live region with status role for screen readers", () => {
    render(<SigningSkeleton walletName="Freighter" />);

    const liveRegions = screen.getAllByRole("status");
    expect(liveRegions.length).toBeGreaterThanOrEqual(1);
  });

  it("sets aria-busy to true on the container", () => {
    render(<SigningSkeleton walletName="Freighter" />);

    const container = screen.getByLabelText(
      /Waiting for signature in Freighter/i,
    );
    expect(container).toHaveAttribute("aria-busy", "true");
  });
});
