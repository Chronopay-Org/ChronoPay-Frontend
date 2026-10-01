import { describe, expect, it, vi } from "vitest";
import {
  CONFIG_LOAD_MAX_ATTEMPTS,
  loadExperimentalFeatureConfig,
} from "./experimental-feature-config";

const FEATURE_IDS = ["timeline-compression", "batch-operations"] as const;

describe("loadExperimentalFeatureConfig", () => {
  it("loads valid persisted feature states on the first attempt", () => {
    const reader = vi.fn(() =>
      JSON.stringify({
        "timeline-compression": true,
        "batch-operations": false,
      }),
    );

    const result = loadExperimentalFeatureConfig(FEATURE_IDS, reader);

    expect(result).toEqual({
      states: {
        "timeline-compression": true,
        "batch-operations": false,
      },
      status: "loaded",
      attempts: 1,
    });
    expect(reader).toHaveBeenCalledTimes(1);
  });

  it("retries a transient storage failure and returns the recovered value", () => {
    const reader = vi
      .fn<() => string | null>()
      .mockImplementationOnce(() => {
        throw new Error("storage temporarily unavailable");
      })
      .mockReturnValueOnce(JSON.stringify({ "timeline-compression": true }));

    const result = loadExperimentalFeatureConfig(FEATURE_IDS, reader);

    expect(result.status).toBe("loaded");
    expect(result.states).toEqual({ "timeline-compression": true });
    expect(result.attempts).toBe(2);
    expect(reader).toHaveBeenCalledTimes(2);
  });

  it("falls back with an actionable result after bounded read failures", () => {
    const reader = vi.fn(() => {
      throw new Error("storage blocked");
    });

    const result = loadExperimentalFeatureConfig(FEATURE_IDS, reader);

    expect(result.states).toEqual({});
    expect(result.status).toBe("unavailable");
    expect(result.attempts).toBe(CONFIG_LOAD_MAX_ATTEMPTS);
    expect(result.error).toContain("after 3 attempts");
    expect(result.error).toContain("storage blocked");
    expect(reader).toHaveBeenCalledTimes(CONFIG_LOAD_MAX_ATTEMPTS);
  });

  it("does not retry malformed persisted data", () => {
    const reader = vi.fn(() => "{not-json");

    const result = loadExperimentalFeatureConfig(FEATURE_IDS, reader);

    expect(result).toMatchObject({
      states: {},
      status: "invalid",
      attempts: 1,
    });
    expect(result.error).toContain("not valid JSON");
    expect(reader).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid known feature values without applying partial state", () => {
    const reader = vi.fn(() =>
      JSON.stringify({
        "timeline-compression": true,
        "batch-operations": "yes",
      }),
    );

    const result = loadExperimentalFeatureConfig(FEATURE_IDS, reader);

    expect(result.states).toEqual({});
    expect(result.status).toBe("invalid");
    expect(result.error).toContain("batch-operations");
  });

  it("returns an empty result when no persisted configuration exists", () => {
    const reader = vi.fn(() => null);

    expect(loadExperimentalFeatureConfig(FEATURE_IDS, reader)).toEqual({
      states: {},
      status: "empty",
      attempts: 1,
    });
  });
});
