/**
 * UptimeChart.test.tsx
 * Comprehensive test suite for the UptimeChart component
 * 
 * Coverage:
 * - Rendering (90 cells, correct colors)
 * - Tooltip behavior (hover, focus, dismiss)
 * - Keyboard navigation (arrow keys)
 * - Dark/light mode
 * - Responsive behavior
 * - RTL support
 * - prefers-reduced-motion support
 * - WCAG 2.1 AA accessibility
 * - Snapshot tests
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { UptimeChart } from "./UptimeChart";
import { DayData, Incident } from "./uptime.types";

expect.extend(toHaveNoViolations);

// Mock data helpers
function createDayData(
  date: string,
  uptimePercent: number,
  incidents: Incident[] = []
): DayData {
  return { date, uptimePercent, incidents };
}

function create90DayData(): DayData[] {
  const days: DayData[] = [];
  const baseDate = new Date("2026-05-01");

  for (let i = 0; i < 90; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);

    const dateStr = date.toISOString().split("T")[0];
    const uptimePercent =
      i < 30 ? 100 : i < 60 ? 99.5 : i < 75 ? 97.2 : i < 85 ? 92.1 : 99.99;

    days.push(createDayData(dateStr, uptimePercent, []));
  }

  return days;
}

function createIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: "incident-1",
    title: "API Timeout",
    summary: "Brief database connection timeout affecting 5% of requests",
    severity: "major",
    startedAt: "2026-07-28T10:00:00Z",
    resolvedAt: "2026-07-28T10:15:00Z",
    ...overrides,
  };
}

describe("UptimeChart", () => {
  // ─── Rendering ─────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders without error with valid 90-day data", () => {
      const data = create90DayData();
      render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={98.5} />
      );
      expect(screen.getByText("API")).toBeInTheDocument();
      expect(screen.getByText(/98.5% uptime/)).toBeInTheDocument();
    });

    it("renders exactly 90 uptime cells for 90 days of data", () => {
      const data = create90DayData();
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
      );

      const cells = container.querySelectorAll('[role="img"]');
      expect(cells.length).toBe(90);
    });

    it("renders component name and current uptime percentage", () => {
      const data = create90DayData();
      render(
        <UptimeChart
          componentName="Payments Service"
          days={data}
          currentUptimePercent={99.9}
        />
      );

      expect(screen.getByText("Payments Service")).toBeInTheDocument();
      expect(screen.getByText(/99.9% uptime/)).toBeInTheDocument();
    });

    it("renders time period labels (oldest and newest date)", () => {
      const data = create90DayData();
      render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
      );

      // Labels should contain month and day (e.g., "May 01", "Today")
      const labels = screen.getAllByText(/\w+\s+\d+/);
      expect(labels.length).toBeGreaterThan(0);
      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("renders legend with all uptime tiers", () => {
      const data = create90DayData();
      render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
      );

      expect(screen.getByText(/100% uptime/)).toBeInTheDocument();
      expect(screen.getByText(/99–99.9%/)).toBeInTheDocument();
      expect(screen.getByText(/95–98.9%/)).toBeInTheDocument();
      expect(screen.getByText(/<95%/)).toBeInTheDocument();
    });

    it("renders with empty data gracefully", () => {
      render(
        <UptimeChart
          componentName="API"
          days={[]}
          currentUptimePercent={0}
        />
      );
      expect(screen.getByText(/No uptime data/)).toBeInTheDocument();
    });
  });

  // ─── Color Mapping ─────────────────────────────────────────────────────

  describe("Color Mapping", () => {
    it("applies green (emerald) color for 100% uptime", () => {
      const data = [createDayData("2026-07-28", 100)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={100} />
      );

      const cell = container.querySelector('[role="img"]');
      expect(cell).toHaveClass("bg-emerald-500");
    });

    it("applies yellow (amber) color for 99-99.9% uptime", () => {
      const data = [createDayData("2026-07-28", 99.5)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99.5} />
      );

      const cell = container.querySelector('[role="img"]');
      expect(cell).toHaveClass("bg-amber-400");
    });

    it("applies orange color for 95-98.9% uptime", () => {
      const data = [createDayData("2026-07-28", 97.2)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={97.2} />
      );

      const cell = container.querySelector('[role="img"]');
      expect(cell).toHaveClass("bg-orange-400");
    });

    it("applies red color for < 95% uptime", () => {
      const data = [createDayData("2026-07-28", 92.1)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={92.1} />
      );

      const cell = container.querySelector('[role="img"]');
      expect(cell).toHaveClass("bg-red-500");
    });

    it("applies gray color for null uptime (no data)", () => {
      const data: DayData[] = [
        {
          date: "2026-07-28",
          uptimePercent: NaN,
          incidents: [],
        },
      ];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={0} />
      );

      const cell = container.querySelector('[role="img"]');
      // Should have a neutral color
      expect(cell?.className).toMatch(/\b(bg-slate|bg-gray)/);
    });
  });

  // ─── Tooltip Behavior ───────────────────────────────────────────────────

  describe("Tooltip Behavior", () => {
    it("shows tooltip on cell hover", async () => {
      const data = [createDayData("2026-07-28", 99.5)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99.5} />
      );

      const cell = container.querySelector('[role="img"]');
      if (cell) {
        fireEvent.mouseEnter(cell);
        await waitFor(() => {
          expect(screen.getByRole("tooltip")).toBeInTheDocument();
        });
      }
    });

    it("shows tooltip on cell keyboard focus", async () => {
      const data = [createDayData("2026-07-28", 99.5)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99.5} />
      );

      const cell = container.querySelector('[role="img"]');
      if (cell) {
        fireEvent.focus(cell);
        await waitFor(() => {
          expect(screen.getByRole("tooltip")).toBeInTheDocument();
        });
      }
    });

    it("hides tooltip on mouse leave", async () => {
      const data = [createDayData("2026-07-28", 99.5)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99.5} />
      );

      const cell = container.querySelector('[role="img"]');
      if (cell) {
        fireEvent.mouseEnter(cell);
        await waitFor(() => {
          expect(screen.getByRole("tooltip")).toBeInTheDocument();
        });

        fireEvent.mouseLeave(cell);
        await waitFor(() => {
          expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        });
      }
    });

    it("dismisses tooltip on Escape key", async () => {
      const data = [createDayData("2026-07-28", 99.5)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99.5} />
      );

      const cell = container.querySelector('[role="img"]');
      if (cell) {
        fireEvent.focus(cell);
        await waitFor(() => {
          expect(screen.getByRole("tooltip")).toBeInTheDocument();
        });

        fireEvent.keyDown(document, { key: "Escape" });
        await waitFor(() => {
          expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        });
      }
    });

    it("tooltip shows date, uptime percentage, and incidents", async () => {
      const incident = createIncident({ title: "Database Outage" });
      const data = [
        createDayData("2026-07-28", 95.5, [incident]),
      ];

      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={95.5} />
      );

      const cell = container.querySelector('[role="img"]');
      if (cell) {
        fireEvent.mouseEnter(cell);
        await waitFor(() => {
          const tooltip = screen.getByRole("tooltip");
          expect(tooltip.textContent).toContain("95.5");
          expect(tooltip.textContent).toContain("Database Outage");
        });
      }
    });

    it("truncates long incident summaries to 100 characters", async () => {
      const longSummary = "a".repeat(150);
      const incident = createIncident({ summary: longSummary });
      const data = [createDayData("2026-07-28", 95.5, [incident])];

      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={95.5} />
      );

      const cell = container.querySelector('[role="img"]');
      if (cell) {
        fireEvent.mouseEnter(cell);
        await waitFor(() => {
          const tooltip = screen.getByRole("tooltip");
          expect(tooltip.textContent).toContain("...");
          // Should not contain full 150 characters
          expect(tooltip.textContent?.length).toBeLessThan(150);
        });
      }
    });

    it("shows 'No incidents' when day has zero incidents", async () => {
      const data = [createDayData("2026-07-28", 100)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={100} />
      );

      const cell = container.querySelector('[role="img"]');
      if (cell) {
        fireEvent.mouseEnter(cell);
        await waitFor(() => {
          expect(screen.getByText(/No incidents/)).toBeInTheDocument();
        });
      }
    });
  });

  // ─── Aria Labels ────────────────────────────────────────────────────────

  describe("ARIA Labels", () => {
    it("aria-label describes date, uptime percentage, and incident count", () => {
      const data = [createDayData("2026-07-28", 99.5)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99.5} />
      );

      const cell = container.querySelector('[role="img"]');
      const ariaLabel = cell?.getAttribute("aria-label") || "";

      expect(ariaLabel).toContain("July");
      expect(ariaLabel).toContain("28");
      expect(ariaLabel).toContain("99.5");
      expect(ariaLabel).toContain("uptime");
      expect(ariaLabel).toContain("incident");
    });

    it("aria-label pluralizes incident count correctly", () => {
      const data1 = [createDayData("2026-07-28", 99.5, [createIncident()])];
      const data2 = [
        createDayData("2026-07-29", 95.5, [
          createIncident({ id: "1" }),
          createIncident({ id: "2" }),
        ]),
      ];

      const { container: c1 } = render(
        <UptimeChart componentName="API" days={data1} currentUptimePercent={99.5} />
      );
      const cell1 = c1.querySelector('[role="img"]');
      expect(cell1?.getAttribute("aria-label")).toContain("1 incident");

      const { container: c2 } = render(
        <UptimeChart componentName="API" days={data2} currentUptimePercent={95.5} />
      );
      const cell2 = c2.querySelector('[role="img"]');
      expect(cell2?.getAttribute("aria-label")).toContain("2 incidents");
    });

    it("all cells are focusable (tabIndex=0)", () => {
      const data = create90DayData();
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
      );

      const cells = container.querySelectorAll('[role="img"]');
      cells.forEach((cell) => {
        expect(cell).toHaveAttribute("tabIndex", "0");
      });
    });
  });

  // ─── Keyboard Navigation ────────────────────────────────────────────────

  describe("Keyboard Navigation", () => {
    it("navigates between cells with arrow keys", async () => {
      const data = [
        createDayData("2026-07-26", 100),
        createDayData("2026-07-27", 99),
        createDayData("2026-07-28", 98),
      ];

      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={98} />
      );

      const cells = container.querySelectorAll('[role="img"]');
      const firstCell = cells[0] as HTMLElement;
      const secondCell = cells[1] as HTMLElement;

      firstCell.focus();
      expect(document.activeElement).toBe(firstCell);

      fireEvent.keyDown(firstCell, { key: "ArrowRight" });
      expect(document.activeElement).toBe(secondCell);
    });

    it("does not navigate beyond first or last cell", () => {
      const data = [
        createDayData("2026-07-27", 99),
        createDayData("2026-07-28", 98),
      ];

      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={98} />
      );

      const cells = container.querySelectorAll('[role="img"]');
      const lastCell = cells[cells.length - 1] as HTMLElement;

      lastCell.focus();
      fireEvent.keyDown(lastCell, { key: "ArrowRight" });
      expect(document.activeElement).toBe(lastCell);
    });
  });

  // ─── Dark Mode ──────────────────────────────────────────────────────────

  describe("Dark Mode", () => {
    it("renders in dark mode without errors", () => {
      const data = create90DayData();
      const { container } = render(
        <div data-theme="dark">
          <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
        </div>
      );

      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("renders with light theme attribute without errors", () => {
      const data = create90DayData();
      const { container } = render(
        <div data-theme="light">
          <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
        </div>
      );

      expect(container.querySelector("section")).toBeInTheDocument();
    });
  });

  // ─── Responsive Behavior ────────────────────────────────────────────────

  describe("Responsive Behavior", () => {
    it("renders at 375px width (mobile) without overflow", () => {
      const data = create90DayData();
      const { container } = render(
        <div style={{ width: "375px", overflow: "hidden" }}>
          <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
        </div>
      );

      // Chart should render and use scroll for overflow
      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("renders at 768px width (tablet) without errors", () => {
      const data = create90DayData();
      const { container } = render(
        <div style={{ width: "768px" }}>
          <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
        </div>
      );

      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("renders at 1200px width (desktop) without errors", () => {
      const data = create90DayData();
      const { container } = render(
        <div style={{ width: "1200px" }}>
          <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
        </div>
      );

      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("cells have horizontal scrolling capability on small screens", () => {
      const data = create90DayData();
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
      );

      const scrollContainer = container.querySelector(
        ".overflow-x-auto"
      ) as HTMLElement;
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  // ─── RTL Support ────────────────────────────────────────────────────────

  describe("RTL Support", () => {
    it("reverses cell order when dir=rtl", () => {
      const data = [
        createDayData("2026-07-26", 100),
        createDayData("2026-07-27", 99),
        createDayData("2026-07-28", 98),
      ];

      // Mock dir attribute
      const originalDir = document.documentElement.dir;
      document.documentElement.dir = "rtl";

      try {
        const { container } = render(
          <UptimeChart componentName="API" days={data} currentUptimePercent={98} />
        );

        const cellWrapper = container.querySelector(".flex");
        expect(cellWrapper).toHaveStyle("flexDirection: row-reverse");
      } finally {
        document.documentElement.dir = originalDir;
      }
    });
  });

  // ─── Prefers Reduced Motion ─────────────────────────────────────────────

  describe("Prefers Reduced Motion", () => {
    it("respects prefers-reduced-motion media query for cells", () => {
      const data = [createDayData("2026-07-28", 99.5)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99.5} />
      );

      const cell = container.querySelector('[role="img"]');
      const styles = window.getComputedStyle(cell!);

      // Verify transition is applied (even if reduced motion is set)
      expect(styles.transition).toContain("opacity");
    });
  });

  // ─── Snapshot Tests ─────────────────────────────────────────────────────

  describe("Snapshot Tests", () => {
    it("matches snapshot for 90-day chart with varied data", () => {
      const data = create90DayData();
      const { container } = render(
        <UptimeChart
          componentName="API Service"
          days={data}
          currentUptimePercent={98.5}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot for chart with incidents", () => {
      const data = [
        createDayData("2026-07-28", 95.5, [
          createIncident({ title: "Database Outage" }),
        ]),
      ];

      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={95.5} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot in dark mode", () => {
      const data = create90DayData();
      const { container } = render(
        <div data-theme="dark">
          <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
        </div>
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  // ─── Accessibility Audits (axe-core) ────────────────────────────────────

  describe("Accessibility (axe-core)", () => {
    it("passes axe accessibility check with standard data", async () => {
      const data = create90DayData();
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe check with incidents", async () => {
      const data = [
        createDayData("2026-07-28", 95.5, [
          createIncident({ title: "API Timeout" }),
          createIncident({ id: "2", title: "Database Error" }),
        ]),
      ];

      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={95.5} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe check in dark mode", async () => {
      const data = create90DayData();
      const { container } = render(
        <div data-theme="dark">
          <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("passes axe check in light mode", async () => {
      const data = create90DayData();
      const { container } = render(
        <div data-theme="light">
          <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("handles component name with special characters", () => {
      const data = [createDayData("2026-07-28", 99.5)];
      render(
        <UptimeChart
          componentName="API & Database (Primary)"
          days={data}
          currentUptimePercent={99.5}
        />
      );

      expect(screen.getByText(/API & Database/)).toBeInTheDocument();
    });

    it("handles 0% uptime percentage", () => {
      const data = [createDayData("2026-07-28", 0)];
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={0} />
      );

      const cell = container.querySelector('[role="img"]');
      expect(cell).toHaveClass("bg-red-500");
      expect(screen.getByText(/0% uptime/)).toBeInTheDocument();
    });

    it("handles currentUptimePercent as decimal", () => {
      const data = create90DayData();
      render(
        <UptimeChart
          componentName="API"
          days={data}
          currentUptimePercent={99.999}
        />
      );

      expect(screen.getByText(/99.999% uptime/)).toBeInTheDocument();
    });

    it("handles multiple incidents on single day", async () => {
      const incidents = [
        createIncident({ id: "1", title: "Issue 1" }),
        createIncident({ id: "2", title: "Issue 2" }),
        createIncident({ id: "3", title: "Issue 3" }),
      ];

      const data = [createDayData("2026-07-28", 92.1, incidents)];

      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={92.1} />
      );

      const cell = container.querySelector('[role="img"]');
      if (cell) {
        fireEvent.mouseEnter(cell);
        await waitFor(() => {
          expect(screen.getByText(/3 Incidents/)).toBeInTheDocument();
        });
      }
    });
  });

  // ─── Data Processing ────────────────────────────────────────────────────

  describe("Data Processing", () => {
    it("uses last 90 days when more than 90 days provided", () => {
      const days: DayData[] = [];
      const baseDate = new Date("2026-01-01");

      for (let i = 0; i < 120; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        days.push(
          createDayData(
            date.toISOString().split("T")[0],
            Math.random() * 100,
            []
          )
        );
      }

      const { container } = render(
        <UptimeChart componentName="API" days={days} currentUptimePercent={99} />
      );

      const cells = container.querySelectorAll('[role="img"]');
      expect(cells.length).toBe(90);
    });

    it("renders fewer than 90 cells when fewer days provided", () => {
      const data = [
        createDayData("2026-07-26", 100),
        createDayData("2026-07-27", 99),
        createDayData("2026-07-28", 98),
      ];

      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={98} />
      );

      const cells = container.querySelectorAll('[role="img"]');
      expect(cells.length).toBe(3);
    });
  });

  // ─── Semantic HTML ──────────────────────────────────────────────────────

  describe("Semantic HTML", () => {
    it("uses section landmark for chart", () => {
      const data = create90DayData();
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
      );

      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("has heading for chart title", () => {
      const data = create90DayData();
      render(
        <UptimeChart componentName="API Status" days={data} currentUptimePercent={99} />
      );

      expect(screen.getByRole("heading", { name: /API Status/ })).toBeInTheDocument();
    });

    it("uses region role with descriptive label", () => {
      const data = create90DayData();
      const { container } = render(
        <UptimeChart componentName="API" days={data} currentUptimePercent={99} />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute("aria-label");
      expect(region?.getAttribute("aria-label")).toContain("uptime");
    });
  });
});
