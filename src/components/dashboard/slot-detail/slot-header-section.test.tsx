import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SlotHeaderSection, SlotHeaderTopBar } from "./slot-header-section";
import { slotDetailsMap } from "./slot-detail-data";
import { slots as mockSlots } from "@/components/dashboard/dashboard-data";

describe("SlotHeaderSection & SlotHeaderTopBar", () => {
  const slot = mockSlots[0];
  const details = slotDetailsMap["slot-1"];

  it("renders breadcrumbs, simulator controls, and invokes callbacks", () => {
    const onSimWalletChange = vi.fn();
    const onSimBalanceChange = vi.fn();

    render(
      <SlotHeaderTopBar
        slotId="slot-1"
        simWallet="connected"
        simBalance="sufficient"
        onSimWalletChange={onSimWalletChange}
        onSimBalanceChange={onSimBalanceChange}
      />,
    );

    expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Scenario Simulator")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "disconnected" }));
    expect(onSimWalletChange).toHaveBeenCalledWith("disconnected");

    fireEvent.click(screen.getByRole("button", { name: "50 XLM" }));
    expect(onSimBalanceChange).toHaveBeenCalledWith("insufficient");
  });

  it("renders slot overview and seller information with accessible supplier link", () => {
    render(<SlotHeaderSection slot={slot} details={details} />);

    expect(screen.getByRole("heading", { level: 1, name: slot.title })).toBeInTheDocument();
    expect(screen.getByText(details.seller.name)).toBeInTheDocument();
    expect(screen.getByText("Verified Seller")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `View ${details.seller.name}'s profile with availability, reviews, and policies`,
      }),
    ).toBeInTheDocument();
  });
});
