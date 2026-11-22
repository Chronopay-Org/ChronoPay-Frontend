import React, { Suspense } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils/render";
import SlotDetailPage from "@/app/dashboard/slots/[id]/page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/slots/slot-1",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Slot booking flow (promo apply -> purchase -> redeem -> receipt)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("chronopay:role", "buyer");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(min-width: 1024px)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies a promo code, completes purchase, redeems the token, and opens the receipt", async () => {
    const params = Promise.resolve({ id: "slot-1" });

    await act(async () => {
      renderWithProviders(
        <Suspense fallback={null}>
          <SlotDetailPage params={params} />
        </Suspense>,
      );
      await params;
    });

    // Flush the mount-time setTimeout(0) that resets discount state
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // 1. Expand PromoCodeEntry and apply SAVE20 (20% off)
    fireEvent.click(screen.getByRole("button", { name: /Add promo code/i }));

    const promoInput = screen.getByPlaceholderText("Enter code");
    fireEvent.change(promoInput, { target: { value: "SAVE20" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    // PromoCodeEntry validates after 500ms
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/SAVE20 applied/i)).toBeInTheDocument();
    expect(screen.getByText(/20% promo applied/i)).toBeInTheDocument();

    // 2. Open checkout modal and complete simulated purchase
    fireEvent.click(
      screen.getByRole("button", { name: /Purchase Time Token/i }),
    );

    const checkoutDialog = screen.getByRole("dialog", {
      name: /How would you like to continue\?/i,
    });
    expect(
      within(checkoutDialog).getByText(/How would you like to continue\?/i),
    ).toBeInTheDocument();

    fireEvent.click(
      within(checkoutDialog).getByRole("button", { name: /Continue as Guest/i }),
    );

    expect(
      within(checkoutDialog).getByText(/Confirm Escrow Booking/i),
    ).toBeInTheDocument();

    fireEvent.click(
      within(checkoutDialog).getByRole("button", {
        name: /Confirm & Lock Funds/i,
      }),
    );

    expect(
      within(checkoutDialog).getByText(/Stellar Blockchain Syncing/i),
    ).toBeInTheDocument();

    // Advance past the 4000ms simulated settlement timer
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    expect(
      within(checkoutDialog).getByText(/Time Token Purchased/i),
    ).toBeInTheDocument();

    // Verify external ledger transaction link
    const ledgerLink = within(checkoutDialog).getByRole("link", {
      name: /View Ledger Transaction/i,
    });
    expect(ledgerLink).toHaveAttribute("href", "https://stellar.expert");

    // 3. Open RedeemTokenModal and complete redemption
    fireEvent.click(
      within(checkoutDialog).getByRole("button", {
        name: /Redeem Time Token/i,
      }),
    );

    const redeemDialog = screen.getByRole("dialog", {
      name: /Redeem Time Token/i,
    });
    expect(
      within(redeemDialog).getAllByText(/CHR-SLOT-1-/i).length,
    ).toBeGreaterThanOrEqual(1);

    fireEvent.click(
      within(redeemDialog).getByRole("button", {
        name: /Simulate Supplier Scan/i,
      }),
    );

    expect(
      within(redeemDialog).getByText(/Waiting for Supplier/i),
    ).toBeInTheDocument();

    // Advance past the 2000ms supplier confirmation timer
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(
      within(redeemDialog).getByText(/Token Redeemed!/i),
    ).toBeInTheDocument();

    // Close RedeemTokenModal
    fireEvent.click(within(redeemDialog).getByRole("button", { name: "Done" }));

    // 4. Open ReceiptModal from the settled purchase dialog
    fireEvent.click(
      within(checkoutDialog).getByRole("button", { name: /View Receipt/i }),
    );

    const receiptDialog = screen
      .getAllByRole("dialog")
      .find((dialog) => within(dialog).queryByText(/SAVE20/i) !== null);
    expect(receiptDialog).toBeDefined();
    expect(within(receiptDialog!).getByText(/SAVE20/i)).toBeInTheDocument();
  });
});
