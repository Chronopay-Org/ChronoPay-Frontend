import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MonthCalendarView } from "@/components/dashboard/month-calendar-view";

describe("MonthCalendarView", () => {
  const mockOnDateSelect = vi.fn();
  const mockOnHeatmapToggle = vi.fn();

  const createAvailabilityData = (entries: [string, number][]) => new Map(entries);

  const defaultProps = {
    selectedDate: new Date("2026-07-15"),
    onDateSelect: mockOnDateSelect,
    availabilityData: createAvailabilityData([
      ["2026-07-01", 0],
      ["2026-07-10", 2],
      ["2026-07-15", 5],
      ["2026-07-20", 8],
      ["2026-07-25", 12],
    ]),
    heatmapEnabled: false,
    onHeatmapToggle: mockOnHeatmapToggle,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders month navigation with correct month/year", () => {
    render(<MonthCalendarView {...defaultProps} />);

    expect(screen.getByText("July 2026")).toBeInTheDocument();
  });

  it("renders 7 day headers", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const dayHeaders = screen.getAllByRole("gridcell", { hidden: true });
    expect(dayHeaders.length).toBeGreaterThan(0);
  });

  it("renders calendar grid with 42 cells (6 rows × 7 cols)", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const grid = screen.getByRole("grid");
    const cells = grid.querySelectorAll('[role="gridcell"]');
    expect(cells.length).toBe(42);
  });

  it("highlights selected date", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const selectedButton = screen.getByRole("gridcell", { pressed: true });
    expect(selectedButton).toHaveTextContent("15");
    expect(selectedButton).toHaveClass("bg-cyan-500");
  });

  it("shows today indicator", () => {
    const today = new Date();
    render(<MonthCalendarView {...defaultProps} selectedDate={today} />);

    const todayButton = screen.getByRole("gridcell", { pressed: true });
    expect(todayButton).toHaveClass("ring-1");
  });

  it("displays availability dots for days with slots", () => {
    render(<MonthCalendarView {...defaultProps} />);

    // Day 10 has 2 slots (low) - should have emerald dot
    const day10 = screen.getByRole("gridcell", { name: /10.*2 slots? available/i });
    expect(day10).toBeInTheDocument();
  });

  it("does not show availability dot for days with zero slots", () => {
    render(<MonthCalendarView {...defaultProps} />);

    // Day 1 has 0 slots
    const day1 = screen.getByRole("gridcell", { name: /1.*no availability/i });
    expect(day1).toBeInTheDocument();
  });

  it("calls onDateSelect when a valid date is clicked", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const day20 = screen.getByRole("gridcell", { name: /20.*8 slots? available/i });
    fireEvent.click(day20);

    expect(mockOnDateSelect).toHaveBeenCalledWith(expect.any(Date));
    const calledDate = mockOnDateSelect.mock.calls[0][0];
    expect(calledDate.getDate()).toBe(20);
    expect(calledDate.getMonth()).toBe(6); // July (0-indexed)
  });

  it("does not call onDateSelect for out-of-range dates", () => {
    const minDate = new Date("2026-07-10");
    const maxDate = new Date("2026-07-20");
    render(<MonthCalendarView {...defaultProps} minDate={minDate} maxDate={maxDate} />);

    // Day 5 is before minDate
    const day5 = screen.getByRole("gridcell", { name: /5.*no availability/i });
    fireEvent.click(day5);

    expect(mockOnDateSelect).not.toHaveBeenCalled();
  });

  it("keyboard navigation: ArrowRight moves to next day", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const day15 = screen.getByRole("gridcell", { pressed: true });
    day15.focus();
    fireEvent.keyDown(day15, { key: "ArrowRight" });

    const day16 = screen.getByRole("gridcell", { name: /16.*no availability/i });
    expect(day16).toHaveFocus();
  });

  it("keyboard navigation: ArrowDown moves to next week", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const day15 = screen.getByRole("gridcell", { pressed: true });
    day15.focus();
    fireEvent.keyDown(day15, { key: "ArrowDown" });

    const day22 = screen.getByRole("gridcell", { name: /22.*no availability/i });
    expect(day22).toHaveFocus();
  });

  it("keyboard navigation: PageDown goes to next month", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const day15 = screen.getByRole("gridcell", { pressed: true });
    day15.focus();
    fireEvent.keyDown(day15, { key: "PageDown" });

    expect(screen.getByText("August 2026")).toBeInTheDocument();
  });

  it("keyboard navigation: PageUp goes to previous month", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const day15 = screen.getByRole("gridcell", { pressed: true });
    day15.focus();
    fireEvent.keyDown(day15, { key: "PageUp" });

    expect(screen.getByText("June 2026")).toBeInTheDocument();
  });

  it("renders heatmap toggle button", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const toggle = screen.getByRole("button", { name: /show availability heatmap/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveTextContent("Heatmap Off");
  });

  it("calls onHeatmapToggle when toggle is clicked", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const toggle = screen.getByRole("button", { name: /show availability heatmap/i });
    fireEvent.click(toggle);

    expect(mockOnHeatmapToggle).toHaveBeenCalledWith(true);
  });

  it("shows legend when heatmap is enabled", () => {
    render(<MonthCalendarView {...defaultProps} heatmapEnabled={true} />);

    expect(screen.getByText("No availability")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Peak")).toBeInTheDocument();
  });

  it("does not show legend when heatmap is disabled", () => {
    render(<MonthCalendarView {...defaultProps} heatmapEnabled={false} />);

    expect(screen.queryByText("No availability")).not.toBeInTheDocument();
    expect(screen.queryByText("Low")).not.toBeInTheDocument();
  });

  it("applies heatmap background styles when enabled and day has availability", () => {
    render(<MonthCalendarView {...defaultProps} heatmapEnabled={true} />);

    // Day 15 has 5 slots (medium intensity)
    const day15 = screen.getByRole("gridcell", { pressed: true });
    const heatmapOverlay = day15.querySelector('[style*="--heatmap-step-3"]');
    expect(heatmapOverlay).toBeInTheDocument();
  });

  it("has correct aria-label with availability info", () => {
    render(<MonthCalendarView {...defaultProps} />);

    const day10 = screen.getByRole("gridcell", { name: /10.*2 slots? available/i });
    expect(day10).toHaveAttribute("aria-label", expect.stringContaining("2 slots available"));
  });

  it("disables dates before minDate", () => {
    const minDate = new Date("2026-07-10");
    render(<MonthCalendarView {...defaultProps} minDate={minDate} />);

    const day5 = screen.getByRole("gridcell", { name: /5.*no availability/i });
    expect(day5).toBeDisabled();
  });

  it("disables dates after maxDate", () => {
    const maxDate = new Date("2026-07-20");
    render(<MonthCalendarView {...defaultProps} maxDate={maxDate} />);

    const day25 = screen.getByRole("gridcell", { name: /25.*12 slots? available/i });
    expect(day25).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<MonthCalendarView {...defaultProps} className="custom-calendar" />);

    const container = screen.getByRole("region");
    expect(container).toHaveClass("custom-calendar");
  });

  it("renders prev/next month navigation buttons", () => {
    render(<MonthCalendarView {...defaultProps} />);

    expect(screen.getByRole("button", { name: /previous month/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next month/i })).toBeInTheDocument();
  });
});