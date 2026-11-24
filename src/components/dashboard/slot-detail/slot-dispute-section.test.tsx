import { act, render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { SlotDisputeSection } from "./slot-dispute-section";
import { buildNewDispute, createInitialDisputes } from "./slot-detail-data";
import type { DisputeView } from "./use-slot-booking";
import type { DisputeFormData } from "@/components/dashboard/dispute-filing-form";

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

  it("completes the end-to-end dispute filing flow with evidence and shows uploaded evidence in tracking", async () => {
    vi.useFakeTimers();

    function TestHarness() {
      const [view, setView] = useState<DisputeView>("filing");
      const [dispute, setDispute] = useState(initialDispute);
      const handleSubmit = async (formData: DisputeFormData) => {
        setDispute(buildNewDispute("slot-1", formData));
        setView("tracking");
      };
      return (
        <SlotDisputeSection
          isOpen={true}
          slotId="slot-1"
          disputeView={view}
          existingDisputesCount={1}
          currentDispute={dispute}
          isSubmittingDispute={false}
          onClose={vi.fn()}
          onViewChange={setView}
          onSubmitDispute={handleSubmit}
          onAddDisputeNote={vi.fn()}
        />
      );
    }

    render(<TestHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Service Not Delivered/i }));
    fireEvent.change(screen.getByLabelText(/Reason for Dispute/i), {
      target: { value: "Provider missed the scheduled session" },
    });
    fireEvent.change(screen.getByLabelText(/Detailed Description/i), {
      target: {
        value:
          "We waited on the call for 45 minutes and sent three messages with no response from the provider.",
      },
    });

    const uploader = screen.getByRole("button", { name: /Upload evidence files/i });
    const file = new File(["call-log"], "call_log_screenshot.png", { type: "image/png" });
    fireEvent.change(uploader.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });

    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText("Scan Passed")).toBeInTheDocument();

    fireEvent.submit(document.querySelector("form")!);
    await act(async () => {});

    expect(screen.getByText("Dispute Tracking")).toBeInTheDocument();
    expect(screen.getByText("Provider missed the scheduled session")).toBeInTheDocument();
    expect(screen.getByText("call_log_screenshot.png")).toBeInTheDocument();
    expect(screen.getByText("Safe")).toBeInTheDocument();
    expect(screen.getByText("Uploaded")).toBeInTheDocument();

    vi.useRealTimers();
  });
});
