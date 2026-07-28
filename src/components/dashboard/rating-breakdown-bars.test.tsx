import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { RatingBreakdownBars } from "./rating-breakdown-bars";
import type { RatingCriterion } from "./types";

const mockCriteria: RatingCriterion[] = [
  {
    id: "communication",
    label: "Communication",
    average: 4.8,
    count: 42,
    colorClass: "bg-teal-400",
  },
  {
    id: "expertise",
    label: "Expertise",
    average: 4.6,
    count: 41,
    colorClass: "bg-cyan-400",
  },
  {
    id: "timeliness",
    label: "Timeliness",
    average: 4.3,
    count: 40,
    colorClass: "bg-sky-400",
  },
];

describe("RatingBreakdownBars", () => {
  it("renders all criteria with progress bars", () => {
    render(<RatingBreakdownBars criteria={mockCriteria} />);

    expect(screen.getByTestId("rating-breakdown-bars")).toBeInTheDocument();

    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(3);

    expect(bars[0]).toHaveAttribute("aria-valuenow", "4.8");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "4.6");
    expect(bars[2]).toHaveAttribute("aria-valuenow", "4.3");

    expect(screen.getByText("Communication")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("Expertise")).toBeInTheDocument();
    expect(screen.getByText("4.6")).toBeInTheDocument();
  });

  it("renders overall rating when provided", () => {
    render(
      <RatingBreakdownBars
        criteria={mockCriteria}
        overallRating={4.7}
        overallCount={42}
      />,
    );

    expect(screen.getByText("Rating breakdown")).toBeInTheDocument();
    expect(screen.getByText("4.7")).toBeInTheDocument();
    expect(screen.getByText(/42 reviews/)).toBeInTheDocument();
  });

  it("shows empty placeholder when criteria is empty", () => {
    render(<RatingBreakdownBars criteria={[]} />);

    expect(
      screen.getByText(/No rating data available yet/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows tooltip on hover with sample-size disclosure", async () => {
    const user = userEvent.setup();
    render(<RatingBreakdownBars criteria={mockCriteria} />);

    const bar = screen.getByRole("progressbar", { name: /Communication/i });
    await user.hover(bar);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("4.8 / 5");
    expect(tooltip).toHaveTextContent("Based on 42 reviews");

    await user.unhover(bar);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on focus and dismisses on Escape", () => {
    render(<RatingBreakdownBars criteria={mockCriteria} />);

    const bar = screen.getByRole("progressbar", { name: /Expertise/i });
    bar.focus();

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Based on 41 reviews");

    fireEvent.keyDown(bar, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("dims other bars when one is hovered", async () => {
    const user = userEvent.setup();
    render(<RatingBreakdownBars criteria={mockCriteria} />);

    const bar = screen.getByRole("progressbar", { name: /Communication/i });
    await user.hover(bar);

    // The hovered one should have opacity-100, others opacity-40
    const rows = screen.getAllByRole("progressbar");
    expect(rows[0].className).not.toContain("opacity-40");
    expect(rows[1].className).toContain("opacity-40");
  });

  it("has correct aria attributes on progress bars", () => {
    render(<RatingBreakdownBars criteria={mockCriteria} />);

    const bar = screen.getByRole("progressbar", { name: /Timeliness/i });
    expect(bar).toHaveAttribute("aria-valuenow", "4.3");
    expect(bar).toHaveAttribute("aria-valuemin", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "5");
    expect(bar).toHaveAttribute("tabindex", "0");
  });

  it("handles single criterion correctly", () => {
    const single: RatingCriterion[] = [
      {
        id: "single",
        label: "Overall",
        average: 4.0,
        count: 1,
        colorClass: "bg-teal-400",
      },
    ];
    render(<RatingBreakdownBars criteria={single} />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
    expect(screen.getByText("4.0")).toBeInTheDocument();

    // "1 review" not "1 reviews"
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute(
      "aria-label",
      expect.stringContaining("1 review"),
    );
  });

  it("computes total review count from criteria when overallCount is omitted", () => {
    render(
      <RatingBreakdownBars
        criteria={mockCriteria}
        overallRating={4.7}
      />,
    );

    // 42 + 41 + 40 = 123
    expect(screen.getByText(/123 reviews/)).toBeInTheDocument();
  });
});
