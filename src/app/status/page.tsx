import Link from "next/link";
import { StatusMatrix, statusMatrixData } from "@/components/design/status-matrix";
import { UptimeChart, type DayData, type Incident } from "@/app/components/uptime";

function generateSeries(
  startDate: string,
  pattern: number[],
  incidentsByIndex: Record<number, Incident[]>,
): DayData[] {
  const start = new Date(`${startDate}T00:00:00Z`);

  return Array.from({ length: 90 }, (_, index) => {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + index);

    const uptimePercent = pattern[index % pattern.length] ?? 100;

    return {
      date: current.toISOString().slice(0, 10),
      uptimePercent,
      incidents: incidentsByIndex[index] ?? [],
    };
  });
}

const marketplaceIncidents: Record<number, Incident[]> = {
  18: [
    {
      id: "mp-18",
      title: "Marketplace API timeout",
      summary: "Brief elevated latency during a peak listing refresh cycle.",
      severity: "major",
      startedAt: "2026-06-08T14:18:00Z",
      resolvedAt: "2026-06-08T14:29:00Z",
    },
  ],
  54: [
    {
      id: "mp-54",
      title: "Asset catalog sync lag",
      summary: "A stale cache caused delayed asset availability updates for 12 minutes.",
      severity: "minor",
      startedAt: "2026-07-02T09:05:00Z",
      resolvedAt: "2026-07-02T09:17:00Z",
    },
  ],
};

const escrowIncidents: Record<number, Incident[]> = {
  36: [
    {
      id: "esc-36",
      title: "Escrow approval delay",
      summary: "A batch processing backlog caused temporary escrow approvals to queue.",
      severity: "minor",
      startedAt: "2026-06-30T11:40:00Z",
      resolvedAt: "2026-06-30T12:10:00Z",
    },
  ],
};

const stellarIncidents: Record<number, Incident[]> = {
  11: [
    {
      id: "stellar-11",
      title: "Stellar Horizon timeout",
      summary: "Short-lived Horizon timeout caused a retry storm on one of the payment endpoints.",
      severity: "major",
      startedAt: "2026-05-11T16:10:00Z",
      resolvedAt: "2026-05-11T16:26:00Z",
    },
  ],
  63: [
    {
      id: "stellar-63",
      title: "Ledger submission backlog",
      summary: "An upstream heartbeat delay caused brief submission retries in region APAC.",
      severity: "minor",
      startedAt: "2026-07-07T23:42:00Z",
      resolvedAt: "2026-07-08T00:06:00Z",
    },
  ],
};

const marketplaceSeries = generateSeries("2026-05-01", [100, 100, 99.9, 99.8, 99.7, 99.5, 99.2], marketplaceIncidents);
const escrowSeries = generateSeries("2026-05-01", [100, 100, 99.8, 99.6, 99.5, 99.2, 98.9], escrowIncidents);
const stellarSeries = generateSeries("2026-05-01", [100, 99.9, 99.8, 99.7, 99.4, 99.3, 99.1], stellarIncidents);

const incidentFeed = [
  {
    id: "incident-1",
    title: "Marketplace API timeout",
    timestamp: "2026-06-08T14:18:00Z",
    summary: "A brief spike in latency affected listing refreshes during peak traffic.",
    status: "Resolved",
  },
  {
    id: "incident-2",
    title: "Escrow approval delay",
    timestamp: "2026-06-30T11:40:00Z",
    summary: "Approval queuing for a batch of escrow requests was resolved after auto-scaling.",
    status: "Resolved",
  },
  {
    id: "incident-3",
    title: "Stellar Horizon timeout",
    timestamp: "2026-05-11T16:10:00Z",
    summary: "Temporary timeout on Horizon node requests was mitigated by retries and failover.",
    status: "Resolved",
  },
];

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-white/10 bg-slate-900/75 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 font-black text-slate-950">
              C
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">ChronoPay</p>
              <p className="text-sm text-slate-400">System status</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-slate-300 transition hover:text-white">
            ← Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <section className="space-y-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">Public status</p>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                ChronoPay system health
              </h1>
              <p className="max-w-2xl text-base text-slate-300 md:text-lg">
                Marketplace services, escrow workflows, and the Stellar network are monitored continuously.
                We publish uptime and recent incidents to keep operations transparent and easy to review.
              </p>
            </div>

            <div
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Operational
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Marketplace</p>
              <p className="mt-3 text-3xl font-bold text-white">99.6%</p>
              <p className="mt-2 text-sm text-slate-300">Last 90 days</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Escrow</p>
              <p className="mt-3 text-3xl font-bold text-white">99.3%</p>
              <p className="mt-2 text-sm text-slate-300">Last 90 days</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Stellar network</p>
              <p className="mt-3 text-3xl font-bold text-white">99.5%</p>
              <p className="mt-2 text-sm text-slate-300">Last 90 days</p>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-6" aria-labelledby="health-matrix-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="health-matrix-heading" className="text-2xl font-bold text-white">
              Platform health matrix
            </h2>
            <p className="text-sm text-slate-400">Last checked 2 minutes ago</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:p-6">
            <StatusMatrix config={statusMatrixData} />
          </div>
        </section>

        <section className="mt-12 space-y-6" aria-labelledby="uptime-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="uptime-heading" className="text-2xl font-bold text-white">
              90-day uptime
            </h2>
            <p className="text-sm text-slate-400">Hover or focus any bar for details</p>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:p-6">
              <UptimeChart componentName="Marketplace API" days={marketplaceSeries} currentUptimePercent={99.6} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:p-6">
              <UptimeChart componentName="Escrow service" days={escrowSeries} currentUptimePercent={99.3} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:p-6">
              <UptimeChart componentName="Stellar network" days={stellarSeries} currentUptimePercent={99.5} />
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-5" aria-labelledby="incidents-heading">
          <h2 id="incidents-heading" className="text-2xl font-bold text-white">
            Incidents
          </h2>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70">
            <ul className="divide-y divide-white/10">
              {incidentFeed.map((incident) => (
                <li key={incident.id} className="p-5 md:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{incident.summary}</p>
                    </div>
                    <time dateTime={incident.timestamp} className="text-sm text-slate-400">
                      {formatTimestamp(incident.timestamp)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
