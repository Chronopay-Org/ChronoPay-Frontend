import { describe, it, expect } from "vitest";
import { buildReceipt } from "./receipt-builder";

describe("buildReceipt", () => {
  const baseParams = {
    slot: {
      id: "slot-1",
      title: "Architecture Review",
      rate: "120 XLM/hr",
      dateLabel: "Tomorrow",
      timeRange: "10:00 - 11:30",
    },
    seller: {
      name: "Dr. Sarah Jenkins",
      role: "Lead Architect",
    },
    durationHours: 1.5,
    subtotal: 180,
    escrowFee: 2.7,
    stellarFee: 0.0001,
    totalCost: 182.7001,
    txHash: "mock-tx-hash-1234",
  };

  it("builds an undiscounted receipt correctly when no promo code is applied", () => {
    const receipt = buildReceipt({
      ...baseParams,
      effectiveTotalCost: 182.7001,
      discountPercent: 0,
      promoCode: "",
    });

    expect(receipt.total).toBe("182.7001 XLM");
    expect(receipt.net).toBe("180.00 XLM");
    expect(receipt.lineItems).toHaveLength(3);
    expect(receipt.lineItems.map((item) => item.label)).toEqual([
      "Token subtotal",
      "Smart escrow fee",
      "Stellar network fee",
    ]);
  });

  it("builds a discounted receipt with promo code and discount line item when a promo is applied", () => {
    // 20% discount on 182.7001 = 146.16008 -> 146.1601 XLM
    const effectiveTotalCost = 182.7001 * 0.8;
    const receipt = buildReceipt({
      ...baseParams,
      effectiveTotalCost,
      discountPercent: 20,
      promoCode: "SAVE20",
    });

    expect(receipt.total).toBe(`${effectiveTotalCost.toFixed(4)} XLM`);
    expect(receipt.lineItems).toHaveLength(4);

    const discountLine = receipt.lineItems.find((item) =>
      item.label.includes("Promo discount")
    );
    expect(discountLine).toBeDefined();
    expect(discountLine?.label).toBe("Promo discount (SAVE20)");
    expect(discountLine?.value).toBe(`-${(baseParams.totalCost - effectiveTotalCost).toFixed(4)} XLM`);
    expect(discountLine?.note).toBe("20% promo code applied");
  });

  it("retains the snapshotted charged amounts even if promo parameters are subsequently cleared", () => {
    // Initial snapshot at purchase with 10% promo
    const snapshottedEffectiveTotal = 182.7001 * 0.9;
    const initialReceipt = buildReceipt({
      ...baseParams,
      effectiveTotalCost: snapshottedEffectiveTotal,
      discountPercent: 10,
      promoCode: "WELCOME10",
    });

    expect(initialReceipt.total).toBe(`${snapshottedEffectiveTotal.toFixed(4)} XLM`);
    expect(initialReceipt.lineItems.some((item) => item.label.includes("Promo discount"))).toBe(true);

    // If an external component re-renders with 0% discount without updating the snapshot,
    // passing the snapshotted values guarantees the receipt remains unchanged.
    const preservedReceipt = buildReceipt({
      ...baseParams,
      effectiveTotalCost: snapshottedEffectiveTotal,
      discountPercent: 10,
      promoCode: "WELCOME10",
    });

    expect(preservedReceipt).toEqual(initialReceipt);
  });
});
