import { describe, it, expect, beforeEach } from "vitest"; // if Jest: remove this line and use global jest
import {
  SAMPLES_CLEARED_STORAGE_KEY,
  TOUR_DISMISSED_STORAGE_KEY,
  SAMPLE_TOOLTIP,
} from "./dashboard-data";

describe("dashboard-data constants", () => {
  it("exposes SAMPLES_CLEARED_STORAGE_KEY as a non-empty string", () => {
    expect(typeof SAMPLES_CLEARED_STORAGE_KEY).toBe("string");
    expect(SAMPLES_CLEARED_STORAGE_KEY.length).toBeGreaterThan(0);
  });

  it("exposes TOUR_DISMISSED_STORAGE_KEY as a non-empty string", () => {
    expect(typeof TOUR_DISMISSED_STORAGE_KEY).toBe("string");
    expect(TOUR_DISMISSED_STORAGE_KEY.length).toBeGreaterThan(0);
  });

  it("uses distinct storage keys so they never collide", () => {
    expect(SAMPLES_CLEARED_STORAGE_KEY).not.toBe(TOUR_DISMISSED_STORAGE_KEY);
  });

  it("locks the public key values (contract guard)", () => {
    // Replace with the ACTUAL values from the file
    expect(SAMPLES_CLEARED_STORAGE_KEY).toBe("<actual value>");
    expect(TOUR_DISMISSED_STORAGE_KEY).toBe("<actual value>");
  });

  it("exposes a non-empty SAMPLE_TOOLTIP", () => {
    expect(typeof SAMPLE_TOOLTIP).toBe("string");
    expect(SAMPLE_TOOLTIP.trim().length).toBeGreaterThan(0);
  });
});

describe("SAMPLES_CLEARED_STORAGE_KEY state transitions (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is unset by default", () => {
    expect(localStorage.getItem(SAMPLES_CLEARED_STORAGE_KEY)).toBeNull();
  });

  it("persists and reads back the cleared state", () => {
    localStorage.setItem(SAMPLES_CLEARED_STORAGE_KEY, "true");
    expect(localStorage.getItem(SAMPLES_CLEARED_STORAGE_KEY)).toBe("true");
  });

  it("can be reset (cleared -> not cleared)", () => {
    localStorage.setItem(SAMPLES_CLEARED_STORAGE_KEY, "true");
    localStorage.removeItem(SAMPLES_CLEARED_STORAGE_KEY);
    expect(localStorage.getItem(SAMPLES_CLEARED_STORAGE_KEY)).toBeNull();
  });

  it("does not affect the tour-dismissed key", () => {
    localStorage.setItem(SAMPLES_CLEARED_STORAGE_KEY, "true");
    expect(localStorage.getItem(TOUR_DISMISSED_STORAGE_KEY)).toBeNull();
  });
});