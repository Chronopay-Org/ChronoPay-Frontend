import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FacetCountBadge } from "./facet-count-badge";

describe("FacetCountBadge", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders a single-digit count", () => {
    render(<FacetCountBadge count={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders a multi-digit count", () => {
    render(<FacetCountBadge count={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders zero", () => {
    render(<FacetCountBadge count={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  // ── Overflow ───────────────────────────────────────────────────────────────

  it("renders 99+ when count exceeds the default threshold of 99", () => {
    render(<FacetCountBadge count={150} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("renders 50+ when count exceeds a custom threshold of 50", () => {
    render(<FacetCountBadge count={72} overflowThreshold={50} />);
    expect(screen.getByText("50+")).toBeInTheDocument();
  });

  it("renders the raw count when at the threshold", () => {
    render(<FacetCountBadge count={99} />);
    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("renders 0 for negative counts", () => {
    render(<FacetCountBadge count={-5} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it("has role='status' and a descriptive aria-label", () => {
    render(<FacetCountBadge count={7} />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-label", "7 results");
  });

  it("aria-label says 'No results' for zero count", () => {
    render(<FacetCountBadge count={0} />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-label", "No results");
  });

  it("aria-label says 'Over 99 results' for overflow", () => {
    render(<FacetCountBadge count={250} />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-label", "Over 99 results");
  });

  it("accepts a custom aria-label override", () => {
    render(<FacetCountBadge count={12} aria-label="Custom label" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-label", "Custom label");
  });

  it("uses singular 'result' for count of 1", () => {
    render(<FacetCountBadge count={1} />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-label", "1 result");
  });

  // ── Tone classes ───────────────────────────────────────────────────────────

  it("applies default tone classes", () => {
    render(<FacetCountBadge count={10} />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-white/8");
    expect(badge.className).toContain("text-slate-400");
  });

  it("applies active tone classes", () => {
    render(<FacetCountBadge count={10} tone="active" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-cyan-500/20");
    expect(badge.className).toContain("text-cyan-300");
  });

  it("applies faded tone classes", () => {
    render(<FacetCountBadge count={0} tone="faded" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-white/4");
    expect(badge.className).toContain("text-slate-600");
  });

  // ── Data attributes ────────────────────────────────────────────────────────

  it("sets data-facet-count-badge and data-count attributes", () => {
    const { container } = render(<FacetCountBadge count={33} />);
    const badge = container.querySelector("[data-facet-count-badge]");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-count", "33");
  });

  // ── Class name forwarding ──────────────────────────────────────────────────

  it("forwards additional className", () => {
    render(<FacetCountBadge count={5} className="extra-class" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("extra-class");
  });
});
