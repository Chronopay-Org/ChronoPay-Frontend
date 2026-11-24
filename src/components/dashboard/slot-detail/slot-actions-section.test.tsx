import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SlotActionsSection } from "./slot-actions-section";

describe("SlotActionsSection", () => {
  const handlers = {
    onConnectWallet: vi.fn(),
    onRetryConnection: vi.fn(),
    onOpenPurchase: vi.fn(),
    onOpenDispute: vi.fn(),
  };

  it("renders Purchase Time Token and View Dispute when wallet is ready with funds", () => {
    render(
      <SlotActionsSection
        simWallet="connected"
        isWalletReady={true}
        hasFunds={true}
        existingDisputesCount={1}
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Purchase Time Token" }));
    expect(handlers.onOpenPurchase).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /View Dispute \(1\)/i }));
    expect(handlers.onOpenDispute).toHaveBeenCalledTimes(1);
  });

  it("renders Connect Stellar Wallet when disconnected", () => {
    render(
      <SlotActionsSection
        simWallet="disconnected"
        isWalletReady={false}
        hasFunds={true}
        existingDisputesCount={0}
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Connect Stellar Wallet/i }));
    expect(handlers.onConnectWallet).toHaveBeenCalled();
  });

  it("renders disabled Insufficient Stellar Funds when balance is too low", () => {
    render(
      <SlotActionsSection
        simWallet="connected"
        isWalletReady={true}
        hasFunds={false}
        existingDisputesCount={0}
        {...handlers}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Insufficient Stellar Funds" }),
    ).toBeDisabled();
  });
});
