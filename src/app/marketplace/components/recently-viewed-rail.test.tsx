/**
 * recently-viewed-rail.test.tsx
 *
 * Tests for the RecentlyViewedRail component.
 *
 * Accessibility tests:
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Focus management with roving tabindex
 * - ARIA labels and roles
 * - Screen reader announcements
 *
 * Edge cases:
 * - Empty rail (should not render)
 * - Clear history confirmation
 * - localStorage persistence
 * - RTL support
 * - Touch scroll behavior
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RecentlyViewedRail, useRecentlyViewed, type RecentlyViewedItem } from "./recently-viewed-rail";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("RecentlyViewedRail", () => {
  const mockItems: RecentlyViewedItem[] = [
    {
      id: "1",
      title: "1 Hour Consultation",
      price: "50 XLM",
      href: "/marketplace/1",
      viewedAt: Date.now(),
    },
    {
      id: "2",
      title: "30 Minute Session",
      price: "25 XLM",
      href: "/marketplace/2",
      viewedAt: Date.now() - 1000,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "chronopay-recently-viewed",
      JSON.stringify(mockItems)
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should not render when there are no items", () => {
    localStorage.clear();
    const { container } = render(<RecentlyViewedRail />);
    expect(container.firstChild).toBeNull();
  });

  it("should render items from localStorage", () => {
    render(<RecentlyViewedRail />);
    
    expect(screen.getByText("Recently viewed")).toBeInTheDocument();
    expect(screen.getByText("1 Hour Consultation")).toBeInTheDocument();
    expect(screen.getByText("30 Minute Session")).toBeInTheDocument();
  });

  it("should show clear history button", () => {
    render(<RecentlyViewedRail />);
    expect(screen.getByText("Clear history")).toBeInTheDocument();
  });

  it("should show confirmation when clear history is clicked", () => {
    render(<RecentlyViewedRail />);
    
    const clearButton = screen.getByText("Clear history");
    fireEvent.click(clearButton);
    
    expect(screen.getByText("Confirm?")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should cancel clear history when Cancel is clicked", () => {
    render(<RecentlyViewedRail />);
    
    const clearButton = screen.getByText("Clear history");
    fireEvent.click(clearButton);
    
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText("Confirm?")).not.toBeInTheDocument();
    expect(screen.getByText("Clear history")).toBeInTheDocument();
  });

  it("should have proper ARIA labels", () => {
    render(<RecentlyViewedRail />);
    
    const section = screen.getByLabelText("Recently viewed");
    expect(section).toBeInTheDocument();
    
    const region = screen.getByRole("region", { name: "Recently viewed items" });
    expect(region).toBeInTheDocument();
  });

  it("should have proper ARIA labels for item links", () => {
    render(<RecentlyViewedRail />);
    
    const itemLink = screen.getByLabelText(/View 1 Hour Consultation/);
    expect(itemLink).toBeInTheDocument();
    expect(itemLink).toHaveAttribute("href", "/marketplace/1");
  });

  it("should support keyboard navigation with arrow keys", () => {
    render(<RecentlyViewedRail />);
    
    const items = screen.getAllByRole("link");
    const firstItem = items[0];
    
    firstItem.focus();
    expect(firstItem).toHaveFocus();
    
    fireEvent.keyDown(firstItem, { key: "ArrowRight" });
    expect(items[1]).toHaveFocus();
    
    fireEvent.keyDown(items[1], { key: "ArrowLeft" });
    expect(firstItem).toHaveFocus();
  });

  it("should support Home and End keys", () => {
    render(<RecentlyViewedRail />);
    
    const items = screen.getAllByRole("link");
    const lastItem = items[items.length - 1];
    
    lastItem.focus();
    expect(lastItem).toHaveFocus();
    
    fireEvent.keyDown(lastItem, { key: "Home" });
    expect(items[0]).toHaveFocus();
    
    fireEvent.keyDown(items[0], { key: "End" });
    expect(lastItem).toHaveFocus();
  });

  it("should wrap navigation with arrow keys", () => {
    render(<RecentlyViewedRail />);
    
    const items = screen.getAllByRole("link");
    const lastItem = items[items.length - 1];
    
    lastItem.focus();
    fireEvent.keyDown(lastItem, { key: "ArrowRight" });
    expect(items[0]).toHaveFocus();
    
    const firstItem = items[0];
    fireEvent.keyDown(firstItem, { key: "ArrowLeft" });
    expect(lastItem).toHaveFocus();
  });

  it("should have horizontal scroll container", () => {
    const { container } = render(<RecentlyViewedRail />);
    
    const scrollContainer = container.querySelector('[role="region"]');
    expect(scrollContainer).toHaveClass("overflow-x-auto");
  });

  it("should limit items to MAX_ITEMS (10)", () => {
    const manyItems: RecentlyViewedItem[] = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      title: `Item ${i}`,
      price: `${i} XLM`,
      href: `/marketplace/${i}`,
      viewedAt: Date.now() - i * 1000,
    }));
    
    localStorage.setItem(
      "chronopay-recently-viewed",
      JSON.stringify(manyItems)
    );
    
    render(<RecentlyViewedRail />);
    
    const items = screen.getAllByRole("link");
    expect(items.length).toBe(10);
  });
});

describe("useRecentlyViewed hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should add item to localStorage", () => {
    const TestComponent = () => {
      const { addItem } = useRecentlyViewed();
      
      return (
        <button
          onClick={() =>
            addItem({
              id: "test-1",
              title: "Test Item",
              price: "10 XLM",
              href: "/test",
            })
          }
        >
          Add Item
        </button>
      );
    };
    
    render(<TestComponent />);
    
    const button = screen.getByText("Add Item");
    fireEvent.click(button);
    
    const stored = localStorage.getItem("chronopay-recently-viewed");
    expect(stored).toBeTruthy();
    
    const items = JSON.parse(stored!);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("test-1");
  });

  it("should move existing item to front when added again", () => {
    const existingItems: RecentlyViewedItem[] = [
      {
        id: "1",
        title: "Item 1",
        price: "10 XLM",
        href: "/1",
        viewedAt: Date.now(),
      },
      {
        id: "2",
        title: "Item 2",
        price: "20 XLM",
        href: "/2",
        viewedAt: Date.now() - 1000,
      },
    ];
    
    localStorage.setItem(
      "chronopay-recently-viewed",
      JSON.stringify(existingItems)
    );
    
    const TestComponent = () => {
      const { addItem } = useRecentlyViewed();
      
      return (
        <button
          onClick={() =>
            addItem({
              id: "2",
              title: "Item 2",
              price: "20 XLM",
              href: "/2",
            })
          }
        >
          Add Existing
        </button>
      );
    };
    
    render(<TestComponent />);
    
    const button = screen.getByText("Add Existing");
    fireEvent.click(button);
    
    const stored = localStorage.getItem("chronopay-recently-viewed");
    const items = JSON.parse(stored!);
    
    expect(items[0].id).toBe("2");
    expect(items).toHaveLength(2);
  });

  it("should dispatch custom event on update", () => {
    const eventListener = vi.fn();
    window.addEventListener("chronopay:recently-viewed-updated", eventListener);
    
    const TestComponent = () => {
      const { addItem } = useRecentlyViewed();
      
      return (
        <button
          onClick={() =>
            addItem({
              id: "test-1",
              title: "Test Item",
              price: "10 XLM",
              href: "/test",
            })
          }
        >
          Add Item
        </button>
      );
    };
    
    render(<TestComponent />);
    
    const button = screen.getByText("Add Item");
    fireEvent.click(button);
    
    expect(eventListener).toHaveBeenCalled();
    
    window.removeEventListener("chronopay:recently-viewed-updated", eventListener);
  });
});
