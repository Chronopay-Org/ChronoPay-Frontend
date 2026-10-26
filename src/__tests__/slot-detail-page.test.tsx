import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { metadata as slotMetadata } from "../app/dashboard/slots/[id]/page";

describe("Slot Detail Page", () => {
  it("exports generateMetadata that returns correct metadata for slot-1", async () => {
    const params = Promise.resolve({ id: "slot-1" });
    const result = await slotMetadata({ params });
    expect(result).toHaveProperty("title", "Product strategy call");
    expect(result.robots).toEqual({ index: false, follow: false });
  });

  it("exports generateMetadata that returns fallback for unknown slot", async () => {
    const params = Promise.resolve({ id: "unknown" });
    const result = await slotMetadata({ params });
    // Falls back to slot-1 which is "Product strategy call"
    expect(result).toHaveProperty("title", "Product strategy call");
    expect(result.robots).toEqual({ index: false, follow: false });
  });
});
