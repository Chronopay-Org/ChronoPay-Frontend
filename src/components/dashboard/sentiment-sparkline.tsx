"use client";

/**
 * SentimentSparkline
 *
 * Renders a compact multi-line sparkline of sentiment counts over time.
 * Uses plain SVG — no external chart library required.
 *
 * Accessibility
 * ─────────────
 * - The SVG has role="img" and a descriptive aria-label so screen readers
 *   announce it as an image rather than exposing raw path data.
 * - A <title> element provides a machine-readable label fallback.
 * - Colour is never the sole differentiator; each line has a distinct stroke
 *   dash pattern as well (solid / dashed / dotted).
 *
 * Theming
 * ───────
 * Stroke colours reference the design-system palette (emerald / amber / rose)
 * and work on both dark and light backgrounds. The SVG has no fill background
 * so it adapts to whatever surface it sits on.
 */

import { useMemo } from "react";
import type { SentimentDataPoint } from "./types";

// ─── Public props ─────────────────────────────────────────────────────────────

export interface SentimentSparklineProps {
  /** Series data — one point per period, ordered oldest → newest. */
  data: SentimentDataPoint[];
  /** Rendered width in px (default 96). */
  width?: number;
  /** Rendered height in px (default 32). */
  height?: number;
  /**
   * Which series lines to show.
   * Defaults to all three.
   */
  series?: Array<"positive" | "mixed" | "critical">;
  className?: string;
  /** Human-readable summary injected into aria-label / <title>. */
  label?: string;
}

// ─── Series visual config ─────────────────────────────────────────────────────

interface SeriesConfig {
  key: "positive" | "mixed" | "critical";
  stroke: string;
  strokeDasharray?: string;
  ariaName: string;
}

const SERIES_CONFIG: SeriesConfig[] = [
  {
    key: "positive",
    stroke: "#34d399", // emerald-400
    strokeDasharray: undefined, // solid
    ariaName: "positive",
  },
  {
    key: "mixed",
    stroke: "#fbbf24", // amber-400
    strokeDasharray: "4 2", // dashed
    ariaName: "mixed",
  },
  {
    key: "critical",
    stroke: "#f87171", // rose-400
    strokeDasharray: "1.5 2", // dotted
    ariaName: "critical",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map a value from [domainMin, domainMax] to [rangeMin, rangeMax]. */
function scaleLinear(
  value: number,
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
): number {
  if (domainMax === domainMin) return (rangeMin + rangeMax) / 2;
  return (
    rangeMin +
    ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin)
  );
}

/** Build a polyline `points` string from (x, y) pairs. */
function buildPoints(pairs: Array<[number, number]>): string {
  return pairs.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SentimentSparkline({
  data,
  width = 96,
  height = 32,
  series = ["positive", "mixed", "critical"],
  className = "",
  label,
}: SentimentSparklineProps) {
  const PAD_X = 2; // horizontal padding so strokes aren't clipped
  const PAD_Y = 3; // vertical padding

  const innerW = width - PAD_X * 2;
  const innerH = height - PAD_Y * 2;

  // Compute domain: global min/max across ALL visible series so lines share
  // the same y-axis scale (makes relative movement meaningful).
  const allValues = useMemo(() => {
    if (data.length === 0) return [0, 1];
    const vals: number[] = [];
    for (const pt of data) {
      for (const s of series) {
        vals.push(pt[s]);
      }
    }
    return vals;
  }, [data, series]);

  const domainMin = Math.min(...allValues);
  const domainMax = Math.max(...allValues);

  // Pre-compute (x, y) points for each series.
  const seriesPoints = useMemo(() => {
    return series.map((key) => {
      if (data.length === 0) return { key, points: "" };
      const pairs: Array<[number, number]> = data.map((pt, i) => {
        const x =
          data.length === 1
            ? PAD_X + innerW / 2
            : PAD_X + scaleLinear(i, 0, data.length - 1, 0, innerW);
        const y =
          PAD_Y +
          scaleLinear(pt[key], domainMin, domainMax, innerH, 0); // invert y
        return [x, y];
      });
      return { key, points: buildPoints(pairs) };
    });
  }, [data, series, domainMin, domainMax, innerW, innerH]);

  const activeConfigs = SERIES_CONFIG.filter((c) => series.includes(c.key));

  // Build aria-label from most-recent data point
  const ariaLabel = useMemo(() => {
    if (label) return label;
    if (data.length === 0) return "Sentiment trend sparkline — no data";
    const last = data[data.length - 1];
    const parts = activeConfigs
      .map((c) => `${last[c.key]} ${c.ariaName}`)
      .join(", ");
    return `Sentiment trend over ${data.length} periods. Most recent: ${parts}.`;
  }, [label, data, activeConfigs]);

  if (data.length === 0) {
    return (
      <svg
        role="img"
        aria-label="Sentiment trend sparkline — no data available"
        width={width}
        height={height}
        className={className}
        data-testid="sentiment-sparkline-empty"
      >
        <title>Sentiment trend — no data available</title>
        <line
          x1={PAD_X}
          y1={height / 2}
          x2={width - PAD_X}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      data-testid="sentiment-sparkline"
      overflow="visible"
    >
      <title>{ariaLabel}</title>

      {seriesPoints.map(({ key, points }) => {
        const cfg = activeConfigs.find((c) => c.key === key)!;
        return (
          <polyline
            key={key}
            data-testid={`sparkline-line-${key}`}
            points={points}
            fill="none"
            stroke={cfg.stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={cfg.strokeDasharray}
          />
        );
      })}

      {/* Terminal dot on last point of each series */}
      {seriesPoints.map(({ key, points }) => {
        const cfg = activeConfigs.find((c) => c.key === key)!;
        const lastPair = points.split(" ").pop();
        if (!lastPair) return null;
        const [cx, cy] = lastPair.split(",").map(Number);
        return (
          <circle
            key={`${key}-dot`}
            data-testid={`sparkline-dot-${key}`}
            cx={cx}
            cy={cy}
            r={2}
            fill={cfg.stroke}
          />
        );
      })}
    </svg>
  );
}
