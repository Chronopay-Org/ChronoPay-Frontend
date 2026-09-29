import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { EmptyBookingsBuyer } from "./empty-bookings-buyer";

describe("EmptyBookingsBuyer Illustration", () => {
  it("renders successfully with default props", () => {
    render(<EmptyBookingsBuyer />);
    const svg = screen.getByRole("img", { name: /Calendar with empty booking slots/i });
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "240");
    expect(svg).toHaveAttribute("height", "200");
  });

  it("applies custom props correctly", () => {
    render(<EmptyBookingsBuyer width={150} height={120} className="custom-test-class" />);
    const svg = screen.getByRole("img", { name: /Calendar with empty booking slots/i });
    
    expect(svg).toHaveAttribute("width", "150");
    expect(svg).toHaveAttribute("height", "120");
    expect(svg).toHaveClass("custom-test-class");
  });

  it("handles string width and height gracefully", () => {
    render(<EmptyBookingsBuyer width="50%" height="auto" />);
    const svg = screen.getByRole("img", { name: /Calendar with empty booking slots/i });
    
    expect(svg).toHaveAttribute("width", "50%");
    expect(svg).toHaveAttribute("height", "auto");
  });

  it("renders with no accessibility violations", async () => {
    const { container } = render(<EmptyBookingsBuyer />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
});
