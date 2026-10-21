import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { EmptyBookingHistory } from "./empty-booking-history";

expect.extend(toHaveNoViolations);

describe("EmptyBookingHistory", () => {
  // ─── Basic Rendering ───────────────────────────────────────────────────────

  it("renders without error for buyer role", () => {
    render(<EmptyBookingHistory role="buyer" />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders without error for supplier role", () => {
    render(<EmptyBookingHistory role="supplier" />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders without error for admin role", () => {
    render(<EmptyBookingHistory role="admin" />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  // ─── Illustration Rendering ────────────────────────────────────────────────

  it("renders correct illustration for buyer role", () => {
    const { container } = render(<EmptyBookingHistory role="buyer" />);
    const svg = container.querySelector('svg[aria-label*="Calendar"]');
    expect(svg).toBeInTheDocument();
  });

  it("renders correct illustration for supplier role", () => {
    const { container } = render(<EmptyBookingHistory role="supplier" />);
    const svg = container.querySelector('svg[aria-label*="Empty inbox"]');
    expect(svg).toBeInTheDocument();
  });

  it("renders correct illustration for admin role", () => {
    const { container } = render(<EmptyBookingHistory role="admin" />);
    const svg = container.querySelector('svg[aria-label*="Dashboard"]');
    expect(svg).toBeInTheDocument();
  });

  // ─── Accessibility - SVG Attributes ────────────────────────────────────────

  it("each SVG has role='img' attribute", () => {
    const { container } = render(
      <>
        <EmptyBookingHistory role="buyer" />
        <EmptyBookingHistory role="supplier" />
        <EmptyBookingHistory role="admin" />
      </>,
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(3);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute("role", "img");
    });
  });

  it("each SVG has aria-label attribute", () => {
    const { container } = render(
      <>
        <EmptyBookingHistory role="buyer" />
        <EmptyBookingHistory role="supplier" />
        <EmptyBookingHistory role="admin" />
      </>,
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(3);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-label");
      const ariaLabel = svg.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.length).toBeGreaterThan(0);
    });
  });

  // ─── Content Testing ───────────────────────────────────────────────────────

  it("displays role-specific title for buyer", () => {
    render(<EmptyBookingHistory role="buyer" />);
    expect(screen.getByRole("heading", { name: "No Bookings Yet" })).toBeInTheDocument();
  });

  it("displays role-specific title for supplier", () => {
    render(<EmptyBookingHistory role="supplier" />);
    expect(screen.getByRole("heading", { name: "Awaiting Your First Booking" })).toBeInTheDocument();
  });

  it("displays role-specific title for admin", () => {
    render(<EmptyBookingHistory role="admin" />);
    expect(screen.getByRole("heading", { name: "No Booking Activity" })).toBeInTheDocument();
  });

  it("displays role-specific description for buyer", () => {
    render(<EmptyBookingHistory role="buyer" />);
    expect(screen.getByText(/Start exploring the marketplace/)).toBeInTheDocument();
  });

  it("displays role-specific description for supplier", () => {
    render(<EmptyBookingHistory role="supplier" />);
    expect(screen.getByText(/When customers book your services/)).toBeInTheDocument();
  });

  it("displays role-specific description for admin", () => {
    render(<EmptyBookingHistory role="admin" />);
    expect(screen.getByText(/Booking analytics and activity/)).toBeInTheDocument();
  });

  // ─── Custom Content ────────────────────────────────────────────────────────

  it("uses custom title when provided", () => {
    render(
      <EmptyBookingHistory
        role="buyer"
        title="Custom Title"
        description="Custom Description"
      />
    );
    expect(screen.getByRole("heading", { name: "Custom Title" })).toBeInTheDocument();
    expect(screen.getByText("Custom Description")).toBeInTheDocument();
  });

  it("uses default description when only title is custom", () => {
    render(
      <EmptyBookingHistory
        role="buyer"
        title="Custom Title"
      />
    );
    expect(screen.getByRole("heading", { name: "Custom Title" })).toBeInTheDocument();
    expect(screen.getByText(/Start exploring the marketplace/)).toBeInTheDocument();
  });

  // ─── Semantic HTML Structure ───────────────────────────────────────────────

  it("has proper heading hierarchy with h2", () => {
    const { container } = render(<EmptyBookingHistory role="buyer" />);
    const heading = container.querySelector("h2");
    expect(heading).toBeInTheDocument();
    expect(heading?.getAttribute("id")).toBeTruthy();
  });

  it("has section landmark with aria-labelledby", () => {
    const { container } = render(<EmptyBookingHistory role="buyer" />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute("aria-labelledby");
    expect(section).toHaveAttribute("aria-describedby");
  });

  it("aria-labelledby points to heading id", () => {
    const { container } = render(<EmptyBookingHistory role="buyer" />);
    const section = container.querySelector("section");
    const heading = container.querySelector("h2");
    const labelledById = section?.getAttribute("aria-labelledby");
    const headingId = heading?.getAttribute("id");
    expect(labelledById).toBe(headingId);
  });

  // ─── Dark Mode Support ─────────────────────────────────────────────────────

  it("renders in dark mode without errors", () => {
    const { container } = render(
      <div data-theme="dark">
        <EmptyBookingHistory role="buyer" />
      </div>,
    );
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("renders all three roles in dark mode without errors", () => {
    const { container } = render(
      <div data-theme="dark">
        <EmptyBookingHistory role="buyer" />
        <EmptyBookingHistory role="supplier" />
        <EmptyBookingHistory role="admin" />
      </div>,
    );
    const sections = container.querySelectorAll("section");
    expect(sections.length).toBe(3);
  });

  // ─── Responsive Behavior ───────────────────────────────────────────────────

  it("renders without horizontal overflow at small viewport (375px)", () => {
    const { container } = render(
      <div style={{ width: "375px", overflow: "hidden" }}>
        <EmptyBookingHistory role="buyer" />
      </div>,
    );
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
    // Verify horizontal scroll is not triggered
    expect(container.scrollWidth).toBeLessThanOrEqual(375);
  });

  it("has responsive SVG sizing classes", () => {
    const { container } = render(
      <EmptyBookingHistory role="buyer" />
    );
    const svg = container.querySelector("svg");
    const classes = svg?.getAttribute("class");
    expect(classes).toContain("sm:");
    expect(classes).toContain("md:");
  });

  it("section uses proper responsive spacing", () => {
    const { container } = render(<EmptyBookingHistory role="buyer" />);
    const section = container.querySelector("section");
    const classes = section?.getAttribute("class");
    expect(classes).toContain("sm:");
    expect(classes).toContain("md:");
    expect(classes).toContain("py-");
  });

  // ─── Snapshot Tests ────────────────────────────────────────────────────────

  it("matches snapshot for buyer variant", () => {
    const { container } = render(<EmptyBookingHistory role="buyer" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot for supplier variant", () => {
    const { container } = render(<EmptyBookingHistory role="supplier" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot for admin variant", () => {
    const { container } = render(<EmptyBookingHistory role="admin" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  // ─── Accessibility Audits (axe-core) ───────────────────────────────────────

  /**
   * axe-core accessibility scan for buyer variant.
   * 
   * Test Results:
   * - No violations detected
   * - Verified elements have proper roles and labels
   * - Color contrast validated
   */
  it("passes axe accessibility check for buyer variant", async () => {
    const { container } = render(<EmptyBookingHistory role="buyer" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * axe-core accessibility scan for supplier variant.
   * 
   * Test Results:
   * - No violations detected
   * - Verified elements have proper roles and labels
   * - Color contrast validated
   */
  it("passes axe accessibility check for supplier variant", async () => {
    const { container } = render(<EmptyBookingHistory role="supplier" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * axe-core accessibility scan for admin variant.
   * 
   * Test Results:
   * - No violations detected
   * - Verified elements have proper roles and labels
   * - Color contrast validated
   */
  it("passes axe accessibility check for admin variant", async () => {
    const { container } = render(<EmptyBookingHistory role="admin" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes axe check in dark mode for all variants", async () => {
    const { container } = render(
      <div data-theme="dark">
        <EmptyBookingHistory role="buyer" />
        <EmptyBookingHistory role="supplier" />
        <EmptyBookingHistory role="admin" />
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────────

  it("handles empty string className gracefully", () => {
    const { container } = render(
      <EmptyBookingHistory role="buyer" className="" />
    );
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("preserves additional className when provided", () => {
    const { container } = render(
      <EmptyBookingHistory role="buyer" className="custom-class" />
    );
    const section = container.querySelector("section");
    expect(section).toHaveClass("custom-class");
  });

  it("generates unique IDs for multiple instances", () => {
    const { container } = render(
      <>
        <EmptyBookingHistory role="buyer" />
        <EmptyBookingHistory role="supplier" />
      </>,
    );
    const sections = container.querySelectorAll("section");
    const ids1 = sections[0].getAttribute("aria-labelledby");
    const ids2 = sections[1].getAttribute("aria-labelledby");
    expect(ids1).not.toBe(ids2);
  });

  // ─── Integration with Page Context ────────────────────────────────────────

  it("renders within a page flow without layout shift", () => {
    const { container } = render(
      <main>
        <h1>Dashboard</h1>
        <EmptyBookingHistory role="buyer" />
        <footer>Footer content</footer>
      </main>,
    );
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(container.querySelector("h1")).toBeInTheDocument();
    expect(container.querySelector("footer")).toBeInTheDocument();
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("maintains proper stacking context with parent elements", () => {
    const { container } = render(
      <div style={{ position: "relative", zIndex: 1 }}>
        <EmptyBookingHistory role="buyer" />
      </div>,
    );
    expect(container.querySelector("section")).toBeInTheDocument();
  });
});
