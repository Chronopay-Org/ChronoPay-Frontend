import { StatusChip } from "./status-chip";
import type { Metric, Tone } from "./types";

const toneLabels: Record<Tone, string> = {
  neutral: "Stable",
  positive: "On track",
  warning: "Needs review",
  critical: "Needs attention",
};

function toElementId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function MetricCard({ metric }: { metric: Metric }) {
  const metricId = `metric-${toElementId(metric.label)}`;
  const labelId = `${metricId}-label`;
  const valueId = `${metricId}-value`;
  const detailId = `${metricId}-detail`;
  const statusId = `${metricId}-status`;
  const statusLabel = toneLabels[metric.tone];

  return (
    <article
      className="rounded-[24px] border border-white/10 bg-white/5 p-5"
      aria-labelledby={labelId}
      aria-describedby={`${valueId} ${detailId} ${statusId}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id={labelId} className="text-sm text-slate-300">
            {metric.label}
          </p>
          <p
            id={valueId}
            className="mt-3 text-3xl font-semibold tracking-tight text-white"
            aria-live="polite"
            aria-atomic="true"
          >
            {metric.value}
          </p>
        </div>
        <StatusChip
          id={statusId}
          tone={metric.tone}
          aria-label={`${metric.label} status: ${statusLabel}`}
        >
          {statusLabel}
        </StatusChip>
      </div>
      <p id={detailId} className="mt-4 text-sm leading-6 text-slate-400">
        {metric.detail}
      </p>
    </article>
  );
}
