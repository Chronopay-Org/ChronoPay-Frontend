import { describe, expect, it } from "vitest";
import {
  findDidYouMean,
  levenshteinDistance,
  SEARCH_SUGGESTIONS,
} from "./use-search";

describe("levenshteinDistance", () => {
  it("computes known distances", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("same", "same")).toBe(0);
  });
});

describe("findDidYouMean", () => {
  it("returns the closest catalogue suggestion within the typo threshold", () => {
    expect(findDidYouMean("markteplace", [], SEARCH_SUGGESTIONS)).toBe("Marketplace");
  });

  it("returns null when suggestions already exist", () => {
    expect(findDidYouMean("markteplace", ["Marketplace"], SEARCH_SUGGESTIONS)).toBeNull();
  });

  it("returns null for queries shorter than two characters", () => {
    expect(findDidYouMean("a", [], SEARCH_SUGGESTIONS)).toBeNull();
  });

  it("applies tighter thresholds to shorter queries and caps longer queries at three", () => {
    expect(findDidYouMean("cat", [], ["cut"])).toBe("cut");
    expect(findDidYouMean("abcd", [], ["abxy"])).toBe("abxy");
    expect(findDidYouMean("abcdefgh", [], ["abcxyzgh"])).toBeNull();
    expect(findDidYouMean("abcdefghijkl", [], ["abcxyzghijkl"])).toBe("abcxyzghijkl");
  });

  it("returns null when no catalogue item is within the threshold", () => {
    expect(findDidYouMean("market", [], ["wallet"])).toBeNull();
  });
});
