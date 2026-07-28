import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { EarningsChart } from "./earnings-chart";
import type { EarningsSegment } from "./types";

const mockSegments: EarningsSegment[] = [
  {
    id: "base",
    label: "Base Pay",
    value: 100,
    formattedValue: "$100.00",
    colorClass: "bg-cyan-500",
  },
  {
    id: "tips",
    label: "Tips",
    value: 20,
    formattedValue: "$20.00",
    colorClass: "bg-amber-500",
  },
  {
    id: "fees",
    label: "Platform Fees",
    value: -10,
    formattedValue: "-$10.00",
    colorClass: "bg-slate-500",
  },
];

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
});
