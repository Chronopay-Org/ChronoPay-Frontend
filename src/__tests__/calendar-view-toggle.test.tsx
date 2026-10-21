import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CalendarViewToggle } from "@/components/dashboard/calendar-view-toggle";

describe("CalendarViewToggle", () => {
  const mockOnModeChange = vi.fn();
  const mockOnHeatmapToggle = vi.fn();

  it("renders all four view modes", () => {
    render(
      <CalendarViewToggle
        currentMode="month"
        onModeChange={mockOnModeChange}
      />
    );

    expect(screen.getByRole("tab", { name: /Month/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Week/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Day/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Agenda/i })).toBeInTheDocument();
  });

  it("highlights active mode", () => {
    render(
      <CalendarViewToggle
        currentMode="week"
        onModeChange={mockOnModeChange}
      />
    );

    const weekTab = screen.getByRole("tab", { name: /Week/i });
    expect(weekTab).toHaveAttribute("aria-selected", "true");
    expect(weekTab).toHaveClass("bg-cyan-500/20");
    expect(weekTab).toHaveClass("text-cyan-100");
  });

  it("calls onModeChange when tab clicked", () => {
    render(
      <CalendarViewToggle
        currentMode="month"
        onModeChange={mockOnModeChange}
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: /Agenda/i }));
    expect(mockOnModeChange).toHaveBeenCalledWith("agenda");
  });

  it("keyboard navigation with arrow keys", () => {
    render(
      <CalendarViewToggle
        currentMode="month"
        onModeChange={mockOnModeChange}
      />
    );

    const monthTab = screen.getByRole("tab", { name: /Month/i });
    monthTab.focus();

    fireEvent.keyDown(monthTab, { key: "ArrowRight" });
    expect(mockOnModeChange).toHaveBeenCalledWith("week");

    fireEvent.keyDown(screen.getByRole("tab", { name: /Week/i }), { key: "ArrowRight" });
    expect(mockOnModeChange).toHaveBeenCalledWith("day");

    fireEvent.keyDown(screen.getByRole("tab", { name: /Day/i }), { key: "ArrowRight" });
    expect(mockOnModeChange).toHaveBeenCalledWith("agenda");

    fireEvent.keyDown(screen.getByRole("tab", { name: /Agenda/i }), { key: "ArrowRight" });
    expect(mockOnModeChange).toHaveBeenCalledWith("month");
  });

  it("wraps around with ArrowLeft from first item", () => {
    render(
      <CalendarViewToggle
        currentMode="month"
        onModeChange={mockOnModeChange}
      />
    );

    const monthTab = screen.getByRole("tab", { name: /Month/i });
    monthTab.focus();

    fireEvent.keyDown(monthTab, { key: "ArrowLeft" });
    expect(mockOnModeChange).toHaveBeenCalledWith("agenda");
  });

  it("renders heatmap toggle when onHeatmapToggle provided", () => {
    render(
      <CalendarViewToggle
        currentMode="month"
        onModeChange={mockOnModeChange}
        heatmapEnabled={false}
        onHeatmapToggle={mockOnHeatmapToggle}
      />
    );

    const heatmapButton = screen.getByRole("button", { name: /Show availability heatmap/i });
    expect(heatmapButton).toBeInTheDocument();
    expect(heatmapButton).toHaveAttribute("aria-pressed", "false");
  });

  it("shows heatmap as active when enabled", () => {
    render(
      <CalendarViewToggle
        currentMode="month"
        onModeChange={mockOnModeChange}
        heatmapEnabled={true}
        onHeatmapToggle={mockOnHeatmapToggle}
      />
    );

    const heatmapButton = screen.getByRole("button", { name: /Hide availability heatmap/i });
    expect(heatmapButton).toHaveAttribute("aria-pressed", "true");
    expect(heatmapButton).toHaveClass("bg-cyan-500/20");
  });

  it("toggles heatmap on click", () => {
    render(
      <CalendarViewToggle
        currentMode="month"
        onModeChange={mockOnModeChange}
        heatmapEnabled={false}
        onHeatmapToggle={mockOnHeatmapToggle}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Show availability heatmap/i }));
    expect(mockOnHeatmapToggle).toHaveBeenCalledWith(true);
  });

  it("toggles heatmap on Enter/Space key", () => {
    render(
      <CalendarViewToggle
        currentMode="month"
        onModeChange={mockOnModeChange}
        heatmapEnabled={false}
        onHeatmapToggle={mockOnHeatmapToggle}
      />
    );

    const heatmapButton = screen.getByRole("button", { name: /Show availability heatmap/i });
    heatmapButton.focus();

    fireEvent.keyDown(heatmapButton, { key: "Enter" });
    expect(mockOnHeatmapToggle).toHaveBeenCalledWith(true);

    fireEvent.keyDown(heatmapButton, { key: " " });
    expect(mockOnHeatmapToggle).toHaveBeenCalledWith(false);
  });

  it("applies custom className", () => {
    render(
      <CalendarViewToggle
        currentMode="month"
        onModeChange={mockOnModeChange}
        className="custom-toolbar"
      />
    );

    expect(screen.getByRole("tablist")).toHaveClass("custom-toolbar");
  });
});