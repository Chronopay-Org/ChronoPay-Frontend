import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterSidebar, FilterGroup } from "./filter-sidebar";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => "/dashboard",
}));

describe("FilterSidebar", () => {
  const mockFilters: FilterGroup[] = [
    {
      id: "category",
      title: "Category",
      options: [
        { id: "Components", label: "Components", count: 5 },
        { id: "Design", label: "Design", count: 3 },
        { id: "Testing", label: "Testing", count: 4 },
      ],
    },
    {
      id: "tags",
      title: "Tags",
      options: [
        { id: "react", label: "React", count: 2 },
        { id: "wcag", label: "WCAG", count: 3 },
      ],
    },
  ];

  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders filter groups with titles", () => {
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
  });

  it("expands/collapses filter groups", async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const categoryButton = screen.getByRole("button", { name: /Category/ });
    expect(categoryButton).toHaveAttribute("aria-expanded", "true");

    await user.click(categoryButton);
    expect(categoryButton).toHaveAttribute("aria-expanded", "false");

    await user.click(categoryButton);
    expect(categoryButton).toHaveAttribute("aria-expanded", "true");
  });

  it("displays all filter options when group is expanded", () => {
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByLabelText("Components (5)")).toBeInTheDocument();
    expect(screen.getByLabelText("Design (3)")).toBeInTheDocument();
    expect(screen.getByLabelText("Testing (4)")).toBeInTheDocument();
  });

  it("toggles filter options", async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const componentCheckbox = screen.getByLabelText("Components (5)");
    expect(componentCheckbox).not.toBeChecked();

    await user.click(componentCheckbox);
    expect(componentCheckbox).toBeChecked();

    await user.click(componentCheckbox);
    expect(componentCheckbox).not.toBeChecked();
  });

  it("shows active filter count badge", async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Initially no badge
    let badge = screen.queryByText(/^\d+$/);
    expect(badge).not.toBeInTheDocument();

    // After selecting a filter
    const componentCheckbox = screen.getByLabelText("Components (5)");
    await user.click(componentCheckbox);

    await waitFor(() => {
      const categoryButton = screen.getByRole("button", { name: /Category/ });
      expect(within(categoryButton.parentElement!).getByText("1")).toBeInTheDocument();
    });
  });

  it("calls onFiltersChange callback when filter is toggled", async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const componentCheckbox = screen.getByLabelText("Components (5)");
    await user.click(componentCheckbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  it("handles multiple selections in same group", async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const componentCheckbox = screen.getByLabelText("Components (5)");
    const designCheckbox = screen.getByLabelText("Design (3)");

    await user.click(componentCheckbox);
    await user.click(designCheckbox);

    expect(componentCheckbox).toBeChecked();
    expect(designCheckbox).toBeChecked();
  });

  it("has proper ARIA attributes for accessibility", () => {
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const categoryButton = screen.getByRole("button", { name: /Category/ });
    expect(categoryButton).toHaveAttribute("aria-expanded");
    expect(categoryButton).toHaveAttribute("aria-controls");

    const groupRole = screen.getByRole("group", { name: /Category filter options/ });
    expect(groupRole).toBeInTheDocument();
  });

  it("groups remain collapsible independently", async () => {
    const user = userEvent.setup();
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const categoryButton = screen.getByRole("button", { name: /^Category/ });
    const tagsButton = screen.getByRole("button", { name: /^Tags/ });

    await user.click(categoryButton);
    expect(categoryButton).toHaveAttribute("aria-expanded", "false");
    expect(tagsButton).toHaveAttribute("aria-expanded", "true");
  });

  it("renders without onFiltersChange callback", () => {
    render(
      <FilterSidebar filters={mockFilters} />
    );

    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
  });

  it("handles empty filter groups", () => {
    const emptyFilters: FilterGroup[] = [
      {
        id: "empty",
        title: "Empty Category",
        options: [],
      },
    ];

    render(
      <FilterSidebar
        filters={emptyFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("Empty Category")).toBeInTheDocument();
  });

  it("displays option counts correctly", () => {
    render(
      <FilterSidebar
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("(5)")).toBeInTheDocument(); // Components
    expect(screen.getByText("(3)")).toBeInTheDocument(); // Design
    expect(screen.getByText("(4)")).toBeInTheDocument(); // Testing
    expect(screen.getByText("(2)")).toBeInTheDocument(); // React
    expect(screen.getByText("(3)", { selector: "span" })).toBeInTheDocument(); // WCAG
  });
});
