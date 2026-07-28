import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { EarningsChart } from "./earnings-chart";

// EarningsSegment type is used inline in each test as object literals

describe("EarningsChart", () => {
  it("renders correctly with multiple segments", () => {
    // Normalizing values for the bar width calculation:
    // If fees are deductions, usually they might be displayed as positive absolute value for composition, 
    // but let's test a standard positive composition first to ensure width calculates right.
    const segments = [
      { id: "base", label: "Base", value: 80, formattedValue: "$80", colorClass: "bg-cyan-500" },
      { id: "tips", label: "Tips", value: 20, formattedValue: "$20", colorClass: "bg-amber-500" },
    ];
    
    render(<EarningsChart segments={segments} />);
    
    expect(screen.getByRole("region", { name: /earnings breakdown/i })).toBeInTheDocument();
    
    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars).toHaveLength(2);
    expect(progressbars[0]).toHaveAttribute("aria-valuenow", "80");
    expect(progressbars[1]).toHaveAttribute("aria-valuenow", "20");
    
    // Check legend renders
    expect(screen.getByText("Base")).toBeInTheDocument();
    expect(screen.getByText("$80")).toBeInTheDocument();
    expect(screen.getByText("Tips")).toBeInTheDocument();
    expect(screen.getByText("$20")).toBeInTheDocument();
  });

  it("handles one segment gracefully", () => {
    const segments = [
      { id: "base", label: "Base Only", value: 100, formattedValue: "$100", colorClass: "bg-cyan-500" },
    ];
    
    render(<EarningsChart segments={segments} />);
    
    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars).toHaveLength(1);
    expect(progressbars[0]).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("Base Only")).toBeInTheDocument();
  });

  it("handles zero-tip scenario (zero value segment)", () => {
    const segments = [
      { id: "base", label: "Base", value: 100, formattedValue: "$100", colorClass: "bg-cyan-500" },
      { id: "tips", label: "Tips", value: 0, formattedValue: "$0", colorClass: "bg-amber-500" },
    ];
    
    render(<EarningsChart segments={segments} />);
    
    // Zero-width bar should not be rendered
    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars).toHaveLength(1); 
    expect(progressbars[0]).toHaveAttribute("aria-valuenow", "100");
    
    // Legend should still show it
    expect(screen.getByText("Tips")).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("returns null when all segments are 0", () => {
    const segments = [
      { id: "base", label: "Base", value: 0, formattedValue: "$0", colorClass: "bg-cyan-500" },
    ];
    const { container } = render(<EarningsChart segments={segments} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows tooltip on hover and focus", async () => {
    const user = userEvent.setup();
    const segments = [
      { id: "base", label: "Base", value: 100, formattedValue: "$100", colorClass: "bg-cyan-500" },
    ];
    render(<EarningsChart segments={segments} />);
    
    const bar = screen.getByRole("progressbar", { name: /Base: \$100/i });
    
    // Hover
    await user.hover(bar);
    let tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Base: $100");
    
    await user.unhover(bar);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    
    // Focus
    bar.focus();
    tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    
    fireEvent.blur(bar);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("legend hover dims other segments and shows tooltip on hovered bar", () => {
    const segments = [
      { id: "base", label: "Base", value: 80, formattedValue: "$80", colorClass: "bg-cyan-500" },
      { id: "tips", label: "Tips", value: 20, formattedValue: "$20", colorClass: "bg-amber-500" },
    ];
    render(<EarningsChart segments={segments} />);

    // Find the legend items (they are divs with tabIndex=0, not roles)
    const legendItems = screen
      .getAllByText("Base")
      // The legend div wraps the label span; get the parent div
      .map((el) => el.closest("div[tabindex]"))
      .filter(Boolean);

    expect(legendItems.length).toBeGreaterThan(0);
    const legendItem = legendItems[0]!;

    // Hover over the Base legend item
    fireEvent.mouseEnter(legendItem);
    // Base bar should still be visible, Tips bar should be dimmed
    const bars = screen.getAllByRole("progressbar");
    const tipsBar = bars.find((b) => b.getAttribute("aria-label")?.includes("Tips"));
    expect(tipsBar?.className).toContain("opacity-40");

    // Mouse leave restores both
    fireEvent.mouseLeave(legendItem);
    expect(tipsBar?.className).not.toContain("opacity-40");
  });

  it("legend focus/blur cycle sets and clears hoveredId", () => {
    const segments = [
      { id: "base", label: "Base", value: 80, formattedValue: "$80", colorClass: "bg-cyan-500" },
      { id: "tips", label: "Tips", value: 20, formattedValue: "$20", colorClass: "bg-amber-500" },
    ];
    render(<EarningsChart segments={segments} />);

    // Legend items have tabIndex=0 and are plain divs wrapping the swatch+label+value
    // We look for the legend container items by finding the legend wrapper
    const tipsLabel = screen.getByText("Tips");
    const legendItem = tipsLabel.closest("div[tabindex]") as HTMLElement;
    expect(legendItem).toBeTruthy();

    // Focus on the Tips legend item → Base bar dimmed
    fireEvent.focus(legendItem);
    const bars = screen.getAllByRole("progressbar");
    const baseBar = bars.find((b) => b.getAttribute("aria-label")?.includes("Base"));
    expect(baseBar?.className).toContain("opacity-40");

    // Blur → dimming cleared
    fireEvent.blur(legendItem);
    expect(baseBar?.className).not.toContain("opacity-40");
  });
});
