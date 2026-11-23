import { render, screen, act, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Marketplace from "./page";

// Mock next/navigation
let currentSearch = "";
const mockSearchParams = {
  get: vi.fn((key: string) => new URLSearchParams(currentSearch).get(key)),
  entries: vi.fn(function* () {}),
  toString: vi.fn(() => currentSearch),
};

const mockRouter = {
  replace: vi.fn((href: string) => {
    currentSearch = href.split("?")[1] ?? "";
  }),
  push: vi.fn(),
  back: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/marketplace",
  useSearchParams: () => mockSearchParams,
}));

// Mock next/link to render a plain anchor while preserving the href
vi.mock("next/link", () => ({
  default: ({ prefetch, ...props }: any) => {
    const { prefetch: _prefetch, ...rest } = props;
    return <a  {...rest} />;
  },
}));

// Mock toast to prevent warnings
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Marketplace Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    currentSearch = "";
    mockSearchParams.get.mockImplementation((key: string) =>
      new URLSearchParams(currentSearch).get(key),
    );
    mockSearchParams.toString.mockImplementation(() => currentSearch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders correctly with default settings (24 items)", async () => {
    render(<Marketplace />);

    // Check main headings
    expect(screen.getByText("Marketplace")).toBeInTheDocument();

    // Wait for seeding to complete (if any) or just wait for items to render
    await waitFor(() => {
      const items = within(screen.getByTestId("marketplace-grid")).getAllByRole("listitem");
      expect(items.length).toBe(24);
    });
  });

  it("changes the number of visible items when page size is changed", async () => {
    render(<Marketplace />);
    const grid = await screen.findByTestId("marketplace-grid");

    const option12 = screen.getByRole("radio", { name: /^12 results per page/i });

    act(() => {
      fireEvent.click(option12);
    });

    await waitFor(() => {
      const items = within(grid).getAllByRole("listitem");
      expect(items.length).toBe(12);
    });
  });

  it("seeds the recently viewed rail on first visit", async () => {
    render(<Marketplace />);

    // Check that recently viewed rail has items
    await waitFor(() => {
      expect(screen.getByText("Recently viewed")).toBeInTheDocument();
    });

    expect(localStorage.getItem("chronopay-marketplace-visited")).toBe("true");
  });

  it("does not seed recently viewed items if already visited", async () => {
    localStorage.setItem("chronopay-marketplace-visited", "true");

    render(<Marketplace />);

    // The rail should not appear because no items were seeded
    expect(screen.queryByText("Recently viewed")).not.toBeInTheDocument();
  });

  it("handles invalid page size in URL gracefully", async () => {
    // Return an invalid page size
    mockSearchParams.get.mockReturnValue("invalid");

    render(<Marketplace />);

    // Should fallback to default 24
    const grid = await screen.findByTestId("marketplace-grid");
    const items = within(grid).getAllByRole("listitem");
    expect(items.length).toBe(24);
  });

  it("renders without crashing if localStorage is disabled or throws", async () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error("Storage disabled");
    });

    render(<Marketplace />);

    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    const grid = await screen.findByTestId("marketplace-grid");
    const items = within(grid).getAllByRole("listitem");
    expect(items.length).toBe(24);

    storageSpy.mockRestore();
  });

  it("links each card to its detail route and records it in recently viewed", async () => {
    render(<Marketplace />);

    const grid = await screen.findByTestId("marketplace-grid");
    const items = within(grid).getAllByRole("listitem");
    expect(items.length).toBe(24);

    const firstItem = items[0];
    const link = firstItem.querySelector("a[href^='/marketplace/']");
    expect(link).not.toBeNull();

    const href = link!.getAttribute("href");
    expect(href).toMatch(/^\/marketplace\/[^/]+$/);
    expect(href).not.toBe("/marketplace");

    const id = href!.replace("/marketplace/", "");

    act(() => {
      fireEvent.click(link!);
    });

    await waitFor(() => {
      const stored = localStorage.getItem("chronopay-recently-viewed");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored as string);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.some((item: any) => item.id === id)).toBe(true);
    });
  });
});
