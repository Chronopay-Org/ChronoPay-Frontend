import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SlotDisputeSection } from "./slot-dispute-section";
import { createInitialDisputes } from "./slot-detail-data";

describe("SlotDisputeSection", () => {
  const initialDispute = createInitialDisputes("slot-1")[0];

  it("renders nothing when closed", () => {
    const { container } = render(
      <SlotDisputeSection
        isOpen={false}
        slotId="slot-1"
        disputeView="tracking"
        existingDisputesCount={1}
        currentDispute={initialDispute}
        isSubmittingDispute={false}
        onClose={vi.fn()}
        onViewChange={vi.fn()}
        onSubmitDispute={vi.fn()}
        onAddDisputeNote={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders tracking view, view toggle, and close button with accessible label", () => {
    const onClose = vi.fn();
    const onViewChange = vi.fn();

    render(
      <SlotDisputeSection
        isOpen={true}
        slotId="slot-1"
        disputeView="tracking"
        existingDisputesCount={1}
        currentDispute={initialDispute}
        isSubmittingDispute={false}
        onClose={onClose}
        onViewChange={onViewChange}
        onSubmitDispute={vi.fn()}
        onAddDisputeNote={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-labelledby",
      "dispute-modal-headline",
    );
    expect(screen.getByText("Dispute Tracking")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "File New Dispute" }));
    expect(onViewChange).toHaveBeenCalledWith("filing");

    fireEvent.click(screen.getByLabelText("Close dispute modal"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
