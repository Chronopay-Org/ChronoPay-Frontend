import { describe, it, expect, beforeEach } from "vitest";
import {
  isRecentSearchItem,
  loadRecents,
  STORAGE_KEY,
  MAX_RECENTS,
} from "./use-search";

describe("isRecentSearchItem", () => {
  it("returns true for valid items with non-empty term and finite timestamp", () => {
    expect(isRecentSearchItem({ term: "Wallet", timestamp: 1700000000000 })).toBe(true);
    expect(isRecentSearchItem({ term: "Calendar", timestamp: 0 })).toBe(true);
  });

  it("returns false for null, primitives, and arrays", () => {
    expect(isRecentSearchItem(null)).toBe(false);
    expect(isRecentSearchItem(undefined)).toBe(false);
    expect(isRecentSearchItem(5)).toBe(false);
    expect(isRecentSearchItem("Wallet")).toBe(false);
    expect(isRecentSearchItem(true)).toBe(false);
    expect(isRecentSearchItem([])).toBe(false);
  });

  it("returns false for empty or whitespace-only terms", () => {
    expect(isRecentSearchItem({ term: "", timestamp: 1000 })).toBe(false);
    expect(isRecentSearchItem({ term: "   ", timestamp: 1000 })).toBe(false);
    expect(isRecentSearchItem({ term: 123, timestamp: 1000 })).toBe(false);
    expect(isRecentSearchItem({ timestamp: 1000 })).toBe(false);
  });

  it("returns false for non-finite or non-numeric timestamps", () => {
    expect(isRecentSearchItem({ term: "Wallet", timestamp: NaN })).toBe(false);
    expect(isRecentSearchItem({ term: "Wallet", timestamp: Infinity })).toBe(false);
    expect(isRecentSearchItem({ term: "Wallet", timestamp: -Infinity })).toBe(false);
    expect(isRecentSearchItem({ term: "Wallet", timestamp: "1000" })).toBe(false);
    expect(isRecentSearchItem({ term: "Wallet" })).toBe(false);
  });
});

describe("loadRecents", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty array when storage is missing, corrupt JSON, or non-array", () => {
    expect(loadRecents()).toEqual([]);

    window.localStorage.setItem(STORAGE_KEY, "{not-valid-json");
    expect(loadRecents()).toEqual([]);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ term: "Wallet", timestamp: 100 }));
    expect(loadRecents()).toEqual([]);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(null));
    expect(loadRecents()).toEqual([]);
  });

  it("drops invalid entries from junk arrays and yields a clean list", () => {
    const corrupt = [
      null,
      5,
      true,
      {},
      { term: "", timestamp: 1000 },
      { term: "   ", timestamp: 1000 },
      { term: "BadTimestamp", timestamp: "2026-01-01" },
      { term: "MissingTimestamp" },
      { term: "  Wallet  ", timestamp: 2000 },
      { term: "Calendar", timestamp: 1000 },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(corrupt));

    expect(loadRecents()).toEqual([
      { term: "Wallet", timestamp: 2000 },
      { term: "Calendar", timestamp: 1000 },
    ]);
  });

  it("maps legacy strings to timestamp 0 and drops blank strings", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(["Marketplace", "  ", "", "  History  "]),
    );

    expect(loadRecents()).toEqual([
      { term: "Marketplace", timestamp: 0 },
      { term: "History", timestamp: 0 },
    ]);
  });

  it("dedupes case-insensitively and keeps the newest entry", () => {
    const data = [
      { term: "wallet", timestamp: 1000 },
      { term: "Wallet", timestamp: 3000 },
      { term: "WALLET", timestamp: 2000 },
      "Calendar",
      { term: "calendar", timestamp: 500 },
      { term: "History", timestamp: 4000 },
      "HISTORY",
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    expect(loadRecents()).toEqual([
      { term: "Wallet", timestamp: 3000 },
      { term: "calendar", timestamp: 500 },
      { term: "History", timestamp: 4000 },
    ]);
  });

  it("slices to MAX_RECENTS after filtering invalid items and deduping", () => {
    const data = [
      null,
      5,
      { term: "One", timestamp: 100 },
      { term: "one", timestamp: 200 },
      { term: "Two", timestamp: 300 },
      { term: "Three", timestamp: 400 },
      { term: "Four", timestamp: 500 },
      { term: "Five", timestamp: 600 },
      { term: "Six", timestamp: 700 },
      { term: "Seven", timestamp: 800 },
      { term: "Eight", timestamp: 900 },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const result = loadRecents();
    expect(result).toHaveLength(MAX_RECENTS);
    expect(result).toEqual([
      { term: "one", timestamp: 200 },
      { term: "Two", timestamp: 300 },
      { term: "Three", timestamp: 400 },
      { term: "Four", timestamp: 500 },
      { term: "Five", timestamp: 600 },
      { term: "Six", timestamp: 700 },
    ]);
  });
});
