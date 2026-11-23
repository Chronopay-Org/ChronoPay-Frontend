import { describe, it, expect } from "vitest";
import {
  seedItems,
  PRICE_BAND,
  buildCatalogue,
  getListingById,
} from "./catalogue";

describe("marketplace catalogue", () => {
  it("exposes 4 demo seedItems with matching hrefs", () => {
    expect(seedItems).toHaveLength(4);
    for (const item of seedItems) {
      expect(item.href).toBe(`/marketplace/${item.id}`);
    }
  });

  it("buildCatalogue() returns 50 items with unique ids", () => {
    const catalogue = buildCatalogue();
    expect(catalogue).toHaveLength(50);

    const ids = new Set(catalogue.map((item) => item.id));
    expect(ids.size).toBe(50);
  });

  it("sets each listing href to /marketplace/${id} and cycles generated prices through PRICE_BAND", () => {
    const catalogue = buildCatalogue();

    for (const item of catalogue) {
      expect(item.href).toBe(`/marketplace/${item.id}`);
    }

    const generated = catalogue.slice(seedItems.length);
    expect(generated).toHaveLength(46);

    generated.forEach((item, index) => {
      expect(item.id).toBe(`svc-${index + 1}`);
      expect(item.price).toBe(PRICE_BAND[index % PRICE_BAND.length]);
    });
  });

  it("resolves existing listings and returns undefined for unknown ids", () => {
    const last = getListingById("svc-46");
    expect(last).toBeDefined();
    expect(last?.id).toBe("svc-46");
    expect(last?.href).toBe("/marketplace/svc-46");

    const demo = getListingById("demo-1");
    expect(demo).toBe(seedItems[0]);

    expect(getListingById("nope")).toBeUndefined();
  });

  it("maintains referential stability across calls", () => {
    const first = buildCatalogue();
    const second = buildCatalogue();
    expect(first).toBe(second);

    expect(getListingById("svc-46")).toBe(getListingById("svc-46"));
    expect(getListingById("svc-46")).toBe(first[first.length - 1]);
  });
});
