import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import type { DayData } from "@/app/components/uptime";

const h = vi.hoisted(() => ({
  uptime: [] as Array<{ componentName: string; days: DayData[]; currentUptimePercent: number }>,
  chips: [] as Array<{ counts: Record<string, number>; trendData: unknown[]; paramKey: string }>,
  sparks: [] as Array<{ data: unknown[]; width: number; height: number }>,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/design-review",
}));

vi.mock("@/app/components/uptime", () => ({
  UptimeChart: (p: { componentName: string; days: DayData[]; currentUptimePercent: number }) => {
    h.uptime.push(p);
    return <div data-testid="uptime-chart">{p.componentName}</div>;
  },
}));
vi.mock("@/components/dashboard/sentiment-chip-filter", () => ({
  SentimentChipFilter: (p: { counts: Record<string, number>; trendData: unknown[]; paramKey: string }) => {
    h.chips.push(p);
    return <div data-testid="chip-filter">{p.paramKey}</div>;
  },
}));
vi.mock("@/components/dashboard/sentiment-sparkline", () => ({
  SentimentSparkline: (p: { data: unknown[]; width: number; height: number }) => {
    h.sparks.push(p);
    return <div data-testid="sparkline" />;
  },
}));
vi.mock("@/components/design/DesignChecklist", () => ({
  default: () => <div data-testid="design-checklist" />,
}));
vi.mock("@/components/design/status-matrix", () => ({
  StatusMatrix: () => <div data-testid="status-matrix" />,
  statusMatrixData: {},
}));
vi.mock("@/components/design/a11y-trend-chart", () => ({
  A11yTrendChart: () => <div data-testid="a11y-trend" />,
  a11yTrendSampleData: [],
}));
vi.mock("@/components/design/a11y-audit-dashboard", () => ({
  A11yAuditDashboard: () => <div data-testid="a11y-audit" />,
}));

import DesignReviewPage from "./page";

beforeEach(() => {
  cleanup();
  h.uptime.length = 0;
  h.chips.length = 0;
  h.sparks.length = 0;
});

describe("DesignReviewPage: structure", () => {
  it("renders the page heading, header brand and back link", () => {
    render(<DesignReviewPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Design Review Guide" })).toBeInTheDocument();
    expect(screen.getByText("Design System")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to app/i })).toHaveAttribute("href", "/");
  });

  it("renders every section heading", () => {
    render(<DesignReviewPage />);
    for (const name of [
      "Live Checklist",
      "Sentiment Chip Filter",
      "Operationalizing Quality",
      "System Status Matrix",
      "Status Page — 90-Day Uptime",
      "A11y Audit Trend",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
  });

  it("mounts each embedded design component once", () => {
    render(<DesignReviewPage />);
    for (const id of ["design-checklist", "status-matrix", "a11y-audit", "a11y-trend"]) {
      expect(screen.getAllByTestId(id)).toHaveLength(1);
    }
  });

  it("links to the focus-trap and supplier-onboarding sub-pages", () => {
    render(<DesignReviewPage />);
    const focus = screen.getByRole("link", { name: /focus trap tester/i });
    const wizard = screen.getByRole("link", { name: /supplier onboarding wizard/i });
    expect(focus).toHaveAttribute("href", "/design-review/focus-trap");
    expect(wizard).toHaveAttribute("href", "/design-review/supplier-onboarding");
    expect(within(focus).getByText("Test →")).toBeInTheDocument();
    expect(within(wizard).getByText("View →")).toBeInTheDocument();
  });
});

describe("DesignReviewPage: uptime data", () => {
  it("renders three uptime charts with the expected names and current uptime", () => {
    render(<DesignReviewPage />);
    expect(screen.getAllByTestId("uptime-chart")).toHaveLength(3);
    expect(h.uptime.map((u) => u.componentName)).toEqual([
      "API Service",
      "Payments Service",
      "API Service",
    ]);
    expect(h.uptime.map((u) => u.currentUptimePercent)).toEqual([98.5, 98.0, 98.5]);
  });

  it("generates exactly 90 consecutive, valid, ascending dates", () => {
    render(<DesignReviewPage />);
    const days = h.uptime[0].days;
    expect(days).toHaveLength(90);
    expect(days[0].date).toBe("2026-05-01");
    expect(days[89].date).toBe("2026-07-29");
    for (let i = 1; i < days.length; i++) {
      const diff = (Date.parse(days[i].date) - Date.parse(days[i - 1].date)) / 86_400_000;
      expect(diff).toBe(1);
    }
  });

  it("uses the documented uptime tiers at their boundaries", () => {
    render(<DesignReviewPage />);
    const d = h.uptime[0].days;
    const expected: Array<[number, number]> = [
      [0, 100], [29, 100],
      [30, 99.5], [59, 99.5],
      [60, 97.2], [74, 97.2],
      [75, 92.1], [84, 92.1],
      [85, 99.99], [89, 99.99],
    ];
    for (const [i, pct] of expected) expect(d[i].uptimePercent).toBe(pct);
    for (const day of d) {
      expect(day.uptimePercent).toBeGreaterThanOrEqual(0);
      expect(day.uptimePercent).toBeLessThanOrEqual(100);
    }
  });

  it("attaches incidents only to days 10, 35, 60 and 75", () => {
    render(<DesignReviewPage />);
    const d = h.uptime[0].days;
    const withIncidents = d.map((x, i) => [i, x.incidents.length] as const).filter(([, n]) => n > 0);
    expect(withIncidents).toEqual([[10, 1], [35, 1], [60, 2], [75, 1]]);
    expect(d[60].incidents.map((i) => i.id)).toEqual(["inc-003", "inc-004"]);
    expect(d[60].incidents.map((i) => i.severity)).toEqual(["critical", "minor"]);
    for (const day of d) {
      for (const inc of day.incidents) {
        expect(Date.parse(inc.resolvedAt!)).toBeGreaterThan(Date.parse(inc.startedAt));
      }
    }
  });

  it("derives payments uptime from the API series (100 → 99.9, otherwise −0.5)", () => {
    render(<DesignReviewPage />);
    const api = h.uptime[0].days;
    const pay = h.uptime[1].days;
    expect(pay).toHaveLength(api.length);
    api.forEach((a, i) => {
      const expected = a.uptimePercent === 100 ? 99.9 : a.uptimePercent - 0.5;
      expect(pay[i].uptimePercent).toBeCloseTo(expected, 10);
      expect(pay[i].date).toBe(a.date);
      expect(pay[i].incidents).toEqual(a.incidents);
    });
  });

  it("does not mutate the API series when deriving payments, and the light chart reuses it", () => {
    render(<DesignReviewPage />);
    expect(h.uptime[0].days[0].uptimePercent).toBe(100);
    expect(h.uptime[1].days[0].uptimePercent).toBe(99.9);
    expect(h.uptime[2].days).toBe(h.uptime[0].days);
  });

  it("is deterministic across renders", () => {
    render(<DesignReviewPage />);
    const first = JSON.stringify(h.uptime[0].days);
    cleanup();
    h.uptime.length = 0;
    render(<DesignReviewPage />);
    expect(JSON.stringify(h.uptime[0].days)).toBe(first);
  });
});

describe("DesignReviewPage: sentiment showcase", () => {
  it("renders three chip filters with unique param keys", () => {
    render(<DesignReviewPage />);
    const keys = h.chips.map((c) => c.paramKey);
    expect(keys).toEqual(["dr-sentiment", "dr-sentiment-light", "dr-sentiment-empty"]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("renders the low-signal state with zero counts and no trend", () => {
    render(<DesignReviewPage />);
    const empty = h.chips.find((c) => c.paramKey === "dr-sentiment-empty")!;
    expect(empty.counts).toEqual({ positive: 0, mixed: 0, critical: 0 });
    expect(empty.trendData).toEqual([]);
  });

  it("gives the populated filters non-empty data", () => {
    render(<DesignReviewPage />);
    const populated = h.chips.filter((c) => c.paramKey !== "dr-sentiment-empty");
    for (const c of populated) {
      expect(c.trendData.length).toBeGreaterThan(0);
      expect(Object.values(c.counts).some((n) => n > 0)).toBe(true);
    }
  });

  it("renders the light surface inside a data-theme=light container", () => {
    const { container } = render(<DesignReviewPage />);
    const light = container.querySelectorAll('[data-theme="light"]');
    expect(light).toHaveLength(2);
    expect(within(light[0] as HTMLElement).getByText("Light surface")).toBeInTheDocument();
  });

  it("renders sparklines for normal, single-point and empty data", () => {
    render(<DesignReviewPage />);
    expect(h.sparks).toHaveLength(3);
    expect(h.sparks[0].data.length).toBeGreaterThan(1);
    expect(h.sparks[1].data).toHaveLength(1);
    expect(h.sparks[2].data).toEqual([]);
    expect(h.sparks.map((s) => [s.width, s.height])).toEqual([[120, 36], [88, 28], [88, 28]]);
  });
});
