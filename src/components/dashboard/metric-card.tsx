import { StatusChip } from "./status-chip";
import { Card, CardHeader, CardBody } from "./card";
import { SampleBadge } from "./sample-badge";
import type { Metric, Tone } from "./types";
import { EarningsChart } from "./earnings-chart";

const toneLabels: Record<Tone, string> = {
  neutral: "Stable",
  positive: "On track",
  warning: "Needs review",
  critical: "Needs attention",
  muted: "No signal",
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
    <Card
      aria-labelledby={labelId}
      aria-describedby={`${valueId} ${detailId} ${statusId}`}
    >
      <CardHeader>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p id={labelId} className="text-sm text-slate-300">
              {metric.label}
            </p>
            {metric.isSample ? <SampleBadge /> : null}
          </div>
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
      </CardHeader>
      <CardBody className="mt-4 flex flex-col gap-4">
        <p id={detailId} className="text-sm leading-6 text-slate-400">
          {metric.detail}
        </p>
        {metric.breakdown && metric.breakdown.length > 0 && (
          <div className="pt-2 border-t border-slate-800/50">
            <EarningsChart segments={metric.breakdown} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

