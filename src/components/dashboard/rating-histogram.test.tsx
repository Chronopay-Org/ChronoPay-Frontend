import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RatingHistogram } from "./rating-histogram";

describe("RatingHistogram", () => {
  const distribution = [
    { stars: 5, count: 80, percentage: 80 },
    { stars: 4, count: 10, percentage: 10 },
    { stars: 3, count: 5, percentage: 5 },
    { stars: 2, count: 3, percentage: 3 },
    { stars: 1, count: 2, percentage: 2 },
  ];

  it("renders overall score and count", () => {
    render(
      <RatingHistogram overallRating={4.5} totalCount={100} distribution={distribution} />
    );
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText(/Based on 100 reviews/)).toBeInTheDocument();
  });

  it("handles single review case", () => {
    render(
      <RatingHistogram overallRating={5} totalCount={1} distribution={[{ stars: 5, count: 1, percentage: 100 }]} />
    );
    expect(screen.getByText(/Based on 1 review/)).toBeInTheDocument();
  });

  it("renders histogram bars correctly", () => {
    render(
      <RatingHistogram overallRating={4.5} totalCount={100} distribution={distribution} />
    );
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(5);
    expect(bars[0]).toHaveAttribute("aria-valuenow", "80");
  });

  it("sorts distribution correctly from 5 to 1", () => {
    const unordered = [
      { stars: 1, count: 2, percentage: 2 },
      { stars: 5, count: 80, percentage: 80 },
    ];
    render(
      <RatingHistogram overallRating={4.5} totalCount={82} distribution={unordered} />
    );
    const bars = screen.getAllByRole("progressbar");
    // The first rendered bar should be for 5 stars, which has 80%
    expect(bars[0]).toHaveAttribute("aria-valuenow", "80");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "2");
  });
});
