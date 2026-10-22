import { describe, it, expect } from "vitest";
import { addMonths } from "./date";

describe("addMonths", () => {
  it("adds months to a date in the middle of the month", () => {
    const date = new Date(2026, 0, 15); // Jan 15, 2026
    const result = addMonths(date, 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(15);
  });

  it("subtracts months with negative count", () => {
    const date = new Date(2026, 3, 15); // Apr 15, 2026
    const result = addMonths(date, -2);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(15);
  });

  it("returns same date when count is 0", () => {
    const date = new Date(2026, 5, 20);
    const result = addMonths(date, 0);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(20);
  });

  describe("month ends and day clamping", () => {
    it("clamps Jan 31 + 1 month to Feb 28 in a common year", () => {
      const date = new Date(2026, 0, 31); // Jan 31, 2026
      const result = addMonths(date, 1);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });

    it("clamps Jan 31 + 1 month to Feb 29 in a leap year", () => {
      const date = new Date(2024, 0, 31); // Jan 31, 2024 (leap year)
      const result = addMonths(date, 1);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
    });

    it("clamps Mar 31 - 1 month to Feb 28 in a common year", () => {
      const date = new Date(2026, 2, 31); // Mar 31, 2026
      const result = addMonths(date, -1);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });

    it("clamps Mar 31 - 1 month to Feb 29 in a leap year", () => {
      const date = new Date(2024, 2, 31); // Mar 31, 2024 (leap year)
      const result = addMonths(date, -1);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
    });

    it("clamps 31st to 30th when target month has 30 days (e.g. May 31 - 1 month -> Apr 30)", () => {
      const date = new Date(2026, 4, 31); // May 31, 2026
      const result = addMonths(date, -1);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(30);
    });

    it("clamps 31st to 30th when moving forward (e.g. Aug 31 + 1 month -> Sep 30)", () => {
      const date = new Date(2026, 7, 31); // Aug 31, 2026
      const result = addMonths(date, 1);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(8); // September
      expect(result.getDate()).toBe(30);
    });

    it("handles Feb 29 + 12 months (1 leap year to common year) -> Feb 28", () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024
      const result = addMonths(date, 12);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });
  });

  describe("year rollover", () => {
    it("advances year when adding past December", () => {
      const date = new Date(2025, 11, 31); // Dec 31, 2025
      const result = addMonths(date, 1);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(31);
    });

    it("recedes year when subtracting past January", () => {
      const date = new Date(2026, 0, 15); // Jan 15, 2026
      const result = addMonths(date, -1);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(15);
    });

    it("handles multi-year jump with month-end clamping", () => {
      const date = new Date(2023, 11, 31); // Dec 31, 2023
      const result = addMonths(date, 2); // -> Feb 2024 (leap year)
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
    });
  });

  it("preserves time components (hours, minutes, seconds, milliseconds)", () => {
    const date = new Date(2026, 0, 31, 14, 30, 45, 500);
    const result = addMonths(date, 1);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(45);
    expect(result.getMilliseconds()).toBe(500);
  });

  it("does not mutate the original date", () => {
    const date = new Date(2026, 0, 31);
    const timeBefore = date.getTime();
    addMonths(date, 1);
    expect(date.getTime()).toBe(timeBefore);
  });
});
