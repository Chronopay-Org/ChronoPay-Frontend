"use client";

import { useId } from "react";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { TrustMetric, Tone } from "./types";

export interface SupplierTrustStatsProps {
  /** Response time metric */
  responseTime: TrustMetric;
  /** Acceptance rate metric */
  acceptanceRate: TrustMetric;
}

// ─── Sparkline ─────────────────────────────────────────────────────────────────

/**
 * Tiny inline SVG sparkline showing a trend over time.
 * Uses theme-aware stroke colors and reduced-motion support.
 */
function Sparkline({ data, tone }: { data: number[]; tone: Tone }) {
  const width = 64;
  const height = 24;
  const padding = 2;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const strokeColor =
    tone === "positive"
      ? "stroke-emerald-400"
      : tone === "warning"
        ? "stroke-amber-400"
        : "stroke-cyan-400";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-6 w-16 ${strokeColor} fill-none`}
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
      />
    </svg>
  );
}

// ─── Trend Icon ────────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: TrustMetric["trend"] }) {
  if (trend === "stable") {
    return (
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="h-3 w-3 text-slate-400">
        <path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  const isUp = trend === "up";
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`h-3 w-3 ${isUp ? "text-emerald-400" : "text-amber-400"}`}
    >
      <path
        d={isUp ? "M2 9l3-4 3 2 3-3" : "M2 3l3 4 3-2 3 3"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Trust Metric Tile ─────────────────────────────────────────────────────────

function TrustMetricTile({ metric }: { metric: TrustMetric }) {
  const titleId = useId();
  const descId = useId();

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/4 p-4"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p id={titleId} className="text-xs font-medium text-slate-400">
            {metric.label}
          </p>
          <Tooltip content={metric.tooltip} />
        </div>
        <TrendIcon trend={metric.trend} />
      </div>

      {/* Value */}
      <p id={descId} className="text-2xl font-semibold tracking-tight text-white">
        {metric.value}
        <span className="ml-0.5 text-sm font-normal text-slate-500">{metric.unit}</span>
      </p>

      {/* Sparkline + microcopy */}
      <div className="flex items-center justify-between gap-2">
        <Sparkline data={metric.history.values} tone={metric.tone} />
        <span className="text-[10px] text-slate-500">Last 30 days</span>
      </div>
    </div>
  );
}

// ─── No Data State ─────────────────────────────────────────────────────────────

function NoDataTile({ label, tooltip }: { label: string; tooltip: string }) {
  const titleId = useId();

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-dashed border-white/8 bg-white/3 p-4"
      aria-labelledby={titleId}
    >
      <div className="flex items-center gap-1.5">
        <p id={titleId} className="text-xs font-medium text-slate-500">
          {label}
        </p>
        <Tooltip content={tooltip} />
      </div>

      {/* Dashed sparkline placeholder */}
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 64 24"
          className="h-6 w-16 fill-none stroke-white/10"
          aria-hidden="true"
        >
          <line x1="2" y1="20" x2="62" y2="20" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
        <span className="text-[10px] text-slate-500">Insufficient data</span>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        More bookings are needed to show reliable stats. Check back after your next confirmed session.
      </p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

/**
 * SupplierTrustStats
 *
 * A tile group displaying median response time and booking acceptance rate,
 * each with a sparkline history and "based on last 30 days" microcopy.
 *
 * WCAG 2.1 AA: uses aria-labelledby, aria-describedby, Tooltip for explanations.
 *
 * @example
 * <SupplierTrustStats responseTime={responseTimeMetric} acceptanceRate={acceptanceRateMetric} />
 */
export function SupplierTrustStats({
  responseTime,
  acceptanceRate,
}: SupplierTrustStatsProps) {
  const groupId = useId();

  return (
    <div
      role="region"
      aria-labelledby={`${groupId}-title`}
      className="grid gap-4 sm:grid-cols-2"
    >
      <p id={`${groupId}-title`} className="sr-only">
        Supplier trust metrics based on the last 30 days
      </p>

      {responseTime.history.values.length >= 2 ? (
        <TrustMetricTile metric={responseTime} />
      ) : (
        <NoDataTile label={responseTime.label} tooltip={responseTime.tooltip} />
      )}

      {acceptanceRate.history.values.length >= 2 ? (
        <TrustMetricTile metric={acceptanceRate} />
      ) : (
        <NoDataTile label={acceptanceRate.label} tooltip={acceptanceRate.tooltip} />
      )}
    </div>
  );
}
