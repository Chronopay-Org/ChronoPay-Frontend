import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { buildCatalogue, getPriceTier } from "./catalogue";
import {
  computeFacetCounts,
  filterAndSortListings,
  parseMarketplaceQuery,
  serializeMarketplaceQuery,
  useMarketplaceQuery,
  type MarketplaceQueryState,
} from "./use-marketplace-query";

let currentSearchParams = new URLSearchParams();
const mockReplace = vi.fn((url: string) => {
  const qs = url.split("?")[1] ?? "";
  currentSearchParams = new URLSearchParams(qs);
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/marketplace",
  useSearchParams: () => currentSearchParams,
}));

describe("parseMarketplaceQuery & serializeMarketplaceQuery", () => {
  it("returns default state for empty search params", () => {
    const parsed = parseMarketplaceQuery("");
    expect(parsed).toEqual({
      categories: [],
      durations: [],
      priceTiers: [],
      sort: "newest",
      page: 1,
      pageSize: 24,
    });
    expect(serializeMarketplaceQuery(parsed).toString()).toBe("");
  });

  it("round-trips a full filtered, sorted, paginated query", () => {
    const original: MarketplaceQueryState = {
      categories: ["engineering", "design"],
      durations: ["30m", "60m"],
      priceTiers: ["25-50"],
      sort: "price",
      page: 2,
      pageSize: 12,
    };

    const qs = serializeMarketplaceQuery(original).toString();
    const roundTripped = parseMarketplaceQuery(qs);
    expect(roundTripped).toEqual(original);
  });

  it("ignores invalid and duplicate params", () => {
    const parsed = parseMarketplaceQuery(
      "category=engineering&category=bogus&category=engineering&duration=999m&duration=15m&price=free&price=over-50&sort=random&page=-3&page-size=999",
    );

    expect(parsed).toEqual({
      categories: ["engineering"],
      durations: ["15m"],
      priceTiers: ["over-50"],
      sort: "newest",
      page: 1,
      pageSize: 24,
    });
  });

  it("ignores non-numeric page and page-size values", () => {
    const parsed = parseMarketplaceQuery("page=abc&page-size=xyz&page=0");
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(24);
  });
});

describe("filterAndSortListings & computeFacetCounts", () => {
  const catalogue = buildCatalogue();

  it("filters by category, duration, and price tier", () => {
    const filtered = filterAndSortListings(catalogue, {
      categories: ["engineering"],
      durations: ["60m"],
      priceTiers: ["25-50"],
      sort: "newest",
    });

    expect(filtered.length).toBeGreaterThan(0);
    for (const item of filtered) {
      expect(item.category).toBe("engineering");
      expect(item.duration).toBe("60m");
      expect(getPriceTier(item.priceAmount)).toBe("25-50");
    }
  });

  it("sorts by price ascending", () => {
    const sorted = filterAndSortListings(catalogue, {
      categories: [],
      durations: [],
      priceTiers: [],
      sort: "price",
    });

    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].priceAmount).toBeGreaterThanOrEqual(
        sorted[i - 1].priceAmount,
      );
    }
  });

  it("sorts by soonest availability ascending", () => {
    const sorted = filterAndSortListings(catalogue, {
      categories: [],
      durations: [],
      priceTiers: [],
      sort: "soonest",
    });

    for (let i = 1; i < sorted.length; i++) {
      expect(Date.parse(sorted[i].availableAt)).toBeGreaterThanOrEqual(
        Date.parse(sorted[i - 1].availableAt),
      );
    }
  });

  it("computes facet counts matching the filtered set", () => {
    const filtered = filterAndSortListings(catalogue, {
      categories: ["design"],
      durations: [],
      priceTiers: [],
      sort: "newest",
    });
    const counts = computeFacetCounts(filtered);

    expect(counts.design).toBe(filtered.length);
    expect(counts.engineering).toBe(0);
    expect(counts.strategy).toBe(0);
    expect(counts.coaching).toBe(0);

    const durationSum =
      counts["15m"] + counts["30m"] + counts["60m"] + counts["120m"];
    expect(durationSum).toBe(filtered.length);

    const priceSum =
      counts["under-25"] + counts["25-50"] + counts["over-50"];
    expect(priceSum).toBe(filtered.length);
  });
});

describe("useMarketplaceQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    currentSearchParams = new URLSearchParams();
  });

  it("restores filters, sort, page, and page size from URL params", () => {
    currentSearchParams = new URLSearchParams(
      "category=design&duration=30m&sort=price&page=2&page-size=12",
    );

    const { result } = renderHook(() => useMarketplaceQuery());
    expect(result.current.query).toEqual({
      categories: ["design"],
      durations: ["30m"],
      priceTiers: [],
      sort: "price",
      page: 2,
      pageSize: 12,
    });
  });

  it("resets page to 1 when filters or sort change", () => {
    currentSearchParams = new URLSearchParams("page=3&page-size=12");

    const { result } = renderHook(() => useMarketplaceQuery());
    expect(result.current.query.page).toBe(3);

    act(() => {
      result.current.setFilterGroups({ category: ["engineering"] });
    });

    expect(result.current.query.page).toBe(1);
    expect(result.current.query.categories).toEqual(["engineering"]);
    expect(mockReplace).toHaveBeenCalledWith(
      "/marketplace?category=engineering&page-size=12",
      { scroll: false },
    );

    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.query.page).toBe(2);

    act(() => {
      result.current.setSort("soonest");
    });
    expect(result.current.query.page).toBe(1);
    expect(result.current.query.sort).toBe("soonest");
  });
});
