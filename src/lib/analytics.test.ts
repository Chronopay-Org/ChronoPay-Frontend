import { describe, it, expect, vi, afterEach } from "vitest";
import {
  track,
  setAnalyticsSink,
  trackDidYouMeanClick,
  type AnalyticsSink,
} from "./analytics";

describe("setAnalyticsSink / track", () => {
  afterEach(() => {
    // Always restore default sink after each test
    setAnalyticsSink(null);
  });

  it("routes track() calls through the injected sink", () => {
    const sink = vi.fn<AnalyticsSink>();
    setAnalyticsSink(sink);

    track("page_view", { path: "/dashboard" });

    expect(sink).toHaveBeenCalledOnce();
    expect(sink).toHaveBeenCalledWith("page_view", { path: "/dashboard" });
  });

  it("passes all props to the sink unchanged", () => {
    const sink = vi.fn<AnalyticsSink>();
    setAnalyticsSink(sink);

    const props = { original: "teh", suggested: "the", extra: 42 };
    track("did_you_mean_click", props);

    expect(sink).toHaveBeenCalledWith("did_you_mean_click", props);
  });

  it("restores the default sink when null is passed to setAnalyticsSink", () => {
    const sink = vi.fn<AnalyticsSink>();
    setAnalyticsSink(sink);
    setAnalyticsSink(null);

    // After restore the custom sink must NOT be called
    track("test_event", {});
    expect(sink).not.toHaveBeenCalled();
  });

  it("swaps sink mid-session without affecting earlier calls", () => {
    const firstSink = vi.fn<AnalyticsSink>();
    const secondSink = vi.fn<AnalyticsSink>();

    setAnalyticsSink(firstSink);
    track("event_a", {});

    setAnalyticsSink(secondSink);
    track("event_b", {});

    expect(firstSink).toHaveBeenCalledOnce();
    expect(firstSink).toHaveBeenCalledWith("event_a", {});
    expect(secondSink).toHaveBeenCalledOnce();
    expect(secondSink).toHaveBeenCalledWith("event_b", {});
  });
});

describe("trackDidYouMeanClick", () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it("resolves to true and routes through the injected sink", async () => {
    const sink = vi.fn<AnalyticsSink>();
    setAnalyticsSink(sink);

    const result = await trackDidYouMeanClick("teh", "the");

    expect(result).toBe(true);
    expect(sink).toHaveBeenCalledOnce();
    expect(sink).toHaveBeenCalledWith("did_you_mean_click", {
      original: "teh",
      suggested: "the",
    });
  });

  it("rejects when the original term is empty", async () => {
    await expect(trackDidYouMeanClick("", "the")).rejects.toThrow(
      "Both original and suggested terms are required for analytics tracking.",
    );
  });

  it("rejects when the suggested term is empty", async () => {
    await expect(trackDidYouMeanClick("teh", "")).rejects.toThrow(
      "Both original and suggested terms are required for analytics tracking.",
    );
  });

  it("does not call the sink when validation fails", async () => {
    const sink = vi.fn<AnalyticsSink>();
    setAnalyticsSink(sink);

    await trackDidYouMeanClick("", "the").catch(() => {});

    expect(sink).not.toHaveBeenCalled();
  });
});
