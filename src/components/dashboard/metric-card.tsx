import { StatusChip } from "./status-chip";
import type { Metric } from "./types";

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-300">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {metric.value}
          </p>
        </div>
        <StatusChip tone={metric.tone}>{metric.tone}</StatusChip>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{metric.detail}</p>
    </article>
  );
}
