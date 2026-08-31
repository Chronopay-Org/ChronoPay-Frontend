import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MarketplaceGrid,
  MarketplaceItem,
  resolveGridColumnsClass,
  sortMarketplaceItems,
  MarketplaceSort,
  MarketplaceColumns,
} from "./marketplace-grid";

const h = vi.hoisted(() => ({
  search: new URLSearchParams(),
  router: { replace: vi.fn(), push: vi.fn() },
  pathname: "/dashboard",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => h.search,
  useRouter: () => h.router,
  usePathname: () => h.pathname,
}));

vi.mock("@/components/common/LiveRegion", () => ({
  LiveRegion: ({ children }: { children: React.ReactNode }) => (
    <div role="status">{children}</div>
  ),
}));

function setSearch(queryString: string) {
  h.search = new URLSearchParams(queryString);
}

function titleOrder(container: HTMLElement): string[] {
  return [...container.querySelectorAll("h3")].map((el) => el.textContent ?? "");
}

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
    createdAt: "2026-08-01T09:00:00.000Z",
    availableAt: "2026-08-10T09:00:00.000Z",
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
    createdAt: "2026-08-20T09:00:00.000Z",
    availableAt: "2026-08-05T09:00:00.000Z",
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
    createdAt: "2026-08-15T09:00:00.000Z",
  },
  {
    id: "4",
    title: "No Price Item",
    description: "An item that has no price yet.",
    category: "Testing",
    createdAt: "2026-08-03T09:00:00.000Z",
  },
];

describe("MarketplaceGrid", () => {
  beforeEach(() => {
    setSearch("");
    h.router.replace.mockClear();
    h.router.push.mockClear();
  });

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
    expect(screen.getByText(/Complete design system with semantic tokens/)).toBeInTheDocument();
  });

  it("displays item categories as badges", () => {
    render(<MarketplaceGrid items={mockItems} />);

    expect(screen.getAllByText("Components")).toHaveLength(1);
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getAllByText("Testing")).toHaveLength(2);
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

  it("shows a skeleton loading state with live announcement", () => {
    const { container } = render(<MarketplaceGrid items={mockItems} isLoading />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading marketplace items");
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("matches skeleton card heights to density (compact uses tighter padding)", () => {
    setSearch("density=compact");
    const { container } = render(<MarketplaceGrid items={mockItems} isLoading />);
    const compact = container.querySelector('[data-density="compact"]');
    expect(compact).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    render(<MarketplaceGrid items={[]} />);

    expect(screen.getByText("No items found")).toBeInTheDocument();
    expect(
      screen.getByText(/Try adjusting your search or filters to find what you're looking/i)
    ).toBeInTheDocument();
  });

  it("filters items by search query from the URL", () => {
    setSearch("q=Design");
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    expect(titleOrder(container)).toEqual(["Design Token System"]);
  });

  it("filters items by multiple categories", () => {
    setSearch("category=Design&category=Testing");
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    expect(titleOrder(container)).not.toContain("UI Component Library");
    expect(titleOrder(container)).toEqual(
      expect.arrayContaining(["Design Token System", "Accessibility Audit Template"])
    );
  });

  it("filters items that match any selected tag", () => {
    setSearch("tags=wcag");
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    expect(titleOrder(container)).toContain("Accessibility Audit Template");
    expect(titleOrder(container)).not.toContain("UI Component Library");
  });

  it("sorts by newest by default using createdAt desc", () => {
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    expect(titleOrder(container)).toEqual([
      "Design Token System",
      "Accessibility Audit Template",
      "No Price Item",
      "UI Component Library",
    ]);
  });

  it("sorts by price ascending, pushing items without a price last", () => {
    setSearch("sort=price");
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    expect(titleOrder(container)).toEqual([
      "Accessibility Audit Template",
      "Design Token System",
      "UI Component Library",
      "No Price Item",
    ]);
  });

  it("sorts by soonest availableAt ascending, pushing items without it last", () => {
    setSearch("sort=soonest");
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    expect(titleOrder(container)).toEqual([
      "Design Token System",
      "UI Component Library",
      "Accessibility Audit Template",
      "No Price Item",
    ]);
  });

  it("falls back to newest for an unknown sort param", () => {
    setSearch("sort=nan");
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    expect(titleOrder(container)[0]).toBe("Design Token System");
  });

  it("falls back to comfortable density for an unknown density param", () => {
    setSearch("density=xtreme");
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    expect(container.querySelector('[data-density="comfortable"]')).toBeInTheDocument();
  });

  it("applies compact density styling when requested", () => {
    setSearch("density=compact");
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    const grid = container.querySelector("[data-density='compact']");
    expect(grid).toBeInTheDocument();
    const card = container.querySelector("h3")?.parentElement?.parentElement;
    expect(card).toHaveClass("p-3");
  });

  it("uses comfortable density padding by default", () => {
    const { container } = render(<MarketplaceGrid items={mockItems} />);

    const card = container.querySelector("h3")?.parentElement?.parentElement;
    expect(card).toHaveClass("p-4");
  });

  it("announces the result count and sort via a live region", () => {
    setSearch("sort=price");
    render(<MarketplaceGrid items={mockItems} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      /4 items, sorted by price/
    );
  });

  it("supports different column configurations", () => {
    const { container } = render(<MarketplaceGrid items={mockItems} columns={2} />);

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
    expect(screen.queryByText("★")).not.toBeInTheDocument();
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

    render(<MarketplaceGrid items={itemsWithLongTitle} />);

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

    render(<MarketplaceGrid items={itemsWithLongDesc} />);

    const description = screen.getByText(/This is a very long description/);
    expect(description).toHaveClass("line-clamp-3");
  });

  it("uses a two-line clamp for compact descriptions", () => {
    setSearch("density=compact");
    const itemsWithLongDesc: MarketplaceItem[] = [
      {
        id: "1",
        title: "Test",
        description:
          "This is a very long description that should be truncated after lines because we keep the grid clean",
        category: "Test",
      },
    ];

    render(<MarketplaceGrid items={itemsWithLongDesc} />);

    const description = screen.getByText(/This is a very long description/);
    expect(description).toHaveClass("line-clamp-2");
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

    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("responsive grid layout", () => {
    const { container } = render(<MarketplaceGrid items={mockItems} columns={3} />);

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

  it("sorts deterministically with mixed ratings using stable order", () => {
    const dupDates = [
      { ...mockItems[0], title: "Same Date A" },
      { ...mockItems[1], title: "Same Date B", createdAt: mockItems[0].createdAt },
    ];
    const { container } = render(<MarketplaceGrid items={dupDates} />);
    const titles = [...container.querySelectorAll("h3")].map((el) => el.textContent);
    expect(titles).toEqual(["Same Date A", "Same Date B"]);
  });

  it("limits visible text of card inside grid wrapper", () => {
    const { container } = render(<MarketplaceGrid items={mockItems} />);
    expect(container.querySelector(".line-clamp-2")).toBeInTheDocument();
  });

  it("preserves items when no sort/mode params are present", () => {
    const { container } = render(<MarketplaceGrid items={mockItems.slice(0, 2)} />);
    expect(titleOrder(container).length).toBe(2);
  });

  it("keeps the number of results announced with a query filter", () => {
    setSearch("q=Component");
    render(<MarketplaceGrid items={mockItems} />);
    expect(screen.getByRole("status")).toHaveTextContent(/matching "component"/);
  });

  it("shows the emerald price value formatted with two decimals", () => {
    render(<MarketplaceGrid items={mockItems} />);
    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("shows only the category badge when a card has no other data", () => {
    const bare: MarketplaceItem[] = [{ id: "x", title: "Bare", description: "", category: "General" }];
    render(<MarketplaceGrid items={bare} />);
    expect(screen.getByText("Bare")).toBeInTheDocument();
    expect(screen.getByText("General")).toHaveClass("text-cyan-300");
    expect(screen.queryByText("Price")).not.toBeInTheDocument();
    expect(screen.queryByText("★")).not.toBeInTheDocument();
  });

  it("renders an empty state when items are undefined", () => {
    render(<MarketplaceGrid items={undefined as unknown as MarketplaceItem[]} />);

    expect(screen.getByText("No items found")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/0 items/);
  });

  it("pushes items with unparseable dates to the end of newest", () => {
    const badDates: MarketplaceItem[] = [
      { ...mockItems[0], title: "No date", createdAt: "not-a-date" },
      mockItems[1],
    ];
    const { container } = render(<MarketplaceGrid items={badDates} />);

    expect(titleOrder(container)[0]).toBe("Design Token System");
  });

  it("handles undated items when sorting by soonest", () => {
    const onlyDates: MarketplaceItem[] = [
      { ...mockItems[0], title: "Only avail", availableAt: "2026-08-05T09:00:00.000Z" },
      mockItems[3],
    ];
    const { container } = render(
      <MarketplaceGrid items={onlyDates} />
    );
    expect(titleOrder(container).length).toBe(2);
  });
});

describe("resolveGridColumnsClass", () => {
  it("returns a valid class for each known column count", () => {
    expect(resolveGridColumnsClass(1)).toBe("grid-cols-1");
    expect(resolveGridColumnsClass(2)).toBe("md:grid-cols-2");
    expect(resolveGridColumnsClass(4)).toBe("md:grid-cols-2 lg:grid-cols-4");
  });

  it("falls back to 3 columns for unknown values", () => {
    expect(resolveGridColumnsClass(9 as MarketplaceColumns)).toBe(
      "md:grid-cols-2 lg:grid-cols-3"
    );
  });
});

describe("sortMarketplaceItems", () => {
  const item = (overrides: Partial<MarketplaceItem>): MarketplaceItem => ({
    id: "x",
    title: "T",
    description: "D",
    category: "C",
    ...overrides,
  });

  it("keeps items without a price at the end for price sort", () => {
    const result = sortMarketplaceItems(
      [item({ title: "Has", price: 30 }), item({ title: "None" })],
      "price"
    );
    expect(result.map((i) => i.title)).toEqual(["Has", "None"]);
  });

  it("handles price ties with both items missing a price", () => {
    const result = sortMarketplaceItems(
      [item({ title: "A" }), item({ title: "B" })],
      "price"
    );
    expect(result.map((i) => i.title)).toEqual(["A", "B"]);
  });

  it("keeps items with no availability date at the end for soonest", () => {
    const result = sortMarketplaceItems(
      [item({ title: "Has", availableAt: "2026-08-10T09:00:00.000Z" }), item({ title: "None" })],
      "soonest"
    );
    expect(result.map((i) => i.title)).toEqual(["Has", "None"]);
  });

  it("pushes an undated first comparison to the end for soonest", () => {
    const result = sortMarketplaceItems(
      [item({ title: "None" }), item({ title: "Has", availableAt: "2026-08-10T09:00:00.000Z" })],
      "soonest"
    );
    expect(result.map((i) => i.title)).toEqual(["Has", "None"]);
  });

  it("treats two undated items as equal for soonest", () => {
    const result = sortMarketplaceItems(
      [item({ title: "None" }), item({ title: "None 2" })],
      "soonest"
    );
    expect(result.map((i) => i.title)).toEqual(["None", "None 2"]);
  });

  it("keeps items with no created date at the end for newest", () => {
    const result = sortMarketplaceItems(
      [
        item({ title: "None" }),
        item({ title: "Fresh", createdAt: "2026-08-20T09:00:00.000Z" }),
      ],
      "newest"
    );
    expect(result.map((i) => i.title)).toEqual(["Fresh", "None"]);
  });

  it("treats two undated items as equal for newest", () => {
    const result = sortMarketplaceItems(
      [item({ title: "None" }), item({ title: "None 2" })],
      "newest"
    );
    expect(result.map((i) => i.title)).toEqual(["None", "None 2"]);
  });

  it("does not mutate the input array", () => {
    const items = [item({ title: "A", price: 5 }), item({ title: "B", price: 1 })];
    sortMarketplaceItems(items, "price");
    expect(items[0].title).toBe("A");
  });

  it("sorts deterministically for every sort mode", () => {
    const modes: MarketplaceSort[] = ["newest", "price", "soonest"];
    for (const mode of modes) {
      const result = sortMarketplaceItems(mockItems, mode);
      expect(result).toHaveLength(mockItems.length);
    }
  });
});