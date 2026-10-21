import { describe, it, expect } from "vitest";
import {
  closestMatchDelta,
  matchLabel,
  sortedNearest,
  startTimeMinutes,
  CHOICE_HELP,
  type AlternativeSlot,
} from "./rebooking-utils";

const alt = (id: string, timeRange: string): AlternativeSlot => ({
  id,
  title: id,
  dateLabel: "Fri, Apr 4",
  timeRange,
  demand: "1 interested buyer",
  rate: "100 XLM / hr",
  status: "Healthy",
});

describe("rebooking-utils", () => {
  describe("startTimeMinutes", () => {
    it("parses HH:MM-HH:MM ranges", () => {
      expect(startTimeMinutes("10:00-11:30")).toBe(600);
      expect(startTimeMinutes("14:00 - 15:00 UTC")).toBe(840);
      expect(startTimeMinutes("09:05")).toBe(545);
    });

    it("handles leading whitespace", () => {
      expect(startTimeMinutes("   08:00-09:00")).toBe(480);
    });

    it("returns null for unparseable strings", () => {
      expect(startTimeMinutes("")).toBeNull();
      expect(startTimeMinutes("TBD - TBD")).toBeNull();
      expect(startTimeMinutes("morning")).toBeNull();
      expect(startTimeMinutes("3pm-5pm")).toBeNull();
    });

    it("rejects impossible clock values", () => {
      expect(startTimeMinutes("24:00-25:00")).toBeNull();
      expect(startTimeMinutes("10:75-11:00")).toBeNull();
    });
  });

  describe("closestMatchDelta", () => {
    it("computes absolute minute distance between start times", () => {
      expect(closestMatchDelta("11:00-12:00", "10:00-11:00")).toBe(60);
      expect(closestMatchDelta("09:30-10:30", "10:00-11:00")).toBe(30);
      expect(closestMatchDelta("10:00-11:00", "10:00-11:00")).toBe(0);
      expect(closestMatchDelta("10:00-11:00", "16:00-17:00")).toBe(360);
    });

    it("returns MAX_SAFE_INTEGER when either side does not parse", () => {
      expect(closestMatchDelta("TBD", "10:00-11:00")).toBe(
        Number.MAX_SAFE_INTEGER,
      );
      expect(closestMatchDelta("10:00-11:00", "TBD")).toBe(
        Number.MAX_SAFE_INTEGER,
      );
      expect(closestMatchDelta("TBD", "TBD")).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("sortedNearest", () => {
    const original = "Fri, Apr 4, 10:00-11:00";

    it("ranks by proximity to the original start time", () => {
      const list = [
        alt("far", "16:00-17:00"),
        alt("near", "10:30-11:30"),
        alt("same", "10:00-11:00"),
      ];
      const ids = sortedNearest(list, original).map((a) => a.id);
      expect(ids).toEqual(["same", "near", "far"]);
    });

    it("breaks ties by earliest start hour", () => {
      const list = [
        alt("delta-60-a", "09:00-10:00"),
        alt("delta-60-b", "11:00-12:00"),
        alt("delta-60-c", "08:00-09:00"),
      ];
      const ids = sortedNearest(list, original).map((a) => a.id);
      expect(ids).toEqual(["delta-60-c", "delta-60-a", "delta-60-b"]);
    });

    it("sorts unparseable entries last", () => {
      const list = [
        alt("unparseable", "Flexible window"),
        alt("matched", "10:00-11:00"),
      ];
      const ids = sortedNearest(list, original).map((a) => a.id);
      expect(ids).toEqual(["matched", "unparseable"]);
    });

    it("does not mutate the input array", () => {
      const list = [
        alt("far", "16:00-17:00"),
        alt("near", "10:30-11:30"),
        alt("same", "10:00-11:00"),
      ];
      const snapshot = list.map((a) => a.id);
      sortedNearest(list, original);
      expect(list.map((a) => a.id)).toEqual(snapshot);
    });

    it("sorts by start hour when no original range is given", () => {
      const list = [
        alt("late", "16:00-17:00"),
        alt("early", "09:00-10:00"),
      ];
      const ids = sortedNearest(list).map((a) => a.id);
      expect(ids).toEqual(["early", "late"]);
    });
  });

  describe("matchLabel", () => {
    it("describes an identical start time", () => {
      expect(matchLabel("10:00-11:00", "10:00-11:30")).toBe(
        "Same start time as your original booking",
      );
    });

    it("describes small minute gaps", () => {
      expect(matchLabel("10:30-11:30", "10:00-11:00")).toBe(
        "Starts 30 min from your original time",
      );
    });

    it("describes exact-hour gaps with pluralisation", () => {
      expect(matchLabel("12:00-13:00", "10:00-11:00")).toBe(
        "Starts 2 hours from your original time",
      );
      expect(matchLabel("11:00-12:00", "10:00-11:00")).toBe(
        "Starts 1 hour from your original time",
      );
    });

    it("combines hours and minutes", () => {
      expect(matchLabel("12:45-13:45", "10:00-11:00")).toBe(
        "Starts 2h 45m from your original time",
      );
    });

    it("falls back when times cannot be compared", () => {
      expect(matchLabel("Flexible", "10:00-11:00")).toBe(
        "Nearest available time",
      );
    });
  });

  describe("CHOICE_HELP", () => {
    it("distinguishes rebook from credit in its guidance text", () => {
      const rebookHelp = CHOICE_HELP.rebook;
      const creditHelp = CHOICE_HELP.credit;
      expect(rebookHelp.description).toMatch(/same supplier/i);
      expect(rebookHelp.description).not.toMatch(/credit/i);
      expect(creditHelp.description).toMatch(/credit/i);
      expect(creditHelp.description).not.toMatch(/same supplier/i);
    });

    it("covers all three choices", () => {
      expect(Object.keys(CHOICE_HELP).sort()).toEqual([
        "credit",
        "rebook",
        "refund",
      ]);
    });
  });
});