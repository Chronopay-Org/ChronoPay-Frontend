import { createElement } from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Marketplace from "./page";
import { seedItems } from "./catalogue";

// Mock next/navigation
const mockSearchParams = {
  get: vi.fn(() => null),
  entries: vi.fn(function* () {}),
  toString: vi.fn(() => ""),
};

const mockRouter = {
  replace: vi.fn(),
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

// Mock next/image to render a plain img while preserving src, alt, sizes, and className
vi.mock("next/image", () => ({
  default: ({ fill: _fill, ...props }: any) => createElement("img", props),
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
    mockSearchParams.get.mockReturnValue(null);
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
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBe(24);
    });
  });

  it("changes the number of visible items when page size is changed", async () => {
    render(<Marketplace />);

    const option12 = screen.getByRole("radio", { name: /^12 results per page/i });

    act(() => {
      fireEvent.click(option12);
    });

    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
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

  it("clears seeding timers on unmount so nothing is added, and seeds once on remount", () => {
    vi.useFakeTimers();
    const updateListener = vi.fn();
    window.addEventListener("chronopay:recently-viewed-updated", updateListener);

    try {
      const { unmount } = render(<Marketplace />);
      unmount();

      act(() => {
        vi.runAllTimers();
      });

      expect(updateListener).not.toHaveBeenCalled();
      expect(localStorage.getItem("chronopay-marketplace-visited")).toBeNull();
      const storedAfterUnmount = JSON.parse(
        localStorage.getItem("chronopay-recently-viewed") ?? "[]"
      );
      expect(storedAfterUnmount).toHaveLength(0);

      // Remounting should seed exactly once
      const { unmount: unmountSecond } = render(<Marketplace />);
      act(() => {
        vi.runAllTimers();
      });

      expect(updateListener).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Recently viewed")).toBeInTheDocument();
      expect(localStorage.getItem("chronopay-marketplace-visited")).toBe("true");
      const storedAfterRemount = JSON.parse(
        localStorage.getItem("chronopay-recently-viewed") ?? "[]"
      );
      expect(storedAfterRemount).toHaveLength(seedItems.length);

      // A subsequent mount should not seed again
      unmountSecond();
      render(<Marketplace />);
      act(() => {
        vi.runAllTimers();
      });

      expect(updateListener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener("chronopay:recently-viewed-updated", updateListener);
      vi.useRealTimers();
    }
  });

  it("handles invalid page size in URL gracefully", () => {
    // Return an invalid page size
    mockSearchParams.get.mockReturnValue("invalid");

    render(<Marketplace />);

    // Should fallback to default 24
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(24);
  });

  it("renders without crashing if localStorage is disabled or throws", () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error("Storage disabled");
    });

    render(<Marketplace />);

    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(24);

    storageSpy.mockRestore();
  });

  it("links each card to its detail route and records it in recently viewed", async () => {
    render(<Marketplace />);

    const items = await screen.findAllByRole("listitem");
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
      const stored = localStorage.getItem("chronopay-marketplace-recently-viewed");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored as string);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.some((item: any) => item.id === id)).toBe(true);
    });
  });

  it("renders listing images with decorative alt, sizes, and 16:9 container", async () => {
    render(<Marketplace />);

    const grid = await screen.findByTestId("marketplace-grid");
    const imgs = grid.querySelectorAll("img");
    expect(imgs.length).toBe(24);

    const firstImg = imgs[0];
    expect(firstImg.getAttribute("alt")).toBe("");
    expect(firstImg.getAttribute("src")).toContain("https://images.unsplash.com/");
    expect(firstImg.getAttribute("sizes")).toBeTruthy();
    expect(firstImg.parentElement?.className).toContain("relative");
    expect(firstImg.parentElement?.className).toContain("aspect-video");
  });
});
