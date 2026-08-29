import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { BookingFlowShell, BookingProgress } from "./booking-progress";

describe("BookingProgress", () => {
  it("renders the legacy booking stage bars", () => {
    render(
      <BookingProgress
        stages={[
          { label: "Reserved", value: 5 },
          { label: "Confirmed", value: 3 },
        ]}
      />,
    );

    expect(screen.getByText("Booking stages")).toBeInTheDocument();
    expect(screen.getByText("Reserved")).toBeInTheDocument();
    expect(screen.getByText("5 bookings")).toBeInTheDocument();
  });
});

describe("BookingFlowShell", () => {
  const steps = [
    {
      id: "details",
      title: "Details",
      description: "Choose the booking details.",
      summary: ["Saturday, May 18", "2 guests"],
      validationSummary: {
        title: "Ready to review",
        items: ["Service selected", "Participants added"],
      },
    },
    {
      id: "payment",
      title: "Payment",
      description: "Review and pay the deposit.",
      summary: ["Visa ending in 4242"],
      validationSummary: {
        title: "Awaiting confirmation",
        items: ["Billing details missing"],
      },
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the sticky booking rail, validation summary, and screen-reader step announcement", () => {
    render(<BookingFlowShell steps={steps} currentStep={1} />);

    expect(
      screen.getByRole("navigation", { name: /booking progress/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Payment" })).toBeInTheDocument();
    expect(screen.getByText("Awaiting confirmation")).toBeInTheDocument();
    expect(screen.getByText("Billing details missing")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Step 2 of 2: Payment",
    );
  });

  it("handles back and next actions and warns before leaving unsaved changes", () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <BookingFlowShell
        steps={steps}
        currentStep={1}
        onBack={onBack}
        onNext={onNext}
        unsavedChanges
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(confirmSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /complete booking/i }));
    expect(onNext).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /complete booking/i }));
    expect(onNext).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledWith(1);
  });
});
