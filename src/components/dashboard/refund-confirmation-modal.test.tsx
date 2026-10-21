import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RefundConfirmationModal } from "./refund-confirmation-modal";
import type { RefundDestinationOption } from "./types";

const mockDestination: RefundDestinationOption = {
  id: "wallet",
  icon: "wallet",
  label: "ChronoPay Wallet",
  recommended: true,
  eta: "Instant",
  fee: "None",
  description: "Refund to your internal ChronoPay wallet."
};

describe("RefundConfirmationModal", () => {
  it("returns null when isOpen is false", () => {
    const { container } = render(
      <RefundConfirmationModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        destination={mockDestination}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders correctly when isOpen is true", () => {
    render(
      <RefundConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        destination={mockDestination}
      />
    );
    expect(screen.getByText("Confirm refund destination")).toBeInTheDocument();
    expect(screen.getByText("ChronoPay Wallet")).toBeInTheDocument();
    expect(screen.getByText("Instant")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("calls onClose when the close (X) button is clicked", () => {
    const onClose = vi.fn();
    render(
      <RefundConfirmationModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        destination={mockDestination}
      />
    );
    const closeButton = screen.getByLabelText("Close confirmation");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(
      <RefundConfirmationModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        destination={mockDestination}
      />
    );
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onConfirm when the Confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <RefundConfirmationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        destination={mockDestination}
      />
    );
    const confirmButton = screen.getByRole("button", { name: "Confirm refund to ChronoPay Wallet" });
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onClose when the Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <RefundConfirmationModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        destination={mockDestination}
      />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
