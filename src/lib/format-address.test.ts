import { describe, expect, it } from "vitest";
import {
  truncateAddress,
  truncateHash,
  truncateMiddle,
} from "./format-address";

const STELLAR_ADDRESS =
  "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
const TX_HASH =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("truncateMiddle", () => {
  it("returns empty string unchanged", () => {
    expect(truncateMiddle("")).toBe("");
  });

  it("returns short values unchanged", () => {
    expect(truncateMiddle("GAAZI4")).toBe("GAAZI4");
    expect(truncateMiddle("SHORT", 6, 4)).toBe("SHORT");
  });

  it("returns exact-boundary values unchanged (head + tail + 2 for single-char ellipsis)", () => {
    // Default head=6, tail=4, ellipsis="…" -> threshold = 12
    expect(truncateMiddle("123456789012")).toBe("123456789012");
    // head=8, tail=6, ellipsis="…" -> threshold = 16
    expect(truncateMiddle("G".repeat(16), 8, 6)).toBe("G".repeat(16));
  });

  it("truncates values one character past the boundary", () => {
    expect(truncateMiddle("1234567890123")).toBe("123456…0123");
    expect(truncateMiddle("ABCDEFGH123456789", 8, 6)).toBe("ABCDEFGH…456789");
  });

  it("truncates long Stellar addresses with default and custom head/tail", () => {
    expect(truncateMiddle(STELLAR_ADDRESS)).toBe("GAAZI4…CCWN");
    expect(truncateMiddle(STELLAR_ADDRESS, 8, 6)).toBe("GAAZI4TC…KOCCWN");
  });

  it("respects custom multi-character ellipsis boundary", () => {
    // head=6, tail=6, ellipsis="..." -> threshold = 15
    expect(truncateMiddle("123456789012345", 6, 6, "...")).toBe(
      "123456789012345",
    );
    expect(truncateMiddle("1234567890123456", 6, 6, "...")).toBe(
      "123456...123456",
    );
  });

  it("handles zero head or tail safely", () => {
    expect(truncateMiddle("ABCDEFGHIJ", 0, 4)).toBe("…GHIJ");
    expect(truncateMiddle("ABCDEFGHIJ", 4, 0)).toBe("ABCD…");
  });
});

describe("truncateAddress", () => {
  it("matches default 6/4 truncation with unicode ellipsis", () => {
    expect(truncateAddress(STELLAR_ADDRESS)).toBe("GAAZI4…CCWN");
    expect(truncateAddress("123456789012")).toBe("123456789012");
    expect(truncateAddress("1234567890123")).toBe("123456…0123");
  });

  it("supports custom head/tail overrides", () => {
    expect(truncateAddress(STELLAR_ADDRESS, 8, 6)).toBe("GAAZI4TC…KOCCWN");
  });
});

describe("truncateHash", () => {
  it("strips trailing ...minted suffix before truncating", () => {
    expect(truncateHash("GA7Q...minted")).toBe("GA7Q");
  });

  it("returns short and exact-boundary hashes unchanged", () => {
    expect(truncateHash("GA7Q")).toBe("GA7Q");
    expect(truncateHash("ABCDEFGHIJKLM")).toBe("ABCDEFGHIJKLM");
    expect(truncateHash("123456789012345")).toBe("123456789012345");
  });

  it("truncates long hashes with ASCII ellipsis and default 6/6", () => {
    expect(truncateHash(TX_HASH)).toBe("012345...abcdef");
  });

  it("supports custom head/tail", () => {
    expect(truncateHash(TX_HASH, 4, 4)).toBe("0123...cdef");
  });
});
