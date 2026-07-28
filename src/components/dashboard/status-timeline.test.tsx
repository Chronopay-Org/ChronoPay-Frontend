import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusTimeline } from "./status-timeline";
import { TimelineItem } from "./timeline-types";

const mockItems: TimelineItem[] = [
  {
    id: "1",
    title: "Step 1",
    status: "completed",
    timestamp: "2026-06-30 09:00 AM",
    actor: "Actor 1",
    details: "Details 1",
  },
  {
    id: "2",
    title: "Step 2",
    status: "pending",
    timestamp: "2026-06-30 10:00 AM",
    actor: "Actor 2",
    isCurrent: true,
  },
];

describe("StatusTimeline", () => {
  it("renders all items", () => {
    render(<StatusTimeline items={mockItems} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
  });

  it("expands details when clicked", () => {
    render(<StatusTimeline items={mockItems} />);
    // Both entries have details, so there are two "Show Details" buttons.
    // Click the first one (entry 1).
    const buttons = screen.getAllByText("Show Details");
    fireEvent.click(buttons[0]);
    expect(screen.getByText("Hide Details")).toBeInTheDocument();
    expect(screen.getByText("Actor: Actor 1")).toBeInTheDocument();
    expect(screen.getByText("Details 1")).toBeInTheDocument();
  });

  it("applies aria-current to active step", () => {
    render(<StatusTimeline items={mockItems} />);
    const activeStep = screen.getByText("Step 2");
    expect(activeStep).toHaveAttribute("aria-current", "step");
  });
});
