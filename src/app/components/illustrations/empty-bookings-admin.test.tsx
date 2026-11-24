import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { EmptyBookingsAdmin } from "./empty-bookings-admin";

expect.extend(toHaveNoViolations);

describe("EmptyBookingsAdmin", () => {
  // ─── Basic Rendering ───────────────────────────────────────────────────────

  it("renders without error using default props", () => {
    const { container } = render(<EmptyBookingsAdmin />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "240");
    expect(svg).toHaveAttribute("height", "200");
  });

  // ─── Props Handling ────────────────────────────────────────────────────────

  it("applies custom width and height as numbers", () => {
    const { container } = render(<EmptyBookingsAdmin width={300} height={250} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "300");
    expect(svg).toHaveAttribute("height", "250");
  });

  it("applies custom width and height as strings", () => {
    const { container } = render(<EmptyBookingsAdmin width="100%" height="auto" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "100%");
    expect(svg).toHaveAttribute("height", "auto");
  });

  it("applies custom className", () => {
    const { container } = render(<EmptyBookingsAdmin className="custom-class" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("custom-class");
  });

  // ─── Edge Cases & Invalid Inputs ───────────────────────────────────────────

  it("handles empty string className gracefully", () => {
    const { container } = render(<EmptyBookingsAdmin className="" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // Default SVG classes from the component should still be there if any,
    // though here className is passed down. We verify it doesn't crash.
  });

  it("handles negative dimensions gracefully (renders without crash)", () => {
    const { container } = render(<EmptyBookingsAdmin width={-100} height={-50} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "-100");
    expect(svg).toHaveAttribute("height", "-50");
  });

  it("handles zero dimensions gracefully", () => {
    const { container } = render(<EmptyBookingsAdmin width={0} height={0} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "0");
    expect(svg).toHaveAttribute("height", "0");
  });

  // ─── Accessibility - SVG Attributes ────────────────────────────────────────

  it("has role='img' attribute", () => {
    const { container } = render(<EmptyBookingsAdmin />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
  });

  it("has aria-label attribute", () => {
    const { container } = render(<EmptyBookingsAdmin />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-label");
    const ariaLabel = svg?.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel?.length).toBeGreaterThan(0);
  });

  // ─── Dark Mode Support ─────────────────────────────────────────────────────

  it("renders in dark mode without errors", () => {
    const { container } = render(
      <div data-theme="dark">
        <EmptyBookingsAdmin />
      </div>
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  // ─── Accessibility Audits (axe-core) ───────────────────────────────────────

  it("passes axe accessibility check", async () => {
    const { container } = render(<EmptyBookingsAdmin />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes axe accessibility check in dark mode", async () => {
    const { container } = render(
      <div data-theme="dark">
        <EmptyBookingsAdmin />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // ─── Snapshot Tests ────────────────────────────────────────────────────────

  it("matches snapshot with default props", () => {
    const { container } = render(<EmptyBookingsAdmin />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
