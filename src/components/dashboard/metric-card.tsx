import { StatusChip } from "./status-chip";
import { Card, CardHeader, CardBody } from "./card";
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
    <Card
      aria-labelledby={labelId}
      aria-describedby={`${valueId} ${detailId} ${statusId}`}
    >
      <CardHeader>
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
      </CardHeader>
      <CardBody className="mt-4">
        <p id={detailId} className="text-sm leading-6 text-slate-400">
          {metric.detail}
        </p>
      </CardBody>
    </Card>
  );
}

