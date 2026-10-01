import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Spinner } from "./spinner";

describe("Spinner Component", () => {
  it("renders with default properties", () => {
    const { container } = render(<Spinner />);
    
    const wrapper = screen.getByRole("status");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute("aria-label", "Loading");
    
    const srOnlyText = screen.getByText("Loading...");
    expect(srOnlyText).toHaveClass("sr-only");
    
    // Default size 'md' has class 'h-6 w-6'
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.className.baseVal).toContain("h-6 w-6");
  });

  it("renders with size 'sm'", () => {
    const { container } = render(<Spinner size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg?.className.baseVal).toContain("h-4 w-4");
  });

  it("renders with size 'lg'", () => {
    const { container } = render(<Spinner size="lg" />);
    const svg = container.querySelector("svg");
    expect(svg?.className.baseVal).toContain("h-10 w-10");
  });

  it("applies custom className", () => {
    render(<Spinner className="custom-test-class" />);
    const wrapper = screen.getByRole("status");
    expect(wrapper.className).toContain("custom-test-class");
  });

  it("handles invalid size prop gracefully (boundary)", () => {
    // @ts-expect-error Testing invalid runtime input
    const { container } = render(<Spinner size="invalid" />);
    
    const svg = container.querySelector("svg");
    // sizes['invalid'] would be undefined, so it shouldn't contain the expected valid sizing classes
    expect(svg?.className.baseVal).not.toContain("h-4 w-4");
    expect(svg?.className.baseVal).not.toContain("h-6 w-6");
    expect(svg?.className.baseVal).not.toContain("h-10 w-10");
    // Ensure the fallback classes are still applied
    expect(svg?.className.baseVal).toContain("animate-spin");
  });
});
