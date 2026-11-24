import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SlotCheckoutModal } from "./slot-checkout-modal";

describe("SlotCheckoutModal", () => {
  const baseProps = {
    isOpen: true,
    purchaseStep: "auth" as const,
    slotId: "slot-1",
    slotTitle: "Architecture Review",
    slotDateLabel: "Mon, Oct 14",
    sellerName: "Dr. Sarah Jenkins",
    giftDetails: null,
    escrowFee: 2.7,
    stellarFee: 0.0001,
    effectiveTotalCost: 182.7001,
    chargedSnapshot: null,
    loadingMessage: "Initiating Stellar transaction...",
    txHash: "abc123...minted",
    onClose: vi.fn(),
    onProceedToConfirm: vi.fn(),
    onProceedPurchase: vi.fn(),
    onOpenRedeem: vi.fn(),
    onOpenReceipt: vi.fn(),
  };

  it("renders nothing when closed", () => {
    const { container } = render(<SlotCheckoutModal {...baseProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders auth step and advances to confirm", () => {
    render(<SlotCheckoutModal {...baseProps} purchaseStep="auth" />);

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby", "modal-headline");
    expect(screen.getByText("How would you like to continue?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
    expect(baseProps.onProceedToConfirm).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Close modal dialog"));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it("renders confirm, loading, and success steps with expected actions", () => {
    const { rerender } = render(<SlotCheckoutModal {...baseProps} purchaseStep="confirm" />);
    expect(screen.getByText("Confirm Escrow Booking")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Confirm & Lock Funds/i }));
    expect(baseProps.onProceedPurchase).toHaveBeenCalled();

    rerender(<SlotCheckoutModal {...baseProps} purchaseStep="loading" />);
    expect(screen.getByText("Stellar Blockchain Syncing")).toBeInTheDocument();
    expect(screen.queryByLabelText("Close modal dialog")).not.toBeInTheDocument();

    rerender(<SlotCheckoutModal {...baseProps} purchaseStep="success" />);
    expect(screen.getByText("Time Token Purchased")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Redeem Time Token" }));
    expect(baseProps.onOpenRedeem).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /View Receipt/i }));
    expect(baseProps.onOpenReceipt).toHaveBeenCalled();
  });
});
