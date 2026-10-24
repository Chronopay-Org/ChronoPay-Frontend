import { describe, it, expect } from "vitest";
import { metadata } from "./page";

describe("SharedReceiptPage metadata", () => {
  it("sets a route-specific title and is noindex", () => {
    expect(metadata.title).toBe("Shared receipt");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
