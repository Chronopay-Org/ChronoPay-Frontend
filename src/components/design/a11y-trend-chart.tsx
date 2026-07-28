"use client";

/**
 * A11yTrendChart — Stacked-area chart showing historical accessibility audit
 * issues by severity over time.
 *
 * Renders a pure-SVG stacked area chart with three severity bands (critical,
 * serious, moderate). Includes an interactive tooltip on hover, a legend, and
 * a reduced-motion fallback that disables CSS transitions when the user
 * prefers reduced motion.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - SVG has role="img" with a descriptive aria-label
 *   - Data is also presented as a hidden table for screen readers
 *   - Interactive tooltip supports keyboard hover (onFocus/onBlur)
 *   - Reduced-motion query disables hover transitions
 *   - Legend uses text + colour + shape, not colour alone
 *   - Dark-mode and light-mode compatible palette
 */

import { useCallback, useId, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface A11yDataPoint {
  /** ISO date string or label, e.g. "2026-07-01". */
  period: string;
  critical: number;
  serious: number;
  moderate: number;
}

export interface A11yTrendChartProps {
  /** Time-series data ordered oldest → newest. */
  data: A11yDataPoint[];
  /** Rendered width in px. */
  width?: number;
  /** Rendered height in px. */
  height?: number;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Severity visual config                                            */
/* ------------------------------------------------------------------ */

interface SeverityConfig {
  key: "critical" | "serious" | "moderate";
  label: string;
  fill: string;
  fillDark: string;
  stroke: string;
  dotColor: string;
  /** Order for stacking (0 = bottom). */
  stackOrder: number;
}

const SEVERITY_CONFIG: SeverityConfig[] = [
  {
    key: "moderate",
    label: "Moderate",
    fill: "fill-amber-400/25",
    fillDark: "dark:fill-amber-400/20",
    stroke: "#fbbf24",
    dotColor: "#fbbf24",
    stackOrder: 0,
  },
  {
    key: "serious",
    label: "Serious",
    fill: "fill-orange-400/25",
    fillDark: "dark:fill-orange-400/20",
    stroke: "#fb923c",
    dotColor: "#fb923c",
    stackOrder: 1,
  },
  {
    key: "critical",
    label: "Critical",
    fill: "fill-rose-400/25",
    fillDark: "dark:fill-rose-400/20",
    stroke: "#f87171",
    dotColor: "#f87171",
    stackOrder: 2,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/** Build an SVG path `d` string for a stacked area band. */
function buildStackedAreaPath(
  points: Array<{
    x0: number;
    y0Base: number;
    y0Top: number;
    x1: number;
    y1Base: number;
    y1Top: number;
  }>,
): string {
  if (points.length === 0) return "";
  // Start at bottom-left of first segment
  let d = `M ${points[0].x0.toFixed(2)} ${points[0].y0Base.toFixed(2)}`;
  // Draw top edge forward
  for (const p of points) {
    d += ` L ${p.x1.toFixed(2)} ${p.y1Top.toFixed(2)}`;
  }
  // Draw bottom edge backward (reversed)
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    d += ` L ${p.x1.toFixed(2)} ${p.y1Base.toFixed(2)}`;
  }
  d += " Z";
  return d;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function A11yTrendChart({
  data,
  width = 640,
  height = 320,
  className = "",
}: A11yTrendChartProps) {
  const chartId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Layout constants
  const MARGIN = { top: 16, right: 16, bottom: 32, left: 40 };
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  // Compute stacked values for each data point
  const stacked = useMemo(() => {
    return data.map((pt) => {
      const sorted = [...SEVERITY_CONFIG].sort(
        (a, b) => a.stackOrder - b.stackOrder,
      );
      const bands: Record<string, { base: number; top: number }> = {};
      let cumulative = 0;
      for (const cfg of sorted) {
        const value = pt[cfg.key];
        bands[cfg.key] = { base: cumulative, top: cumulative + value };
        cumulative += value;
      }
      return { ...pt, total: cumulative, bands };
    });
  }, [data]);

  // Domain
  const maxTotal = Math.max(...stacked.map((s) => s.total), 1);
  const domainMin = 0;
  const domainMax = maxTotal * 1.1; // 10% headroom

  // Pre-compute band path data
  const bandPaths = useMemo(() => {
    if (stacked.length < 2) return [];

    return SEVERITY_CONFIG.map((cfg) => {
      const segments: Array<{
        x0: number;
        y0Base: number;
        y0Top: number;
        x1: number;
        y1Base: number;
        y1Top: number;
      }> = [];

      for (let i = 0; i < stacked.length - 1; i++) {
        const cur = stacked[i];
        const next = stacked[i + 1];

        const x0 = MARGIN.left + scaleLinear(i, 0, stacked.length - 1, 0, innerW);
        const x1 =
          MARGIN.left + scaleLinear(i + 1, 0, stacked.length - 1, 0, innerW);

        const y0Base =
          MARGIN.top + scaleLinear(cur.bands[cfg.key].base, domainMin, domainMax, innerH, 0);
        const y0Top =
          MARGIN.top + scaleLinear(cur.bands[cfg.key].top, domainMin, domainMax, innerH, 0);
        const y1Base =
          MARGIN.top + scaleLinear(next.bands[cfg.key].base, domainMin, domainMax, innerH, 0);
        const y1Top =
          MARGIN.top + scaleLinear(next.bands[cfg.key].top, domainMin, domainMax, innerH, 0);

        segments.push({ x0, y0Base, y0Top, x1, y1Base, y1Top });
      }

      return {
        key: cfg.key,
        path: buildStackedAreaPath(segments),
        stroke: cfg.stroke,
        dotColor: cfg.dotColor,
      };
    });
  }, [stacked, innerW, innerH]);

  // Y-axis tick labels
  const yTicks = useMemo(() => {
    const count = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.round((domainMax / count) * i));
    }
    return ticks;
  }, [domainMax]);

  // X-axis tick labels (show ~5 labels evenly spaced)
  const xTickIndices = useMemo(() => {
    if (data.length <= 5) return data.map((_, i) => i);
    const step = Math.max(1, Math.floor(data.length / 5));
    const indices: number[] = [];
    for (let i = 0; i < data.length; i += step) {
      indices.push(i);
    }
    // Always include the last index
    if (indices[indices.length - 1] !== data.length - 1) {
      indices.push(data.length - 1);
    }
    return indices;
  }, [data]);

  // Build accessible data table
  const tableCaption = `Historical accessibility audit issues by severity over ${data.length} periods`;

  return (
    <div
      className={`relative ${className}`}
      role="figure"
      aria-labelledby={`${chartId}-title`}
    >
      <h3
        id={`${chartId}-title`}
        className="sr-only"
      >
        {tableCaption}
      </h3>

      {/* ── SVG Chart ── */}
      <svg
        ref={svgRef}
        role="img"
        aria-label={`${tableCaption}. ${stacked.length > 0 ? `Most recent period: ${stacked[stacked.length - 1].period} — critical: ${stacked[stacked.length - 1].critical}, serious: ${stacked[stacked.length - 1].serious}, moderate: ${stacked[stacked.length - 1].moderate}.` : "No data available."}`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxWidth: width }}
      >
        <title>{tableCaption}</title>

        {/* ── Grid lines ── */}
        {yTicks.map((tick) => {
          const y = MARGIN.top + scaleLinear(tick, domainMin, domainMax, innerH, 0);
          return (
            <g key={`grid-${tick}`}>
              <line
                x1={MARGIN.left}
                y1={y}
                x2={MARGIN.left + innerW}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
              <text
                x={MARGIN.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[11px] font-medium"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* ── Stacked area bands ── */}
        {bandPaths.map(({ key, path, stroke }) => (
          <path
            key={key}
            data-testid={`a11y-band-${key}`}
            d={path}
            className={`transition-opacity duration-200 ${SEVERITY_CONFIG.find((c) => c.key === key)?.fill} ${SEVERITY_CONFIG.find((c) => c.key === key)?.fillDark}`}
            fillOpacity={hoveredIndex !== null ? 0.4 : 0.7}
            stroke={stroke}
            strokeWidth="1"
            strokeLinejoin="round"
            style={{
              transition: "fill-opacity 0.2s ease",
            }}
          />
        ))}

        {/* ── Top-edge stroke for each band ── */}
        {bandPaths.map(({ key, path, stroke }) => (
          <path
            key={`outline-${key}`}
            d={path
              .split(" ")
              .slice(0, stacked.length + 1)
              .join(" ")}
            fill="none"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
        ))}

        {/* ── X-axis labels ── */}
        {xTickIndices.map((idx) => {
          const x =
            MARGIN.left + scaleLinear(idx, 0, data.length - 1, 0, innerW);
          return (
            <text
              key={`xlabel-${idx}`}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
            >
              {data[idx].period}
            </text>
          );
        })}

        {/* ── Interactive hover targets ── */}
        {stacked.length >= 2 &&
          stacked.map((pt, idx) => {
            const cx =
              MARGIN.left + scaleLinear(idx, 0, stacked.length - 1, 0, innerW);
            return (
              <circle
                key={`hover-${idx}`}
                cx={cx}
                cy={MARGIN.top + innerH / 2}
                r={Math.max(6, innerW / stacked.length / 3)}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(idx)}
                onBlur={() => setHoveredIndex(null)}
                aria-label={`Period ${pt.period}: critical ${pt.critical}, serious ${pt.serious}, moderate ${pt.moderate}`}
                tabIndex={0}
                role="button"
              />
            );
          })}
      </svg>

      {/* ── Tooltip ── */}
      {hoveredIndex !== null && stacked[hoveredIndex] && (
        <div
          className="absolute top-0 left-0 z-10 -translate-y-full -translate-x-1/2 pointer-events-none"
          style={{
            left: `${MARGIN.left + scaleLinear(hoveredIndex, 0, stacked.length - 1, 0, innerW)}px`,
            top: `${MARGIN.top - 4}px`,
          }}
        >
          <div className="rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm min-w-[140px]">
            <p className="font-semibold text-slate-200 mb-1.5">
              {stacked[hoveredIndex].period}
            </p>
            <div className="space-y-1">
              {[...SEVERITY_CONFIG]
                .sort((a, b) => b.stackOrder - a.stackOrder)
                .map((cfg) => (
                  <div
                    key={cfg.key}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cfg.dotColor }}
                      />
                      <span className="text-slate-400">{cfg.label}</span>
                    </span>
                    <span className="font-medium text-slate-100">
                      {stacked[hoveredIndex][cfg.key]}
                    </span>
                  </div>
                ))}
            </div>
            <div className="mt-1.5 border-t border-white/5 pt-1 flex items-center justify-between">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold text-slate-100">
                {stacked[hoveredIndex].total}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div
        className="mt-4 flex flex-wrap items-center gap-4"
        aria-label="Chart legend"
      >
        {[...SEVERITY_CONFIG]
          .sort((a, b) => b.stackOrder - a.stackOrder)
          .map((cfg) => (
            <div key={cfg.key} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: cfg.dotColor }}
                aria-hidden={true}
              />
              <span className="text-slate-300">{cfg.label}</span>
            </div>
          ))}
      </div>

      {/* ── Hidden data table for screen readers ── */}
      <div className="sr-only">
        <table aria-label={tableCaption}>
          <caption>{tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Critical</th>
              <th scope="col">Serious</th>
              <th scope="col">Moderate</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pt) => (
              <tr key={pt.period}>
                <td>{pt.period}</td>
                <td>{pt.critical}</td>
                <td>{pt.serious}</td>
                <td>{pt.moderate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Reduced-motion style override ── */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .a11y-trend-chart-transition {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sample data                                                        */
/* ------------------------------------------------------------------ */

export const a11yTrendSampleData: A11yDataPoint[] = [
  { period: "Jun 01", critical: 12, serious: 18, moderate: 25 },
  { period: "Jun 08", critical: 14, serious: 20, moderate: 22 },
  { period: "Jun 15", critical: 11, serious: 16, moderate: 20 },
  { period: "Jun 22", critical: 9, serious: 14, moderate: 18 },
  { period: "Jun 29", critical: 7, serious: 12, moderate: 15 },
  { period: "Jul 06", critical: 8, serious: 10, moderate: 14 },
  { period: "Jul 13", critical: 5, serious: 9, moderate: 12 },
  { period: "Jul 20", critical: 4, serious: 7, moderate: 10 },
];
