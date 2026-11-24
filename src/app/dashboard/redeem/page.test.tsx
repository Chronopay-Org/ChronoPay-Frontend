import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RedeemPage from "./page";

vi.mock("@/app/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));

vi.mock("@/app/components/ui/breadcrumb-overflow", () => ({
  BreadcrumbOverflow: () => <nav aria-label="Breadcrumb" />,
}));

describe("RedeemPage (/dashboard/redeem)", () => {
  beforeEach(() => {
    Object.defineProperty(global.navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
    });
  });

  it("redeems a valid slot code, updates its status, and returns already_redeemed on repeat", async () => {
    render(<RedeemPage />);

    const slotRow = screen.getByTestId("redeem-slot-slot-1");
    expect(within(slotRow).getByText("Ready to redeem")).toBeInTheDocument();

    const input = screen.getByLabelText(/manual code entry/i);
    fireEvent.change(input, { target: { value: "CHRONO-SLOT-1" } });
    fireEvent.click(screen.getByRole("button", { name: /^Verify$/i }));

    await waitFor(() => {
      expect(screen.getByText(/^Valid — redeem now$/i)).toBeInTheDocument();
    });
    expect(within(slotRow).getByText("Redeemed")).toBeInTheDocument();

    // Scanning the same code again reports already_redeemed
    fireEvent.click(screen.getByRole("button", { name: /scan next code/i }));
    fireEvent.change(input, { target: { value: "CHRONO-SLOT-1" } });
    fireEvent.click(screen.getByRole("button", { name: /^Verify$/i }));

    await waitFor(() => {
      expect(screen.getByText(/^Already redeemed$/i)).toBeInTheDocument();
    });
  });

  it("shows expired state for an expired slot code", async () => {
    render(<RedeemPage />);

    const input = screen.getByLabelText(/manual code entry/i);
    fireEvent.change(input, { target: { value: "CHRONO-SLOT-3" } });
    fireEvent.click(screen.getByRole("button", { name: /^Verify$/i }));

    await waitFor(() => {
      expect(screen.getByText(/^Expired$/i)).toBeInTheDocument();
    });
  });

  it("shows already_redeemed state for an already redeemed slot code", async () => {
    render(<RedeemPage />);

    const input = screen.getByLabelText(/manual code entry/i);
    fireEvent.change(input, { target: { value: "CHRONO-SLOT-4" } });
    fireEvent.click(screen.getByRole("button", { name: /^Verify$/i }));

    await waitFor(() => {
      expect(screen.getByText(/^Already redeemed$/i)).toBeInTheDocument();
    });
  });

  it("surfaces an alert for an unknown code", async () => {
    render(<RedeemPage />);

    const input = screen.getByLabelText(/manual code entry/i);
    fireEvent.change(input, { target: { value: "CHRONO-UNKNOWN" } });
    fireEvent.click(screen.getByRole("button", { name: /^Verify$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/No slot found/i);
    });
  });
});
