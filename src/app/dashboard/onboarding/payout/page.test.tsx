import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PayoutOnboardingPage from "./page";

describe("PayoutOnboardingPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the PayoutOnboardingPage and its core content", () => {
    render(<PayoutOnboardingPage />);
    
    expect(screen.getByText("Payout account")).toBeInTheDocument();
    expect(
      screen.getByText(/Configure how and where you receive payouts/i)
    ).toBeInTheDocument();
    expect(screen.getByText("ChronoPay")).toBeInTheDocument();
    expect(screen.getByText("Freighter Wallet")).toBeInTheDocument();
  });

  it("handles representative invalid inputs (saving without consent)", async () => {
    render(<PayoutOnboardingPage />);
    
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    // PayoutStep shows an error message for missing consent
    expect(
      await screen.findByText(/You must agree/i)
    ).toBeInTheDocument();
  });

  it("handles primary state transitions (consent -> save)", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    
    render(<PayoutOnboardingPage />);
    
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await vi.runAllTimersAsync();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Saved payout settings",
      expect.objectContaining({
        currency: expect.any(String),
        consent: expect.objectContaining({
          termsAccepted: true,
        })
      })
    );
  });
});
