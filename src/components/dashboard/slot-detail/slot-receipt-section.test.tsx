import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SlotReceiptSection } from "./slot-receipt-section";
import { MOCK_WALLET_ADDRESS } from "./slot-detail-data";

describe("SlotReceiptSection", () => {
  const baseProps = {
    slot: {
      id: "slot-1",
      title: "Architecture Review",
      rate: "120 XLM/hr",
      dateLabel: "Mon, Oct 14",
      timeRange: "10:00 AM - 11:30 AM",
    },
    seller: {
      name: "Dr. Sarah Jenkins",
      role: "Lead Product Architect",
    },
    durationHours: 1.5,
    subtotal: 180,
    escrowFee: 2.7,
    stellarFee: 0.0001,
    totalCost: 182.7001,
    effectiveTotalCost: 182.7001,
    discountPercent: 0,
    promoCode: "",
    chargedSnapshot: null,
    isSettled: true,
    txHash: "abcdef1234567890...minted",
    walletAddress: MOCK_WALLET_ADDRESS,
    isReceiptOpen: false,
    isRedeemModalOpen: false,
    onCloseReceipt: vi.fn(),
    onCloseRedeem: vi.fn(),
  };

  it("opens RedeemTokenModal when isRedeemModalOpen is true", () => {
    const onCloseRedeem = vi.fn();
    render(
      <SlotReceiptSection
        {...baseProps}
        isRedeemModalOpen={true}
        onCloseRedeem={onCloseRedeem}
      />,
    );

    expect(screen.getByText("Redeem Time Token")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close modal dialog"));
    expect(onCloseRedeem).toHaveBeenCalledTimes(1);
  });

  it("opens ReceiptModal when settled and isReceiptOpen is true", () => {
    render(<SlotReceiptSection {...baseProps} isReceiptOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
