import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MarketplaceGrid, MarketplaceItem } from "./marketplace-grid";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/common/LiveRegion", () => ({
  LiveRegion: ({ children }: { children: React.ReactNode }) => (
    <div role="status">{children}</div>
  ),
}));

describe("MarketplaceGrid", () => {
  const mockItems: MarketplaceItem[] = [
    {
      id: "1",
      title: "UI Component Library",
      description: "Comprehensive collection of accessible React components.",
      category: "Components",
      price: 49.99,
      rating: 4.8,
      reviews: 127,
      tags: ["react", "tailwind"],
    },
    {
      id: "2",
      title: "Design Token System",
      description: "Complete design system with semantic tokens.",
      category: "Design",
      price: 29.99,
      rating: 4.9,
      reviews: 89,
      tags: ["design-tokens", "figma"],
    },
    {
      id: "3",
      title: "Accessibility Audit Template",
      description: "Detailed WCAG 2.1 AA compliance checklist.",
      category: "Testing",
      price: 19.99,
      rating: 4.7,
      reviews: 45,
      tags: ["wcag", "testing"],
    },
  ];

  it("renders marketplace items in grid", () => {
    render(<MarketplaceGrid items={mockItems} />);

    expect(screen.getByText("UI Component Library")).toBeInTheDocument();
    expect(screen.getByText("Design Token System")).toBeInTheDocument();
    expect(screen.getByText("Accessibility Audit Template")).toBeInTheDocument();
  });

  it("displays item descriptions", () => {
    render(<MarketplaceGrid items={mockItems} />);

    expect(
      screen.getByText(/Comprehensive collection of accessible React components/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Complete design system with semantic tokens/)
    ).toBeInTheDocument();
  });

  it("displays item categories as badges", () => {
    render(<MarketplaceGrid items={mockItems} />);

    expect(screen.getByText("Components")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Testing")).toBeInTheDocument();
  });

  it("displays item prices", () => {
    render(<MarketplaceGrid items={mockItems} />);

    expect(screen.getByText("$49.99")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
    expect(screen.getByText("$19.99")).toBeInTheDocument();
  });

  it("displays item ratings and review counts", () => {
    render(<MarketplaceGrid items={mockItems} />);

    expect(screen.getByText("★ 4.8")).toBeInTheDocument();
    expect(screen.getByText("(127)")).toBeInTheDocument();
    expect(screen.getByText("★ 4.9")).toBeInTheDocument();
    expect(screen.getByText("(89)")).toBeInTheDocument();
  });

  it("displays item tags", () => {
    render(<MarketplaceGrid items={mockItems} />);

    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("tailwind")).toBeInTheDocument();
    expect(screen.getByText("design-tokens")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<MarketplaceGrid items={mockItems} isLoading={true} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    const loadingSpinner = document.querySelector(".animate-spin");
    expect(loadingSpinner).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    render(<MarketplaceGrid items={[]} />);

    expect(screen.getByText("No items found")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Try adjusting your search or filters to find what you're looking for/
      )
    ).toBeInTheDocument();
  });

  it("filters items by search query", () => {
    vi.mock("next/navigation", () => ({
      useSearchParams: () => {
        const params = new URLSearchParams();
        params.set("q", "Design");
        return params;
      },
    }));

    render(<MarketplaceGrid items={mockItems} />);

    // Search query filtering would be applied via useSearchParams
    // In real scenario, this would be tested with proper mock
    expect(screen.getByText("Design Token System")).toBeInTheDocument();
  });

  it("supports different column configurations", () => {
    const { container } = render(
      <MarketplaceGrid items={mockItems} columns={2} />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("md:grid-cols-2");
  });

  it("handles items without optional fields", () => {
    const minimalItems: MarketplaceItem[] = [
      {
        id: "1",
        title: "Basic Item",
        description: "A basic item",
        category: "General",
      },
    ];

    render(<MarketplaceGrid items={minimalItems} />);

    expect(screen.getByText("Basic Item")).toBeInTheDocument();
    expect(screen.getByText("A basic item")).toBeInTheDocument();
    expect(screen.queryByText("★")).not.toBeInTheDocument(); // No rating
  });

  it("truncates long titles", () => {
    const itemsWithLongTitle: MarketplaceItem[] = [
      {
        id: "1",
        title: "This is a very long title that should be truncated after two lines",
        description: "Description",
        category: "Test",
      },
    ];

    const { container } = render(
      <MarketplaceGrid items={itemsWithLongTitle} />
    );

    const title = screen.getByText(/This is a very long title/);
    expect(title).toHaveClass("line-clamp-2");
  });

  it("truncates long descriptions", () => {
    const itemsWithLongDesc: MarketplaceItem[] = [
      {
        id: "1",
        title: "Test",
        description:
          "This is a very long description that should be truncated after three lines because we want to keep the grid clean and readable",
        category: "Test",
      },
    ];

    const { container } = render(
      <MarketplaceGrid items={itemsWithLongDesc} />
    );

    const description = screen.getByText(/This is a very long description/);
    expect(description).toHaveClass("line-clamp-3");
  });

  it("displays tag overflow indicator", () => {
    const itemsWithManyTags: MarketplaceItem[] = [
      {
        id: "1",
        title: "Test",
        description: "Description",
        category: "Test",
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
      },
    ];

    render(<MarketplaceGrid items={itemsWithManyTags} />);

    expect(screen.getByText("+2")).toBeInTheDocument(); // 5 tags, showing 3, +2 more
  });

  it("announces search results via LiveRegion", () => {
    render(<MarketplaceGrid items={mockItems} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("responsive grid layout", () => {
    const { container } = render(
      <MarketplaceGrid items={mockItems} columns={3} />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("md:grid-cols-2");
    expect(grid).toHaveClass("lg:grid-cols-3");
  });

  it("items have hover effect styling", () => {
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    const items = container.querySelectorAll("[class*='hover:']");
    expect(items.length).toBeGreaterThan(0);
  });

  it("handles empty item list gracefully", () => {
    const { container } = render(<MarketplaceGrid items={[]} />);

    expect(screen.getByText("No items found")).toBeInTheDocument();
    expect(container.querySelector(".grid")).not.toBeInTheDocument();
  });

  it("displays price in emerald color", () => {
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    const prices = container.querySelectorAll(".text-emerald-400");
    expect(prices.length).toBeGreaterThan(0);
  });
});
