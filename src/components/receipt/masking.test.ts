import { describe, it, expect } from "vitest";
import {
  truncateHash,
  maskName,
  buildShareLink,
  maskRecoveryCode,
} from "./masking";
import { buildReceipt } from "./receipt-builder";

describe("truncateHash", () => {
  it("drops a trailing ...minted suffix", () => {
    expect(truncateHash("GA7Q...minted")).toBe("GA7Q");
  });

  it("keeps the first six and last six characters of a long identifier", () => {
    const hash =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    expect(truncateHash(hash)).toBe("012345...abcdef");
  });

  it("returns short identifiers unchanged", () => {
    expect(truncateHash("GA7Q")).toBe("GA7Q");
    expect(truncateHash("ABCDEFGHIJKLM")).toBe("ABCDEFGHIJKLM");
  });
});

describe("maskName", () => {
  it("reduces a full name to initials", () => {
    expect(maskName("alex rivera")).toBe("A. R.");
  });

  it("ignores extra and surrounding spaces", () => {
    expect(maskName("  alex   rivera  ")).toBe("A. R.");
  });

  it("returns an empty string for empty input", () => {
    expect(maskName("")).toBe("");
  });
});

describe("maskRecoveryCode", () => {
  it("returns bullets of equal length when the code is not revealed", () => {
    const code = "ABCD-EFGH-IJKL";
    const masked = maskRecoveryCode(code, false);
    expect(masked).toBe("•".repeat(code.length));
    expect(masked).toHaveLength(code.length);
  });
});

describe("buildShareLink", () => {
  const receipt = buildReceipt({
    slot: {
      id: "slot-1",
      title: "Architecture Review",
      rate: "120 XLM/hr",
      dateLabel: "Apr 1, 2026",
      timeRange: "10:00 UTC",
    },
    seller: { name: "Alex Rivera" },
    durationHours: 1.5,
    subtotal: 180,
    escrowFee: 2.7,
    stellarFee: 0.0001,
    totalCost: 182.7001,
    effectiveTotalCost: 182.7001,
    txHash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  });

  it("encodes the asset, truncated tx, masked parties, total and settlement under the receipt path", () => {
    const link = buildShareLink(receipt, "https://chronopay.app");
    const url = new URL(link);

    expect(url.pathname).toBe("/dashboard/slots/slot-1/receipt");
    expect(url.searchParams.get("asset")).toBe("CHRONO-SLOT-1");
    expect(url.searchParams.get("tx")).toBe("012345...abcdef");
    expect(url.searchParams.get("buyer")).toBe("Y.");
    expect(url.searchParams.get("seller")).toBe("A. R.");
    expect(url.searchParams.get("total")).toBe(receipt.total);
    expect(url.searchParams.get("settled")).toBe(receipt.settledAt);
  });

  it("never leaks raw buyer or seller names into the link", () => {
    const link = buildShareLink(receipt, "https://chronopay.app");

    expect(link).not.toContain(receipt.buyer.name);
    expect(link).not.toContain("Alex");
    expect(link).not.toContain("Rivera");
  });
});
