import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Marketplace from "./page";

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
    
    const option12 = screen.getByRole("radio", { name: /12 results per page/i });
    
    act(() => {
      fireEvent.click(option12);
    });
    
    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBe(12);
    });
  });

  it("seeds the recently viewed rail on first visit", async () => {
    vi.useFakeTimers();
    render(<Marketplace />);
    
    act(() => {
      vi.runAllTimers();
    });
    
    // Check that recently viewed rail has items
    await waitFor(() => {
      expect(screen.getByText("Recently viewed")).toBeInTheDocument();
    });
    
    expect(localStorage.getItem("chronopay-marketplace-visited")).toBe("true");
    
    vi.useRealTimers();
  });

  it("does not seed recently viewed items if already visited", async () => {
    localStorage.setItem("chronopay-marketplace-visited", "true");
    
    render(<Marketplace />);
    
    // The rail should not appear because no items were seeded
    expect(screen.queryByText("Recently viewed")).not.toBeInTheDocument();
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
});
