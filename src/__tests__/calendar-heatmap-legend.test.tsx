import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CalendarHeatmapLegend } from "@/components/dashboard/calendar-heatmap-legend";

describe("CalendarHeatmapLegend", () => {
  it("renders legend with correct ARIA label", () => {
    render(<CalendarHeatmapLegend />);

    expect(screen.getByRole("legend")).toHaveAttribute(
      "aria-label",
      "Availability heatmap intensity legend"
    );
  });

  it("renders all 5 intensity levels in order", () => {
    render(<CalendarHeatmapLegend />);

    const items = screen.getAllByText(/No availability|Low|Medium|High|Peak/);
    expect(items).toHaveLength(5);
  });

  it("renders horizontal layout by default", () => {
    render(<CalendarHeatmapLegend />);

    const legend = screen.getByRole("legend");
    expect(legend).toHaveClass("flex-wrap");
    expect(legend).toHaveClass("items-center");
  });

  it("renders vertical layout when variant is vertical", () => {
    render(<CalendarHeatmapLegend variant="vertical" />);

    const legend = screen.getByRole("legend");
    expect(legend).toHaveClass("flex-col");
  });

  it("applies custom className", () => {
    render(<CalendarHeatmapLegend className="custom-legend" />);

    expect(screen.getByRole("legend")).toHaveClass("custom-legend");
  });

  it("each item has color swatch with pattern", () => {
    render(<CalendarHeatmapLegend />);

    // Each item should have a swatch div with background styles
    const swatches = screen.getAllByRole("legend")[0].querySelectorAll("div[style*='background']");
    expect(swatches.length).toBeGreaterThanOrEqual(5);
  });

  it("displays correct range labels", () => {
    render(<CalendarHeatmapLegend />);

    expect(screen.getByText("0 slots")).toBeInTheDocument();
    expect(screen.getByText("1–2 slots")).toBeInTheDocument();
    expect(screen.getByText("3–5 slots")).toBeInTheDocument();
    expect(screen.getByText("6–9 slots")).toBeInTheDocument();
    expect(screen.getByText("10+ slots")).toBeInTheDocument();
  });

  it("accepts custom ranges", () => {
    render(
      <CalendarHeatmapLegend
        ranges={{
          none: "Empty",
          low: "Few",
          medium: "Some",
          high: "Many",
          peak: "Full",
        }}
      />
    );

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("Few")).toBeInTheDocument();
    expect(screen.getByText("Some")).toBeInTheDocument();
    expect(screen.getByText("Many")).toBeInTheDocument();
    expect(screen.getByText("Full")).toBeInTheDocument();
  });

  it("has descriptions in vertical variant", () => {
    render(<CalendarHeatmapLegend variant="vertical" />);

    expect(screen.getByText("No open slots")).toBeInTheDocument();
    expect(screen.getByText("1–2 open slots")).toBeInTheDocument();
    expect(screen.getByText("3–5 open slots")).toBeInTheDocument();
    expect(screen.getByText("6–9 open slots")).toBeInTheDocument();
    expect(screen.getByText("10+ open slots")).toBeInTheDocument();
  });

  it("swatches use CSS custom properties for theming", () => {
    render(<CalendarHeatmapLegend />);

    const swatches = screen.getByRole("legend").querySelectorAll("div[style*='--heatmap-step']");
    expect(swatches.length).toBeGreaterThanOrEqual(5);
  });
});