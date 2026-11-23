import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SlotPricingSection } from "./slot-pricing-section";

describe("SlotPricingSection", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
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
  const baseProps = {
    rate: "120 XLM/hr",
    durationHours: 1.5,
    subtotal: 180,
    escrowFee: 2.7,
    stellarFee: 0.0001,
    totalCost: 182.7001,
    discountPercent: 0,
    discountedTotal: 182.7001,
    effectiveTotalCost: 182.7001,
    simWallet: "connected" as const,
    isWalletReady: true,
    hasFunds: true,
    availableFunds: 1500,
    displayAddress: "GCDQ7M...A5V8E1C",
    onGiftChange: vi.fn(),
    onDiscountApplied: vi.fn(),
    actions: <button type="button">Purchase Time Token</button>,
  };

  it("renders connected wallet banner and cost breakdown", () => {
    render(<SlotPricingSection {...baseProps} />);

    expect(screen.getByText("Purchase Details")).toBeInTheDocument();
    expect(screen.getByText("Connected Wallet")).toBeInTheDocument();
    expect(screen.getByText("180.00 XLM")).toBeInTheDocument();
    expect(screen.getByText("Base total")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Purchase Time Token" })).toBeInTheDocument();
  });

  it("renders discounted total when a promo is applied", () => {
    render(
      <SlotPricingSection
        {...baseProps}
        discountPercent={10}
        discountedTotal={164.4301}
        effectiveTotalCost={164.4301}
      />,
    );

    expect(screen.getByText("Discounted total")).toBeInTheDocument();
    expect(screen.getByText("10% promo applied")).toBeInTheDocument();
  });

  it("renders disconnected and insufficient balance banners appropriately", () => {
    const { rerender } = render(
      <SlotPricingSection {...baseProps} simWallet="disconnected" isWalletReady={false} />,
    );
    expect(screen.getByText("Stellar Wallet Disconnected")).toBeInTheDocument();

    rerender(<SlotPricingSection {...baseProps} hasFunds={false} availableFunds={50} />);
    expect(screen.getByText("Insufficient Balance")).toBeInTheDocument();
  });
});
