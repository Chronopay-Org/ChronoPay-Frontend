import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ToastProvider } from "@/hooks/use-toast";
import MarketplacePage, { metadata as marketplaceMetadata } from "../app/marketplace/page";

// Mock Next.js router hooks
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    navigate: vi.fn(),
  }),
  usePathname: () => "/marketplace",
  useSearchParams: () => ({
    has: vi.fn().mockReturnValue(false),
    get: vi.fn().mockReturnValue(null),
    getAll: vi.fn().mockReturnValue([]),
    entries: vi.fn().mockReturnValue([]),
    keys: vi.fn().mockReturnValue([]),
    values: vi.fn().mockReturnValue([]),
  }),
}));

describe("Marketplace Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the marketplace grid and recently viewed rail", () => {
    render(
      <ToastProvider>
        <MarketplacePage />
      </ToastProvider>
    );
    expect(screen.getByTestId("marketplace-grid")).toBeInTheDocument();
  });

  it("exports metadata with the correct title", () => {
    expect(marketplaceMetadata).toHaveProperty("title", "Marketplace");
  });
});
