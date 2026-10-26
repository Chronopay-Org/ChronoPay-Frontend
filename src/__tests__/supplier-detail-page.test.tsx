import { describe, it, expect } from "vitest";
import { metadata as supplierMetadata } from "../app/dashboard/suppliers/[id]/page";

describe("Supplier Detail Page", () => {
  it("exports generateMetadata that returns correct metadata for supplier-1", async () => {
    const params = Promise.resolve({ id: "supplier-1" });
    const result = await supplierMetadata({ params });
    expect(result).toHaveProperty("title", "Alex Rivera");
    expect(result.robots).toEqual({ index: false, follow: false });
  });

  it("exports generateMetadata that returns fallback for unknown supplier", async () => {
    const params = Promise.resolve({ id: "unknown" });
    const result = await supplierMetadata({ params });
    expect(result).toHaveProperty("title", "Alex Rivera");
    expect(result.robots).toEqual({ index: false, follow: false });
  });
});
