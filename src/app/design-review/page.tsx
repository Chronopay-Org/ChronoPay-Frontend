import DesignChecklist from "@/components/design/DesignChecklist";
import { StatusMatrix, statusMatrixData } from "@/components/design/status-matrix";
import { A11yTrendChart, a11yTrendSampleData } from "@/components/design/a11y-trend-chart";
import { UptimeChart, DayData, Incident } from "@/components/uptime";
import Link from "next/link";
import { Suspense } from "react";
import { SentimentChipFilter } from "@/components/dashboard/sentiment-chip-filter";
import { SentimentSparkline } from "@/components/dashboard/sentiment-sparkline";
import {
  reviewSentimentCounts,
  reviewSentimentTrend,
} from "@/components/dashboard/dashboard-data";

// Helper function to generate 90 days of mock uptime data
function generate90DaysMockData(): DayData[] {
  const days: DayData[] = [];
  const baseDate = new Date("2026-05-01");

  const mockIncidents: Record<number, Incident[]> = {
    10: [
      {
        id: "inc-001",
        title: "Database Connection Pool Exhaustion",
        summary:
          "Brief spike in connection pool usage caused 5 minutes of elevated latency on API responses during peak traffic.",
        severity: "major",
        startedAt: "2026-05-11T14:30:00Z",
        resolvedAt: "2026-05-11T14:35:00Z",
      },
    ],
    35: [
      {
        id: "inc-002",
        title: "CDN Cache Invalidation Error",
        summary:
          "Automatic cache invalidation script failed, serving stale assets for 2 hours. User hard-refresh resolved it.",
        severity: "minor",
        startedAt: "2026-06-05T08:00:00Z",
        resolvedAt: "2026-06-05T10:00:00Z",
      },
    ],
    60: [
      {
        id: "inc-003",
        title: "Payment Gateway Rate Limit",
        summary:
          "Third-party payment provider reached temporary rate limit, affecting checkout conversions for 15 minutes.",
        severity: "critical",
        startedAt: "2026-06-30T16:45:00Z",
        resolvedAt: "2026-06-30T17:00:00Z",
      },
      {
        id: "inc-004",
        title: "DNS Propagation Delay",
        summary: "Regional DNS resolver experienced temporary propagation delay affecting resolving in one zone.",
        severity: "minor",
        startedAt: "2026-06-30T17:05:00Z",
        resolvedAt: "2026-06-30T17:20:00Z",
      },
    ],
    75: [
      {
        id: "inc-005",
        title: "Load Balancer Configuration Drift",
        summary:
          "Manual configuration change on load balancer removed one backend instance, causing occasional 503 errors.",
        severity: "critical",
        startedAt: "2026-07-15T11:00:00Z",
        resolvedAt: "2026-07-15T11:30:00Z",
      },
    ],
  };

  for (let i = 0; i < 90; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    let uptimePercent = 100;
    if (i < 30) {
      uptimePercent = 100;
    } else if (i < 60) {
      uptimePercent = 99.5;
    } else if (i < 75) {
      uptimePercent = 97.2;
    } else if (i < 85) {
      uptimePercent = 92.1;
    } else {
      uptimePercent = 99.99;
    }

    days.push({
      date: dateStr,
      uptimePercent,
      incidents: mockIncidents[i] || [],
    });
  }

  return days;
}

export default function DesignReviewPage() {
  const apiUptimeData = generate90DaysMockData();
  const paymentsUptimeData = generate90DaysMockData().map((day) => ({
    ...day,
    uptimePercent: day.uptimePercent === 100 ? 99.9 : day.uptimePercent - 0.5,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-bold text-slate-900">
              C
            </div>
            <span className="font-semibold tracking-tight">Design System</span>
          </div>
          <Link
            href="/"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Design Review Guide
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Every feature in ChronoPay must meet our high bar for accessibility,
            responsiveness, and operational reliability. Use this guide to audit
            your work before submitting a PR.
          </p>
        </section>

        <section className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Live Checklist
              </h2>
              <DesignChecklist />
            </div>

            {/* ── Sentiment Chip Filter showcase ── */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Sentiment Chip Filter
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl">
                Chip row with counts + sparkline trend. Active bucket syncs to
                the <code className="text-cyan-300 font-mono text-xs">?sentiment=</code> search
                param. WCAG 2.1 AA: <code className="text-cyan-300 font-mono text-xs">role=&quot;group&quot;</code>,
                {" "}<code className="text-cyan-300 font-mono text-xs">aria-pressed</code>, polite live
                region on change, arrow-key navigation, focus-ring-cyan.
              </p>

              {/* Dark surface swatch */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Dark surface
                </p>
                <Suspense fallback={null}>
                  <SentimentChipFilter
                    counts={reviewSentimentCounts}
                    trendData={reviewSentimentTrend}
                    paramKey="dr-sentiment"
                  />
                </Suspense>
              </div>

              {/* Light surface swatch */}
              <div
                data-theme="light"
                className="rounded-2xl border border-black/10 bg-white/90 p-5 space-y-4"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Light surface
                </p>
                <Suspense fallback={null}>
                  <SentimentChipFilter
                    counts={reviewSentimentCounts}
                    trendData={reviewSentimentTrend}
                    paramKey="dr-sentiment-light"
                  />
                </Suspense>
              </div>

              {/* Empty / low-signal state */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Low-signal state (all zeros, no trend)
                </p>
                <Suspense fallback={null}>
                  <SentimentChipFilter
                    counts={{ positive: 0, mixed: 0, critical: 0 }}
                    trendData={[]}
                    paramKey="dr-sentiment-empty"
                  />
                </Suspense>
              </div>

              {/* Standalone sparkline showcase */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Sparkline — standalone
                </p>
                <div className="flex flex-wrap gap-8 items-end">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">8-week trend</p>
                    <SentimentSparkline
                      data={reviewSentimentTrend}
                      width={120}
                      height={36}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Single data point</p>
                    <SentimentSparkline
                      data={[{ period: "2026-07-20", positive: 48, mixed: 17, critical: 9 }]}
                      width={88}
                      height={28}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">No data (empty state)</p>
                    <SentimentSparkline data={[]} width={88} height={28} />
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/design-review/focus-trap"
              className="block"
            >
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 hover:bg-cyan-500/10 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                    <span className="text-lg font-bold">T</span>
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Focus Trap Tester</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automated tab-cycle verification for every modal and overlay
                    </p>
                  </div>
                  <span className="ml-auto text-xs font-medium text-cyan-400">
                    Test →
                  </span>
                </div>
              </div>
            </Link>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Operationalizing Quality
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                <div className="p-5 rounded-xl border border-white/5 bg-white/5 space-y-2">
                  <h3 className="font-medium text-slate-200">PR Template</h3>
                  <p>
                    All contributors should use the standard PR template which
                    includes a subset of this checklist for rapid verification.
                  </p>
                </div>
                <div className="p-5 rounded-xl border border-white/5 bg-white/5 space-y-2">
                  <h3 className="font-medium text-slate-200">Accessibility First</h3>
                  <p>
                    We aim for WCAG 2.1 AA. If you&apos;re unsure about ARIA roles or
                    keyboard patterns, reference the README or ask for a review.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                System Status Matrix
              </h2>
              <StatusMatrix config={statusMatrixData} />
            </div>

            {/* ── Historical Uptime Bar Chart ── */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Status Page — 90-Day Uptime
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl">
                Historical uptime bar chart showing 90 days of component health.
                Each cell is a day, color-coded by uptime percentage. Hover or
                focus cells to see incidents. Fully responsive, keyboard navigable,
                RTL compatible, and respects <code className="text-cyan-300 font-mono text-xs">prefers-reduced-motion</code>.
              </p>

              {/* Dark surface swatch */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Dark surface
                </p>
                <UptimeChart
                  componentName="API Service"
                  days={apiUptimeData}
                  currentUptimePercent={98.5}
                />
                <div className="border-t border-slate-700 pt-6" />
                <UptimeChart
                  componentName="Payments Service"
                  days={paymentsUptimeData}
                  currentUptimePercent={98.0}
                />
              </div>

              {/* Light surface swatch */}
              <div
                data-theme="light"
                className="rounded-2xl border border-black/10 bg-white/90 p-5 space-y-6"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Light surface
                </p>
                <UptimeChart
                  componentName="API Service"
                  days={apiUptimeData}
                  currentUptimePercent={98.5}
                />
              </div>

              {/* Accessibility & Implementation notes */}
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Keyboard navigation:</strong> Arrow
                  keys move focus between cells. Each cell is focusable with{" "}
                  <code className="text-cyan-300 font-mono">tabIndex={JSON.stringify(0)}</code>. Escape dismisses tooltip.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Incident indicators:</strong> Red
                  border appears on cells with incidents. Tooltip shows full details:
                  title, summary (truncated to 100 chars), and severity level.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Responsive design:</strong> Cells
                  shrink to minimum 3px width on mobile, full size on desktop. Chart
                  scrolls horizontally on small screens. RTL support reverses cell order.
                </p>
              </div>
            </div>

            {/* ── A11y Audit Historical Trend Chart ── */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                A11y Audit Trend
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl">
                Stacked-area chart showing the historical trend of open
                accessibility issues by severity. Use this to track progress
                and catch regressions early.
              </p>

              {/* Dark surface swatch */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Dark surface
                </p>
                <A11yTrendChart data={a11yTrendSampleData} />
              </div>

              {/* Reduced-motion notice */}
              <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Reduced motion:</strong> If your system
                  prefers reduced motion, chart hover transitions are disabled
                  automatically via the{" "}
                  <code className="text-cyan-300 font-mono">prefers-reduced-motion</code>{" "}
                  media query. The chart remains fully interactive.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
