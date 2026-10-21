import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecurringAvailabilityEditor } from "./recurring-availability-editor";

describe("RecurringAvailabilityEditor", () => {
  it("renders with default values", () => {
    render(<RecurringAvailabilityEditor />);
    expect(screen.getByRole("radiogroup", { name: "Frequency" })).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });

  it("shows weekday selector for weekly frequency", () => {
    render(<RecurringAvailabilityEditor />);
    const groups = screen.getAllByRole("group", { name: "Days of the week" });
    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  it("hides weekday selector for daily frequency", () => {
    render(<RecurringAvailabilityEditor />);
    fireEvent.click(screen.getByRole("radio", { name: "Daily" }));
    const groups = screen.queryAllByRole("group", { name: "Days of the week" });
    expect(groups.length).toBe(0);
  });

  it("shows weekday selector for monthly frequency", () => {
    render(<RecurringAvailabilityEditor />);
    fireEvent.click(screen.getByRole("radio", { name: "Daily" }));
    let groups = screen.queryAllByRole("group", { name: "Days of the week" });
    expect(groups.length).toBe(0);
    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));
    groups = screen.getAllByRole("group", { name: "Days of the week" });
    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  it("toggles weekday checkboxes", () => {
    render(<RecurringAvailabilityEditor />);
    const monBtn = screen.getByRole("checkbox", { name: "Mon" });
    expect(monBtn).toHaveAttribute("aria-checked", "false");
    fireEvent.click(monBtn);
    expect(monBtn).toHaveAttribute("aria-checked", "true");
    fireEvent.click(monBtn);
    expect(monBtn).toHaveAttribute("aria-checked", "false");
  });

  it("shows validation when no weekdays selected", () => {
    render(<RecurringAvailabilityEditor />);
    const allWeekdays = screen.getAllByRole("checkbox");
    allWeekdays.forEach((btn) => {
      if (btn.getAttribute("aria-checked") === "true") {
        fireEvent.click(btn);
      }
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Select at least one day");
  });

  it("changes interval value", () => {
    render(<RecurringAvailabilityEditor />);
    const input = screen.getByLabelText("Every");
    fireEvent.change(input, { target: { value: "3" } });
    expect(input).toHaveValue(3);
  });

  it("clamps interval to minimum 1", () => {
    render(<RecurringAvailabilityEditor />);
    const input = screen.getByLabelText("Every");
    fireEvent.change(input, { target: { value: "0" } });
    expect(input).toHaveValue(1);
  });

  it("switches end condition to count and shows occurrences input", () => {
    render(<RecurringAvailabilityEditor />);
    fireEvent.click(screen.getByRole("radio", { name: "After" }));
    expect(screen.getByLabelText("Number of occurrences")).toBeInTheDocument();
  });

  it("switches end condition to date and shows date input", () => {
    render(<RecurringAvailabilityEditor />);
    fireEvent.click(screen.getByRole("radio", { name: "On date" }));
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  it("shows summary text for default configuration", () => {
    render(<RecurringAvailabilityEditor />);
    const summary = screen.getByText(/every week on/i);
    expect(summary).toBeInTheDocument();
  });

  it("shows preview list with formatted dates", () => {
    render(<RecurringAvailabilityEditor />);
    expect(screen.getByText("Next occurrences")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("updates preview when changing frequency to daily", () => {
    render(<RecurringAvailabilityEditor />);
    fireEvent.click(screen.getByRole("radio", { name: "Daily" }));
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("renders summary with aria-live region", () => {
    render(<RecurringAvailabilityEditor />);
    const summaryRegion = screen.getByText(/every week on/i).closest('[aria-live="polite"]');
    expect(summaryRegion).toBeInTheDocument();
  });

  it("renders screen-reader live region", () => {
    render(<RecurringAvailabilityEditor />);
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  it("announces frequency change via live region", () => {
    render(<RecurringAvailabilityEditor />);
    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent(/frequency changed to monthly/i);
  });

  it("radio group supports arrow key navigation (right arrow)", () => {
    render(<RecurringAvailabilityEditor />);
    const dailyBtn = screen.getByRole("radio", { name: "Daily" });
    const weeklyBtn = screen.getByRole("radio", { name: "Weekly" });
    dailyBtn.focus();
    fireEvent.keyDown(dailyBtn, { key: "ArrowRight" });
    expect(weeklyBtn).toHaveFocus();
  });

  it("radio group supports arrow key navigation (left arrow)", () => {
    render(<RecurringAvailabilityEditor />);
    const dailyBtn = screen.getByRole("radio", { name: "Daily" });
    const monthlyBtn = screen.getByRole("radio", { name: "Monthly" });
    dailyBtn.focus();
    fireEvent.keyDown(dailyBtn, { key: "ArrowLeft" });
    expect(monthlyBtn).toHaveFocus();
  });

  it("radio group supports arrow key navigation (down arrow)", () => {
    render(<RecurringAvailabilityEditor />);
    const dailyBtn = screen.getByRole("radio", { name: "Daily" });
    const weeklyBtn = screen.getByRole("radio", { name: "Weekly" });
    dailyBtn.focus();
    fireEvent.keyDown(dailyBtn, { key: "ArrowDown" });
    expect(weeklyBtn).toHaveFocus();
  });

  it("end condition radio group supports arrow key navigation", () => {
    render(<RecurringAvailabilityEditor />);
    const neverBtn = screen.getByRole("radio", { name: "Never" });
    const afterBtn = screen.getByRole("radio", { name: "After" });
    neverBtn.focus();
    fireEvent.keyDown(neverBtn, { key: "ArrowRight" });
    expect(afterBtn).toHaveFocus();
  });

  it("does not show preview when all weekdays are deselected", () => {
    render(<RecurringAvailabilityEditor />);
    const allWeekdays = screen.getAllByRole("checkbox");
    allWeekdays.forEach((btn) => {
      if (btn.getAttribute("aria-checked") === "true") {
        fireEvent.click(btn);
      }
    });
    expect(screen.getByText("No occurrences to preview.")).toBeInTheDocument();
  });

  it("uses PanelShell wrapper with title and description", () => {
    render(<RecurringAvailabilityEditor />);
    expect(screen.getByText("Recurring Availability")).toBeInTheDocument();
    expect(
      screen.getByText("Set up recurring availability with a custom recurrence rule."),
    ).toBeInTheDocument();
  });

  it("has focus-visible style classes on interactive elements", () => {
    render(<RecurringAvailabilityEditor />);
    const buttons = screen.getAllByRole("radio");
    buttons.forEach((btn) => {
      expect(btn.className).toContain("focus-visible");
    });
  });

  it("interval label updates when frequency changes", () => {
    render(<RecurringAvailabilityEditor />);
    expect(screen.getByText("weeks")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Daily" }));
    expect(screen.getByText("days")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));
    expect(screen.getByText("months")).toBeInTheDocument();
  });

  it("changes end count value", () => {
    render(<RecurringAvailabilityEditor />);
    fireEvent.click(screen.getByRole("radio", { name: "After" }));
    const countInput = screen.getByLabelText("Number of occurrences");
    fireEvent.change(countInput, { target: { value: "5" } });
    expect(countInput).toHaveValue(5);
  });
});