import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FacetFilterChip } from "./facet-filter-chip";
import type { FacetOption } from "./facet-filter-chip";

const baseOption: FacetOption = {
  id: "cat-1",
  label: "Consultation",
  count: 24,
  group: "category",
};

describe("FacetFilterChip", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders the option label", () => {
    render(
      <FacetFilterChip option={baseOption} isActive={false} onToggle={() => {}} />,
    );
    expect(screen.getByText("Consultation")).toBeInTheDocument();
  });

  it("renders a count badge with the option count", () => {
    render(
      <FacetFilterChip option={baseOption} isActive={false} onToggle={() => {}} />,
    );
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("renders the zero-count badge when count is 0", () => {
    render(
      <FacetFilterChip
        option={{ ...baseOption, count: 0 }}
        isActive={false}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders overflow badge when count exceeds threshold", () => {
    render(
      <FacetFilterChip
        option={{ ...baseOption, count: 150 }}
        isActive={false}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  // ── Active state ───────────────────────────────────────────────────────────

  it("shows active styling when isActive is true", () => {
    render(
      <FacetFilterChip option={baseOption} isActive={true} onToggle={() => {}} />,
    );
    const chip = screen.getByRole("checkbox");
    expect(chip).toHaveAttribute("aria-checked", "true");
    expect(chip.className).toContain("bg-cyan-400/15");
  });

  it("shows inactive styling when isActive is false", () => {
    render(
      <FacetFilterChip option={baseOption} isActive={false} onToggle={() => {}} />,
    );
    const chip = screen.getByRole("checkbox");
    expect(chip).toHaveAttribute("aria-checked", "false");
    expect(chip.className).toContain("bg-white/5");
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it("has role='checkbox'", () => {
    render(
      <FacetFilterChip option={baseOption} isActive={false} onToggle={() => {}} />,
    );
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("has an aria-label that includes label and count", () => {
    render(
      <FacetFilterChip option={baseOption} isActive={false} onToggle={() => {}} />,
    );
    const chip = screen.getByRole("checkbox");
    expect(chip).toHaveAttribute(
      "aria-label",
      "Consultation — 24 results for Consultation",
    );
  });

  it("includes selected state in aria-label when active", () => {
    render(
      <FacetFilterChip option={baseOption} isActive={true} onToggle={() => {}} />,
    );
    const chip = screen.getByRole("checkbox");
    expect(chip.getAttribute("aria-label")).toContain("currently selected");
  });

  it("has data-facet-chip attribute", () => {
    render(
      <FacetFilterChip option={baseOption} isActive={false} onToggle={() => {}} />,
    );
    const chip = screen.getByRole("checkbox");
    expect(chip).toHaveAttribute("data-facet-chip");
  });

  it("sets data-active attribute when active", () => {
    render(
      <FacetFilterChip option={baseOption} isActive={true} onToggle={() => {}} />,
    );
    const chip = screen.getByRole("checkbox");
    expect(chip).toHaveAttribute("data-active");
  });

  // ── Interaction ────────────────────────────────────────────────────────────

  it("calls onToggle with the option id when clicked", async () => {
    const handleToggle = vi.fn();
    render(
      <FacetFilterChip option={baseOption} isActive={false} onToggle={handleToggle} />,
    );
    await userEvent.click(screen.getByRole("checkbox"));
    expect(handleToggle).toHaveBeenCalledWith("cat-1");
  });

  it("calls onToggle when Enter is pressed", async () => {
    const handleToggle = vi.fn();
    render(
      <FacetFilterChip option={baseOption} isActive={false} onToggle={handleToggle} />,
    );
    const chip = screen.getByRole("checkbox");
    chip.focus();
    await userEvent.keyboard("{Enter}");
    expect(handleToggle).toHaveBeenCalledWith("cat-1");
  });

  it("calls onToggle when Space is pressed", async () => {
    const handleToggle = vi.fn();
    render(
      <FacetFilterChip option={baseOption} isActive={false} onToggle={handleToggle} />,
    );
    const chip = screen.getByRole("checkbox");
    chip.focus();
    await userEvent.keyboard(" ");
    expect(handleToggle).toHaveBeenCalledWith("cat-1");
  });

  // ── Custom overflow threshold ──────────────────────────────────────────────

  it("respects custom overflowThreshold", () => {
    render(
      <FacetFilterChip
        option={{ ...baseOption, count: 60 }}
        isActive={false}
        onToggle={() => {}}
        overflowThreshold={50}
      />,
    );
    expect(screen.getByText("50+")).toBeInTheDocument();
  });

  // ── Class name forwarding ──────────────────────────────────────────────────

  it("forwards additional className", () => {
    render(
      <FacetFilterChip
        option={baseOption}
        isActive={false}
        onToggle={() => {}}
        className="extra-class"
      />,
    );
    const chip = screen.getByRole("checkbox");
    expect(chip.className).toContain("extra-class");
  });
});
