"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_PARAM_KEY,
  DEFAULT_STORAGE_KEY,
} from "@/components/marketplace/results-per-page-selector";
import {
  type MarketplaceSort,
  parseSortParam,
} from "@/components/dashboard/marketplace-grid";
import type { FacetCountMap } from "@/components/marketplace/use-facet-counts";
import {
  getPriceTier,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_DURATIONS,
  MARKETPLACE_PRICE_TIERS,
  type MarketplaceCategory,
  type MarketplaceDuration,
  type MarketplaceListing,
  type MarketplacePriceTier,
} from "./catalogue";

export type MarketplaceFilterGroupId = "category" | "duration" | "price";

export const MARKETPLACE_FILTER_GROUP_IDS: readonly MarketplaceFilterGroupId[] = [
  "category",
  "duration",
  "price",
];

export interface MarketplaceQueryState {
  categories: MarketplaceCategory[];
  durations: MarketplaceDuration[];
  priceTiers: MarketplacePriceTier[];
  sort: MarketplaceSort;
  page: number;
  pageSize: number;
}

const VALID_CATEGORIES = new Set<string>(MARKETPLACE_CATEGORIES.map((c) => c.id));
const VALID_DURATIONS = new Set<string>(MARKETPLACE_DURATIONS.map((d) => d.id));
const VALID_PRICE_TIERS = new Set<string>(MARKETPLACE_PRICE_TIERS.map((p) => p.id));

function parsePositiveInt(raw: string | null): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= 1 ? n : null;
}

function parsePageSizeParam(raw: string | null): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return DEFAULT_PAGE_SIZE_OPTIONS.includes(n) ? n : null;
}

function readStoredPageSize(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEFAULT_STORAGE_KEY);
    return parsePageSizeParam(raw);
  } catch {
    return null;
  }
}

function writeStoredPageSize(pageSize: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEFAULT_STORAGE_KEY, String(pageSize));
  } catch {
    // Ignore storage errors in private browsing or disabled storage.
  }
}

function uniqueValid<T extends string>(
  values: readonly string[],
  allowed: Set<string>,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const v of values) {
    if (allowed.has(v) && !seen.has(v)) {
      seen.add(v);
      out.push(v as T);
    }
  }
  return out;
}

/**
 * Parse URL search params into a validated {@link MarketplaceQueryState}.
 * Unknown or malformed values are silently ignored and fall back to defaults.
 */
export function parseMarketplaceQuery(
  input: string | URLSearchParams | { toString(): string },
  fallbackPageSize: number = DEFAULT_PAGE_SIZE,
): MarketplaceQueryState {
  const params =
    input instanceof URLSearchParams
      ? input
      : new URLSearchParams(typeof input === "string" ? input : input.toString());

  const categories = uniqueValid<MarketplaceCategory>(
    params.getAll("category"),
    VALID_CATEGORIES,
  );
  const durations = uniqueValid<MarketplaceDuration>(
    params.getAll("duration"),
    VALID_DURATIONS,
  );
  const priceTiers = uniqueValid<MarketplacePriceTier>(
    params.getAll("price"),
    VALID_PRICE_TIERS,
  );
  const sort = parseSortParam(params.get("sort"));
  const page = parsePositiveInt(params.get("page")) ?? 1;
  const parsedPageSize = parsePageSizeParam(params.get(DEFAULT_PARAM_KEY));
  const safeFallback = DEFAULT_PAGE_SIZE_OPTIONS.includes(fallbackPageSize)
    ? fallbackPageSize
    : DEFAULT_PAGE_SIZE;
  const pageSize = parsedPageSize ?? safeFallback;

  return {
    categories,
    durations,
    priceTiers,
    sort,
    page,
    pageSize,
  };
}

/**
 * Serialize a {@link MarketplaceQueryState} into clean URLSearchParams.
 * Default values (`sort=newest`, `page=1`, `page-size=24`) are omitted so
 * clean `/marketplace` URLs stay uncluttered and round-trip cleanly.
 */
export function serializeMarketplaceQuery(
  state: MarketplaceQueryState,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const c of uniqueValid<MarketplaceCategory>(state.categories, VALID_CATEGORIES)) {
    params.append("category", c);
  }
  for (const d of uniqueValid<MarketplaceDuration>(state.durations, VALID_DURATIONS)) {
    params.append("duration", d);
  }
  for (const p of uniqueValid<MarketplacePriceTier>(state.priceTiers, VALID_PRICE_TIERS)) {
    params.append("price", p);
  }

  if (state.sort !== "newest") {
    params.set("sort", state.sort);
  }

  if (state.page > 1) {
    params.set("page", String(state.page));
  }

  if (
    state.pageSize !== DEFAULT_PAGE_SIZE &&
    DEFAULT_PAGE_SIZE_OPTIONS.includes(state.pageSize)
  ) {
    params.set(DEFAULT_PARAM_KEY, String(state.pageSize));
  }

  return params;
}

/**
 * Filter and stably sort marketplace listings according to the active query.
 */
export function filterAndSortListings(
  items: readonly MarketplaceListing[],
  query: Pick<MarketplaceQueryState, "categories" | "durations" | "priceTiers" | "sort">,
): MarketplaceListing[] {
  const filtered = items.filter((item) => {
    if (query.categories.length > 0 && !query.categories.includes(item.category)) {
      return false;
    }
    if (query.durations.length > 0 && !query.durations.includes(item.duration)) {
      return false;
    }
    if (
      query.priceTiers.length > 0 &&
      !query.priceTiers.includes(getPriceTier(item.priceAmount))
    ) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (query.sort) {
    case "price":
      sorted.sort((a, b) => a.priceAmount - b.priceAmount);
      break;
    case "soonest":
      sorted.sort((a, b) => Date.parse(a.availableAt) - Date.parse(b.availableAt));
      break;
    case "newest":
    default:
      sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      break;
  }

  return sorted;
}

/**
 * Compute per-option facet counts from the currently filtered result set.
 */
export function computeFacetCounts(
  filteredItems: readonly MarketplaceListing[],
): FacetCountMap {
  const counts: FacetCountMap = {};

  for (const c of MARKETPLACE_CATEGORIES) counts[c.id] = 0;
  for (const d of MARKETPLACE_DURATIONS) counts[d.id] = 0;
  for (const p of MARKETPLACE_PRICE_TIERS) counts[p.id] = 0;

  for (const item of filteredItems) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
    counts[item.duration] = (counts[item.duration] ?? 0) + 1;
    const tier = getPriceTier(item.priceAmount);
    counts[tier] = (counts[tier] ?? 0) + 1;
  }

  return counts;
}

export interface UseMarketplaceQueryReturn {
  query: MarketplaceQueryState;
  setFilterGroups: (active: Record<string, string[]>) => void;
  removeFilter: (groupId: MarketplaceFilterGroupId, optionId: string) => void;
  clearFilters: () => void;
  setSort: (sort: MarketplaceSort) => void;
  setPageSize: (pageSize: number) => void;
  setPage: (page: number) => void;
}

/**
 * URL-backed query state hook for `/marketplace`.
 * Parses filters, sort, page, and page size from `useSearchParams()` and
 * serializes updates back via `router.replace(..., { scroll: false })`.
 */
export function useMarketplaceQuery(): UseMarketplaceQueryReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const searchString = searchParams.toString();
  const [storedPageSize] = useState<number>(() => readStoredPageSize() ?? DEFAULT_PAGE_SIZE);

  const urlQuery = useMemo(
    () => parseMarketplaceQuery(searchString, storedPageSize),
    [searchString, storedPageSize],
  );

  // Local state mirrors URL state and allows immediate updates even when
  // router.replace is mocked in unit tests.
  const [query, setQuery] = useState<MarketplaceQueryState>(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const commit = useCallback(
    (next: MarketplaceQueryState) => {
      setQuery(next);
      startTransition(() => {
        const params = serializeMarketplaceQuery(next);
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, startTransition],
  );

  const setFilterGroups = useCallback(
    (active: Record<string, string[]>) => {
      commit({
        ...query,
        categories: uniqueValid<MarketplaceCategory>(
          active.category ?? [],
          VALID_CATEGORIES,
        ),
        durations: uniqueValid<MarketplaceDuration>(
          active.duration ?? [],
          VALID_DURATIONS,
        ),
        priceTiers: uniqueValid<MarketplacePriceTier>(
          active.price ?? [],
          VALID_PRICE_TIERS,
        ),
        page: 1,
      });
    },
    [commit, query],
  );

  const removeFilter = useCallback(
    (groupId: MarketplaceFilterGroupId, optionId: string) => {
      commit({
        ...query,
        categories:
          groupId === "category"
            ? query.categories.filter((c) => c !== optionId)
            : query.categories,
        durations:
          groupId === "duration"
            ? query.durations.filter((d) => d !== optionId)
            : query.durations,
        priceTiers:
          groupId === "price"
            ? query.priceTiers.filter((p) => p !== optionId)
            : query.priceTiers,
        page: 1,
      });
    },
    [commit, query],
  );

  const clearFilters = useCallback(() => {
    commit({
      ...query,
      categories: [],
      durations: [],
      priceTiers: [],
      page: 1,
    });
  }, [commit, query]);

  const setSort = useCallback(
    (sort: MarketplaceSort) => {
      commit({
        ...query,
        sort: parseSortParam(sort),
        page: 1,
      });
    },
    [commit, query],
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      if (!DEFAULT_PAGE_SIZE_OPTIONS.includes(pageSize)) return;
      writeStoredPageSize(pageSize);
      commit({
        ...query,
        pageSize,
        page: 1,
      });
    },
    [commit, query],
  );

  const setPage = useCallback(
    (page: number) => {
      const safePage = Number.isSafeInteger(page) && page >= 1 ? page : 1;
      commit({
        ...query,
        page: safePage,
      });
    },
    [commit, query],
  );

  return {
    query,
    setFilterGroups,
    removeFilter,
    clearFilters,
    setSort,
    setPageSize,
    setPage,
  };
}
