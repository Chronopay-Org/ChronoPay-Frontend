/**
 * uptime.types.test.ts
 * Comprehensive test suite for uptime type definitions
 * 
 * Coverage:
 * - Incident type validation
 * - DayData type validation
 * - UptimeCellProps type validation
 * - Invalid input handling
 * - State transitions
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from "vitest";
import type { Incident, DayData, UptimeCellProps } from "./uptime.types";

describe("uptime.types", () => {
  // ─── Incident Type Tests ────────────────────────────────────────────────

  describe("Incident", () => {
    it("accepts valid incident with all required fields", () => {
      const incident: Incident = {
        id: "incident-123",
        title: "API Timeout",
        summary: "Brief database connection timeout",
        severity: "major",
        startedAt: "2026-07-28T10:00:00Z",
        resolvedAt: "2026-07-28T10:15:00Z",
      };

      expect(incident.id).toBe("incident-123");
      expect(incident.severity).toBe("major");
    });

    it("accepts incident without resolvedAt (ongoing incident)", () => {
      const incident: Incident = {
        id: "incident-456",
        title: "Ongoing Issue",
        summary: "Current outage",
        severity: "critical",
        startedAt: "2026-07-28T10:00:00Z",
      };

      expect(incident.resolvedAt).toBeUndefined();
    });

    it("accepts all valid severity levels", () => {
      const severities: Array<Incident["severity"]> = [
        "minor",
        "major",
        "critical",
      ];

      severities.forEach((severity) => {
        const incident: Incident = {
          id: `incident-${severity}`,
          title: `${severity} incident`,
          summary: "Test",
          severity,
          startedAt: "2026-07-28T10:00:00Z",
        };

        expect(incident.severity).toBe(severity);
      });
    });

    it("handles incident with empty strings", () => {
      const incident: Incident = {
        id: "",
        title: "",
        summary: "",
        severity: "minor",
        startedAt: "",
        resolvedAt: "",
      };

      expect(incident.id).toBe("");
      expect(incident.title).toBe("");
    });

    it("handles incident with very long summary", () => {
      const longSummary = "a".repeat(10000);
      const incident: Incident = {
        id: "incident-long",
        title: "Long Summary Test",
        summary: longSummary,
        severity: "major",
        startedAt: "2026-07-28T10:00:00Z",
      };

      expect(incident.summary.length).toBe(10000);
    });

    it("handles incident with special characters in strings", () => {
      const incident: Incident = {
        id: "incident-<script>alert('xss')</script>",
        title: "Title with émojis 🚨💥",
        summary: "Summary with quotes \"'` and symbols @#$%",
        severity: "critical",
        startedAt: "2026-07-28T10:00:00Z",
      };

      expect(incident.title).toContain("🚨");
      expect(incident.summary).toContain("@#$%");
    });

    it("handles incident with invalid ISO timestamp format", () => {
      const incident: Incident = {
        id: "incident-789",
        title: "Invalid Date",
        summary: "Test",
        severity: "minor",
        startedAt: "not-a-valid-date",
        resolvedAt: "also-invalid",
      };

      expect(incident.startedAt).toBe("not-a-valid-date");
      expect(new Date(incident.startedAt).toString()).toBe("Invalid Date");
    });

    it("handles resolvedAt before startedAt", () => {
      const incident: Incident = {
        id: "incident-time",
        title: "Time Paradox",
        summary: "Resolved before it started",
        severity: "major",
        startedAt: "2026-07-28T10:00:00Z",
        resolvedAt: "2026-07-28T09:00:00Z",
      };

      expect(
        new Date(incident.resolvedAt!).getTime()
      ).toBeLessThan(new Date(incident.startedAt).getTime());
    });
  });

  // ─── DayData Type Tests ─────────────────────────────────────────────────

  describe("DayData", () => {
    it("accepts valid day data with zero incidents", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 100,
        incidents: [],
      };

      expect(dayData.uptimePercent).toBe(100);
      expect(dayData.incidents).toHaveLength(0);
    });

    it("accepts valid day data with multiple incidents", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 92.5,
        incidents: [
          {
            id: "1",
            title: "Issue 1",
            summary: "First issue",
            severity: "minor",
            startedAt: "2026-07-28T10:00:00Z",
          },
          {
            id: "2",
            title: "Issue 2",
            summary: "Second issue",
            severity: "critical",
            startedAt: "2026-07-28T14:00:00Z",
            resolvedAt: "2026-07-28T15:00:00Z",
          },
        ],
      };

      expect(dayData.incidents).toHaveLength(2);
    });

    it("handles uptime percentage of 0", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 0,
        incidents: [],
      };

      expect(dayData.uptimePercent).toBe(0);
    });

    it("handles uptime percentage of 100", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 100,
        incidents: [],
      };

      expect(dayData.uptimePercent).toBe(100);
    });

    it("handles decimal uptime percentages", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 99.999,
        incidents: [],
      };

      expect(dayData.uptimePercent).toBe(99.999);
    });

    it("handles uptime percentage exceeding 100", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 150,
        incidents: [],
      };

      expect(dayData.uptimePercent).toBeGreaterThan(100);
    });

    it("handles negative uptime percentage", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: -10,
        incidents: [],
      };

      expect(dayData.uptimePercent).toBeLessThan(0);
    });

    it("handles NaN uptime percentage", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: NaN,
        incidents: [],
      };

      expect(Number.isNaN(dayData.uptimePercent)).toBe(true);
    });

    it("handles Infinity uptime percentage", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: Infinity,
        incidents: [],
      };

      expect(dayData.uptimePercent).toBe(Infinity);
    });

    it("handles invalid date format", () => {
      const dayData: DayData = {
        date: "invalid-date",
        uptimePercent: 99.5,
        incidents: [],
      };

      expect(new Date(dayData.date).toString()).toBe("Invalid Date");
    });

    it("handles date with time component", () => {
      const dayData: DayData = {
        date: "2026-07-28T10:00:00Z",
        uptimePercent: 99.5,
        incidents: [],
      };

      expect(dayData.date).toContain("T");
    });

    it("handles empty date string", () => {
      const dayData: DayData = {
        date: "",
        uptimePercent: 99.5,
        incidents: [],
      };

      expect(dayData.date).toBe("");
    });

    it("handles very large number of incidents", () => {
      const incidents: Incident[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `incident-${i}`,
        title: `Incident ${i}`,
        summary: `Summary ${i}`,
        severity: "minor" as const,
        startedAt: "2026-07-28T10:00:00Z",
      }));

      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 50,
        incidents,
      };

      expect(dayData.incidents).toHaveLength(1000);
    });
  });

  // ─── UptimeCellProps Type Tests ─────────────────────────────────────────

  describe("UptimeCellProps", () => {
    it("accepts valid cell props", () => {
      const props: UptimeCellProps = {
        date: "2026-07-28",
        uptimePercent: 99.5,
        incidents: [],
      };

      expect(props.date).toBe("2026-07-28");
      expect(props.uptimePercent).toBe(99.5);
    });

    it("accepts cell props with incidents", () => {
      const props: UptimeCellProps = {
        date: "2026-07-28",
        uptimePercent: 95.5,
        incidents: [
          {
            id: "1",
            title: "Test",
            summary: "Test summary",
            severity: "major",
            startedAt: "2026-07-28T10:00:00Z",
          },
        ],
      };

      expect(props.incidents).toHaveLength(1);
    });

    it("handles all uptime percentage boundary values", () => {
      const testValues = [0, 50, 95, 99, 99.9, 100];

      testValues.forEach((value) => {
        const props: UptimeCellProps = {
          date: "2026-07-28",
          uptimePercent: value,
          incidents: [],
        };

        expect(props.uptimePercent).toBe(value);
      });
    });

    it("maintains type compatibility with DayData", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 99.5,
        incidents: [],
      };

      // Should be able to use DayData as UptimeCellProps
      const props: UptimeCellProps = {
        date: dayData.date,
        uptimePercent: dayData.uptimePercent,
        incidents: dayData.incidents,
      };

      expect(props.date).toBe(dayData.date);
      expect(props.uptimePercent).toBe(dayData.uptimePercent);
    });
  });

  // ─── State Transitions ──────────────────────────────────────────────────

  describe("State Transitions", () => {
    it("transitions incident from ongoing to resolved", () => {
      const ongoingIncident: Incident = {
        id: "incident-1",
        title: "Database Issue",
        summary: "Connection problems",
        severity: "critical",
        startedAt: "2026-07-28T10:00:00Z",
      };

      expect(ongoingIncident.resolvedAt).toBeUndefined();

      const resolvedIncident: Incident = {
        ...ongoingIncident,
        resolvedAt: "2026-07-28T10:30:00Z",
      };

      expect(resolvedIncident.resolvedAt).toBe("2026-07-28T10:30:00Z");
    });

    it("transitions severity from minor to major to critical", () => {
      const baseIncident = {
        id: "incident-1",
        title: "Escalating Issue",
        summary: "Getting worse",
        startedAt: "2026-07-28T10:00:00Z",
      };

      const minorIncident: Incident = {
        ...baseIncident,
        severity: "minor",
      };

      const majorIncident: Incident = {
        ...baseIncident,
        severity: "major",
      };

      const criticalIncident: Incident = {
        ...baseIncident,
        severity: "critical",
      };

      expect(minorIncident.severity).toBe("minor");
      expect(majorIncident.severity).toBe("major");
      expect(criticalIncident.severity).toBe("critical");
    });

    it("transitions day from high uptime to degraded", () => {
      const highUptime: DayData = {
        date: "2026-07-28",
        uptimePercent: 100,
        incidents: [],
      };

      const degraded: DayData = {
        ...highUptime,
        uptimePercent: 95.5,
        incidents: [
          {
            id: "1",
            title: "Degradation",
            summary: "Performance issues",
            severity: "minor",
            startedAt: "2026-07-28T10:00:00Z",
          },
        ],
      };

      expect(highUptime.uptimePercent).toBe(100);
      expect(degraded.uptimePercent).toBe(95.5);
      expect(degraded.incidents).toHaveLength(1);
    });

    it("accumulates multiple incidents over time", () => {
      const initial: DayData = {
        date: "2026-07-28",
        uptimePercent: 100,
        incidents: [],
      };

      const afterFirst: DayData = {
        ...initial,
        uptimePercent: 99.5,
        incidents: [
          {
            id: "1",
            title: "First Issue",
            summary: "Minor problem",
            severity: "minor",
            startedAt: "2026-07-28T10:00:00Z",
          },
        ],
      };

      const afterSecond: DayData = {
        ...afterFirst,
        uptimePercent: 95.2,
        incidents: [
          ...afterFirst.incidents,
          {
            id: "2",
            title: "Second Issue",
            summary: "Major problem",
            severity: "major",
            startedAt: "2026-07-28T14:00:00Z",
          },
        ],
      };

      expect(initial.incidents).toHaveLength(0);
      expect(afterFirst.incidents).toHaveLength(1);
      expect(afterSecond.incidents).toHaveLength(2);
    });
  });

  // ─── Integration Scenarios ──────────────────────────────────────────────

  describe("Integration Scenarios", () => {
    it("creates a complete 90-day uptime history", () => {
      const history: DayData[] = [];
      const baseDate = new Date("2026-05-01");

      for (let i = 0; i < 90; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        history.push({
          date: date.toISOString().split("T")[0],
          uptimePercent: 99 + Math.random(),
          incidents: [],
        });
      }

      expect(history).toHaveLength(90);
      expect(history[0].date).toBe("2026-05-01");
    });

    it("represents a major outage day", () => {
      const outageDay: DayData = {
        date: "2026-07-28",
        uptimePercent: 75.5,
        incidents: [
          {
            id: "outage-1",
            title: "Database Failure",
            summary: "Primary database crashed",
            severity: "critical",
            startedAt: "2026-07-28T08:00:00Z",
            resolvedAt: "2026-07-28T14:00:00Z",
          },
          {
            id: "outage-2",
            title: "API Degradation",
            summary: "Cascading failures",
            severity: "major",
            startedAt: "2026-07-28T08:30:00Z",
            resolvedAt: "2026-07-28T13:30:00Z",
          },
        ],
      };

      expect(outageDay.uptimePercent).toBeLessThan(95);
      expect(outageDay.incidents).toHaveLength(2);
      expect(
        outageDay.incidents.some((i) => i.severity === "critical")
      ).toBe(true);
    });

    it("represents a perfect uptime day", () => {
      const perfectDay: DayData = {
        date: "2026-07-28",
        uptimePercent: 100,
        incidents: [],
      };

      expect(perfectDay.uptimePercent).toBe(100);
      expect(perfectDay.incidents).toHaveLength(0);
    });

    it("converts DayData to UptimeCellProps", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 99.5,
        incidents: [
          {
            id: "1",
            title: "Minor Blip",
            summary: "Brief timeout",
            severity: "minor",
            startedAt: "2026-07-28T10:00:00Z",
            resolvedAt: "2026-07-28T10:05:00Z",
          },
        ],
      };

      const cellProps: UptimeCellProps = {
        date: dayData.date,
        uptimePercent: dayData.uptimePercent,
        incidents: dayData.incidents,
      };

      expect(cellProps).toEqual(dayData);
    });

    it("handles concurrent incidents with different severities", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: 88.5,
        incidents: [
          {
            id: "1",
            title: "Minor Issue",
            summary: "Small problem",
            severity: "minor",
            startedAt: "2026-07-28T10:00:00Z",
          },
          {
            id: "2",
            title: "Major Issue",
            summary: "Bigger problem",
            severity: "major",
            startedAt: "2026-07-28T10:00:00Z",
          },
          {
            id: "3",
            title: "Critical Issue",
            summary: "Serious problem",
            severity: "critical",
            startedAt: "2026-07-28T10:00:00Z",
          },
        ],
      };

      const severities = dayData.incidents.map((i) => i.severity);
      expect(severities).toContain("minor");
      expect(severities).toContain("major");
      expect(severities).toContain("critical");
    });
  });

  // ─── Error Cases ────────────────────────────────────────────────────────

  describe("Error and Boundary Behavior", () => {
    it("handles incident with null-like values coerced to strings", () => {
      const incident: Incident = {
        id: String(null),
        title: String(undefined),
        summary: "",
        severity: "minor",
        startedAt: "2026-07-28T10:00:00Z",
      };

      expect(incident.id).toBe("null");
      expect(incident.title).toBe("undefined");
    });

    it("handles extremely high uptime percentage", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: Number.MAX_SAFE_INTEGER,
        incidents: [],
      };

      expect(dayData.uptimePercent).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("handles extremely low uptime percentage", () => {
      const dayData: DayData = {
        date: "2026-07-28",
        uptimePercent: Number.MIN_SAFE_INTEGER,
        incidents: [],
      };

      expect(dayData.uptimePercent).toBe(Number.MIN_SAFE_INTEGER);
    });

    it("handles date at epoch boundary", () => {
      const dayData: DayData = {
        date: "1970-01-01",
        uptimePercent: 100,
        incidents: [],
      };

      expect(new Date(dayData.date).getTime()).toBe(0);
    });

    it("handles far future date", () => {
      const dayData: DayData = {
        date: "2999-12-31",
        uptimePercent: 100,
        incidents: [],
      };

      expect(new Date(dayData.date).getFullYear()).toBe(2999);
    });

    it("maintains referential integrity of incident arrays", () => {
      const incidents: Incident[] = [
        {
          id: "1",
          title: "Test",
          summary: "Test",
          severity: "minor",
          startedAt: "2026-07-28T10:00:00Z",
        },
      ];

      const day1: DayData = {
        date: "2026-07-28",
        uptimePercent: 99,
        incidents,
      };

      const day2: DayData = {
        date: "2026-07-29",
        uptimePercent: 99,
        incidents,
      };

      expect(day1.incidents).toBe(day2.incidents);
      expect(day1.incidents[0]).toBe(day2.incidents[0]);
    });

    it("handles immutable updates to incidents", () => {
      const original: DayData = {
        date: "2026-07-28",
        uptimePercent: 99,
        incidents: [
          {
            id: "1",
            title: "Original",
            summary: "Test",
            severity: "minor",
            startedAt: "2026-07-28T10:00:00Z",
          },
        ],
      };

      const updated: DayData = {
        ...original,
        incidents: [
          ...original.incidents,
          {
            id: "2",
            title: "Added",
            summary: "New",
            severity: "major",
            startedAt: "2026-07-28T11:00:00Z",
          },
        ],
      };

      expect(original.incidents).toHaveLength(1);
      expect(updated.incidents).toHaveLength(2);
      expect(original.incidents).not.toBe(updated.incidents);
    });
  });
});
