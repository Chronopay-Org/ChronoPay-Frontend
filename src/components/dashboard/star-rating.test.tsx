import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StarRating } from "./star-rating";

describe("StarRating", () => {
  it("renders the correct aria-label", () => {
    render(<StarRating rating={3.5} max={5} />);
    expect(screen.getByRole("img", { name: "3.5 out of 5 stars" })).toBeInTheDocument();
  });

  it("allows custom aria-label", () => {
    render(<StarRating rating={4} ariaLabel="Excellent 4 stars" />);
    expect(screen.getByRole("img", { name: "Excellent 4 stars" })).toBeInTheDocument();
  });

  it("handles boundary inputs", () => {
    const { rerender } = render(<StarRating rating={0} />);
    expect(screen.getByRole("img", { name: "0 out of 5 stars" })).toBeInTheDocument();

    rerender(<StarRating rating={5} />);
    expect(screen.getByRole("img", { name: "5 out of 5 stars" })).toBeInTheDocument();
  });
});
