import { describe, it, expect, vi, afterEach } from "vitest";
import { trackDidYouMeanClick } from "./header-search";

describe("trackDidYouMeanClick", () => {
  const originalEnv = process.env.NODE_ENV;
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockClear();
  });

  it("resolves successfully when both inputs are provided in development", async () => {
    process.env.NODE_ENV = "development";
    const result = await trackDidYouMeanClick("teh", "the");
    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith("[analytics] did_you_mean_click", {
      original: "teh",
      suggested: "the",
    });
  });

  it("resolves successfully when both inputs are provided in production", async () => {
    process.env.NODE_ENV = "production";
    const result = await trackDidYouMeanClick("teh", "the");
    expect(result).toBe(true);
    // In production, console.log should not be called
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("rejects when the original term is empty", async () => {
    await expect(trackDidYouMeanClick("", "the")).rejects.toThrow(
      "Both original and suggested terms are required for analytics tracking."
    );
  });

  it("rejects when the suggested term is empty", async () => {
    await expect(trackDidYouMeanClick("teh", "")).rejects.toThrow(
      "Both original and suggested terms are required for analytics tracking."
    );
  });
});
