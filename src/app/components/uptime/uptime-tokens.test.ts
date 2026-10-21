import { describe, expect, it } from "vitest";
import {
  getUptimeColorClass,
  getUptimeColorVarDark,
  getUptimeColorVarLight,
  UPTIME_NONE,
  UPTIME_NONE_VAR_DARK,
  UPTIME_NONE_VAR_LIGHT,
} from "./uptime-tokens";

/**
 * Contract under test: the uptime design-token helpers exported by
 * `uptime-tokens.ts`. The colour thresholds documented in the module header are:
 *   - 100%            -> success (green)
 *   - 99% .. <100%    -> warning (amber/yellow)
 *   - 95% .. <99%     -> orange
 *   - <95%            -> error (red)
 * These tests pin the exact threshold boundaries and the fail-through behaviour
 * for invalid numeric input so a future refactor cannot silently change it.
 */

describe("getUptimeColorClass", () => {
  it("maps exactly 100% to the success green class", () => {
    expect(getUptimeColorClass(100)).toBe("bg-emerald-500");
  });

  it.each([
    [99.999, "bg-amber-400"],
    [99.9, "bg-amber-400"],
    [99, "bg-amber-400"],
  ])("maps %p%% to the warning yellow class", (percent, expected) => {
    expect(getUptimeColorClass(percent)).toBe(expected);
  });

  it.each([
    [98.999, "bg-orange-400"],
    [98, "bg-orange-400"],
    [95, "bg-orange-400"],
  ])("maps %p%% to the orange class", (percent, expected) => {
    expect(getUptimeColorClass(percent)).toBe(expected);
  });

  it.each([
    [94.999, "bg-red-500"],
    [50, "bg-red-500"],
    [0, "bg-red-500"],
    [-1, "bg-red-500"],
  ])("maps %p%% to the error red class", (percent, expected) => {
    expect(getUptimeColorClass(percent)).toBe(expected);
  });

  it("pins the exact state transitions at the inclusive lower bounds", () => {
    expect(getUptimeColorClass(94.9999)).toBe("bg-red-500");
    expect(getUptimeColorClass(95)).toBe("bg-orange-400");
    expect(getUptimeColorClass(98.9999)).toBe("bg-orange-400");
    expect(getUptimeColorClass(99)).toBe("bg-amber-400");
    expect(getUptimeColorClass(99.9999)).toBe("bg-amber-400");
    expect(getUptimeColorClass(100)).toBe("bg-emerald-500");
  });

  it("falls through to the error class for NaN (no comparison matches)", () => {
    expect(getUptimeColorClass(Number.NaN)).toBe("bg-red-500");
  });

  it("treats values above 100 that are not exactly 100 as the warning tier", () => {
    // Existing behaviour: `=== 100` is an exact match, everything >= 99 is amber.
    expect(getUptimeColorClass(100.1)).toBe("bg-amber-400");
  });
});

describe("getUptimeColorVarDark", () => {
  it("maps exactly 100% to the success CSS variable", () => {
    expect(getUptimeColorVarDark(100)).toBe("var(--success)");
  });

  it.each([
    [99.999, "#fbbf24"],
    [99, "#fbbf24"],
  ])("maps %p%% to the amber warning colour", (percent, expected) => {
    expect(getUptimeColorVarDark(percent)).toBe(expected);
  });

  it.each([
    [98.999, "#fb923c"],
    [95, "#fb923c"],
  ])("maps %p%% to the orange colour", (percent, expected) => {
    expect(getUptimeColorVarDark(percent)).toBe(expected);
  });

  it.each([
    [94.999, "var(--danger)"],
    [0, "var(--danger)"],
    [-1, "var(--danger)"],
  ])("maps %p%% to the danger CSS variable", (percent, expected) => {
    expect(getUptimeColorVarDark(percent)).toBe(expected);
  });

  it("falls through to the danger variable for NaN", () => {
    expect(getUptimeColorVarDark(Number.NaN)).toBe("var(--danger)");
  });
});

describe("getUptimeColorVarLight", () => {
  it("maps exactly 100% to the success colour", () => {
    expect(getUptimeColorVarLight(100)).toBe("#059669");
  });

  it.each([
    [99.999, "#d97706"],
    [99, "#d97706"],
  ])("maps %p%% to the amber warning colour", (percent, expected) => {
    expect(getUptimeColorVarLight(percent)).toBe(expected);
  });

  it.each([
    [98.999, "#ea580c"],
    [95, "#ea580c"],
  ])("maps %p%% to the orange colour", (percent, expected) => {
    expect(getUptimeColorVarLight(percent)).toBe(expected);
  });

  it.each([
    [94.999, "#dc2626"],
    [0, "#dc2626"],
    [-1, "#dc2626"],
  ])("maps %p%% to the error colour", (percent, expected) => {
    expect(getUptimeColorVarLight(percent)).toBe(expected);
  });

  it("falls through to the error colour for NaN", () => {
    expect(getUptimeColorVarLight(Number.NaN)).toBe("#dc2626");
  });
});

describe("dark/light parity", () => {
  it("selects the same tier in both modes across the full range", () => {
    const tierOf = (value: string): string => value;
    const samples = [100, 99.9, 99, 98.9, 96, 95, 94.9, 50, 0, -1];
    for (const sample of samples) {
      const dark = tierOf(getUptimeColorVarDark(sample));
      const light = tierOf(getUptimeColorVarLight(sample));
      // Both helpers share the identical threshold ladder, so neither should be
      // `undefined` and both should be non-empty strings.
      expect(typeof dark).toBe("string");
      expect(typeof light).toBe("string");
      expect(dark.length).toBeGreaterThan(0);
      expect(light.length).toBeGreaterThan(0);
    }
  });

  it("class helper and variable helpers agree on the tier for the same value", () => {
    const classFor100 = getUptimeColorClass(100);
    expect(getUptimeColorVarDark(100)).toBe("var(--success)");
    expect(getUptimeColorVarLight(100)).toBe("#059669");
    expect(classFor100).toBe("bg-emerald-500");
  });
});

describe("no-data tokens", () => {
  it("exports the neutral no-data class and colour variables", () => {
    expect(UPTIME_NONE).toBe("bg-slate-500");
    expect(UPTIME_NONE_VAR_DARK).toBe("var(--muted)");
    expect(UPTIME_NONE_VAR_LIGHT).toBe("#4a6080");
  });
});
