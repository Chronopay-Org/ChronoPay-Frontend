import { formatBadgeCount, getBadgeAriaLabel } from "./role-nav";

describe("role-nav badge scheme", () => {
  describe("formatBadgeCount", () => {
    it("returns string representation of counts under 100", () => {
      expect(formatBadgeCount(0)).toBe("0");
      expect(formatBadgeCount(5)).toBe("5");
      expect(formatBadgeCount(99)).toBe("99");
    });

    it("caps counts greater than 99 at '99+'", () => {
      expect(formatBadgeCount(100)).toBe("99+");
      expect(formatBadgeCount(1000)).toBe("99+");
      expect(formatBadgeCount(9999)).toBe("99+");
    });
  });

  describe("getBadgeAriaLabel", () => {
    it("announces dot badge correctly", () => {
      expect(getBadgeAriaLabel({ type: "dot" })).toBe("New updates available");
    });

    it("announces singular count correctly", () => {
      expect(getBadgeAriaLabel({ type: "count", value: 1 })).toBe("1 new update");
    });

    it("announces plural counts correctly", () => {
      expect(getBadgeAriaLabel({ type: "count", value: 5 })).toBe("5 new updates");
      expect(getBadgeAriaLabel({ type: "count", value: 100 })).toBe("100 new updates");
      expect(getBadgeAriaLabel({ type: "count", value: 9999 })).toBe("9999 new updates");
    });
  });
});
