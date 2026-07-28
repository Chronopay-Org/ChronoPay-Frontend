import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OnboardingWidget } from "./onboarding-widget";

describe("OnboardingWidget", () => {
  it("renders the onboarding tasks", () => {
    render(<OnboardingWidget />);
    
    expect(screen.getByText("Setup Guide")).toBeInTheDocument();
    expect(screen.getByText("Connect wallet")).toBeInTheDocument();
    expect(screen.getByText("Add availability")).toBeInTheDocument();
    expect(screen.getByText("First booking")).toBeInTheDocument();
  });

  it("updates progress when tasks are checked", () => {
    render(<OnboardingWidget />);
    
    // Initially 1/3 tasks completed -> 33%
    expect(screen.getByText("33%")).toBeInTheDocument();

    const addAvailabilityCheckbox = screen.getByLabelText("Mark Add availability as complete");
    fireEvent.click(addAvailabilityCheckbox);

    // 2/3 tasks completed -> 67%
    expect(screen.getByText("67%")).toBeInTheDocument();

    const firstBookingCheckbox = screen.getByLabelText("Mark First booking as complete");
    fireEvent.click(firstBookingCheckbox);

    // 3/3 tasks completed -> 100%
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows dismiss option when all tasks are complete and handles dismiss flow", () => {
    render(<OnboardingWidget />);

    const addAvailabilityCheckbox = screen.getByLabelText("Mark Add availability as complete");
    fireEvent.click(addAvailabilityCheckbox);
    
    const firstBookingCheckbox = screen.getByLabelText("Mark First booking as complete");
    fireEvent.click(firstBookingCheckbox);

    // Now all complete, dismiss button should be visible
    const dismissButton = screen.getByRole("button", { name: "Dismiss Widget" });
    expect(dismissButton).toBeInTheDocument();

    // Click dismiss -> show confirm
    fireEvent.click(dismissButton);
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: "Confirm Dismiss" });
    expect(confirmButton).toBeInTheDocument();

    // Confirm dismiss -> widget disappears
    fireEvent.click(confirmButton);
    expect(screen.queryByText("Setup Guide")).not.toBeInTheDocument();
  });

  it("allows cancelling the dismiss flow", () => {
    render(<OnboardingWidget />);

    const addAvailabilityCheckbox = screen.getByLabelText("Mark Add availability as complete");
    fireEvent.click(addAvailabilityCheckbox);
    
    const firstBookingCheckbox = screen.getByLabelText("Mark First booking as complete");
    fireEvent.click(firstBookingCheckbox);

    const dismissButton = screen.getByRole("button", { name: "Dismiss Widget" });
    fireEvent.click(dismissButton);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    // Should be back to dismiss button
    expect(screen.getByRole("button", { name: "Dismiss Widget" })).toBeInTheDocument();
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });
});
