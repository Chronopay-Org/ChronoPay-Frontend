import { describe, it, expect } from "vitest";
import { metadata } from "./page";
import { metadata as layoutMetadata } from "./layout";

describe("Dashboard metadata", () => {
  it("sets a route-specific title and is noindex", () => {
    expect(metadata.title).toBe("Dashboard");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("marks every dashboard route noindex via the segment layout", () => {
    expect(layoutMetadata.robots).toEqual({ index: false, follow: false });
  });
});
