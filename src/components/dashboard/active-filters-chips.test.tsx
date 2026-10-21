import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveFiltersChips, ChipFilter } from "./active-filters-chips";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => "/dashboard",
}));

describe("ActiveFiltersChips", () => {
  const mockFilters: ChipFilter[] = [
    {
      groupId: "category",
      groupLabel: "Category",
      optionId: "Components",
      optionLabel: "Components",
    },
    {
      groupId: "category",
      groupLabel: "Category",
      optionId: "Design",
      optionLabel: "Design",
    },
    {
      groupId: "tags",
      groupLabel: "Tags",
      optionId: "react",
      optionLabel: "React",
    },
  ];

  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when filters array is empty", () => {
    const { container } = render(
      <ActiveFiltersChips
        filters={[]}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders active filter chips", () => {
    render(
      <ActiveFiltersChips
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText(/Category: Components/)).toBeInTheDocument();
    expect(screen.getByText(/Category: Design/)).toBeInTheDocument();
    expect(screen.getByText(/Tags: React/)).toBeInTheDocument();
  });

  it("displays active filter count", () => {
    render(
      <ActiveFiltersChips
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("Active filters (3)")).toBeInTheDocument();
  });

  it("removes individual filter when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ActiveFiltersChips
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const removeButtons = screen.getAllByRole("button", { name: /Remove/ });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  it("clears all filters when 'Clear all' button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ActiveFiltersChips
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearAllButton = screen.getByRole("button", { name: "Clear all" });
    await user.click(clearAllButton);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith([]);
    });
  });

  it("has proper ARIA labels for accessibility", () => {
    render(
      <ActiveFiltersChips
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const removeButtons = screen.getAllByRole("button", { name: /Remove/ });
    expect(removeButtons[0]).toHaveAttribute(
      "aria-label",
      "Remove Category: Components filter"
    );
  });

  it("renders without onFiltersChange callback", () => {
    render(
      <ActiveFiltersChips filters={mockFilters} />
    );

    expect(screen.getByText(/Category: Components/)).toBeInTheDocument();
  });

  it("handles single filter", () => {
    const singleFilter: ChipFilter[] = [
      {
        groupId: "category",
        groupLabel: "Category",
        optionId: "Components",
        optionLabel: "Components",
      },
    ];

    render(
      <ActiveFiltersChips
        filters={singleFilter}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("Active filters (1)")).toBeInTheDocument();
    expect(screen.getByText(/Category: Components/)).toBeInTheDocument();
  });

  it("displays filter label and option label together", () => {
    render(
      <ActiveFiltersChips
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const chip = screen.getByText(/Category: Components/);
    expect(chip).toBeInTheDocument();
    expect(chip.textContent).toMatch(/Category:\s+Components/);
  });

  it("has proper styling classes for visual appearance", () => {
    const { container } = render(
      <ActiveFiltersChips
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const chips = container.querySelectorAll("div[class*='bg-cyan']");
    expect(chips.length).toBeGreaterThan(0);
  });

  it("removes correct filter when multiple filters from same group", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ActiveFiltersChips
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const removeButtons = screen.getAllByRole("button", { name: /Remove/ });
    expect(removeButtons).toHaveLength(3);

    // Click remove on first filter
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({
            optionId: "Components",
          }),
        ])
      );
    });
  });

  it("updates when filters prop changes", () => {
    const { rerender } = render(
      <ActiveFiltersChips
        filters={mockFilters.slice(0, 1)}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("Active filters (1)")).toBeInTheDocument();

    rerender(
      <ActiveFiltersChips
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("Active filters (3)")).toBeInTheDocument();
  });
});
