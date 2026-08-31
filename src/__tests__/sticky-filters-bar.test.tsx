import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  StickyFiltersBar,
  type ActiveFilter,
} from "@/components/marketplace/sticky-filters-bar";

const sampleFilters: ActiveFilter[] = [
  { id: "cat-1", label: "Consulting", group: "category" },
  { id: "cat-2", label: "Design", group: "category" },
  { id: "avl-1", label: "Available today", group: "availability" },
];

describe("StickyFiltersBar", () => {
  it("renders the Filters button", () => {
    render(
      <StickyFiltersBar
        activeFilters={[]}
        onRemoveFilter={vi.fn()}
        onOpenPanel={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Open filters panel/i }),
    ).toBeInTheDocument();
  });

  it("shows active filter chip count badge when filters exist", () => {
    render(
      <StickyFiltersBar
        activeFilters={sampleFilters}
        onRemoveFilter={vi.fn()}
        onOpenPanel={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders active filter chips", () => {
    render(
      <StickyFiltersBar
        activeFilters={sampleFilters}
        onRemoveFilter={vi.fn()}
        onOpenPanel={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText(/Consulting/i)).toBeInTheDocument();
    expect(screen.getByText(/Design/i)).toBeInTheDocument();
    expect(screen.getByText(/Available today/i)).toBeInTheDocument();
  });

  it("calls onRemoveFilter when a chip remove button is clicked", () => {
    const onRemove = vi.fn();
    render(
      <StickyFiltersBar
        activeFilters={sampleFilters}
        onRemoveFilter={onRemove}
        onOpenPanel={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Remove filter: Consulting/i }),
    );

    expect(onRemove).toHaveBeenCalledWith("cat-1");
  });

  it("calls onOpenPanel when Filters button is clicked", () => {
    const onOpen = vi.fn();
    render(
      <StickyFiltersBar
        activeFilters={[]}
        onRemoveFilter={vi.fn()}
        onOpenPanel={onOpen}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Open filters panel/i }),
    );
    expect(onOpen).toHaveBeenCalled();
  });

  it("calls onReset when Reset button is clicked", () => {
    const onReset = vi.fn();
    render(
      <StickyFiltersBar
        activeFilters={sampleFilters}
        onRemoveFilter={vi.fn()}
        onOpenPanel={vi.fn()}
        onReset={onReset}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onReset).toHaveBeenCalled();
  });

  it("does not show Reset button when no filters are active", () => {
    render(
      <StickyFiltersBar
        activeFilters={[]}
        onRemoveFilter={vi.fn()}
        onOpenPanel={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Reset" }),
    ).not.toBeInTheDocument();
  });

  it("has toolbar role for accessibility", () => {
    render(
      <StickyFiltersBar
        activeFilters={sampleFilters}
        onRemoveFilter={vi.fn()}
        onOpenPanel={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("toolbar", { name: /Search filters/i }),
    ).toBeInTheDocument();
  });

  it("renders children when provided", () => {
    render(
      <StickyFiltersBar
        activeFilters={[]}
        onRemoveFilter={vi.fn()}
        onOpenPanel={vi.fn()}
        onReset={vi.fn()}
      >
        <input placeholder="Search..." />
      </StickyFiltersBar>,
    );

    expect(
      screen.getByPlaceholderText("Search..."),
    ).toBeInTheDocument();
  });
});
