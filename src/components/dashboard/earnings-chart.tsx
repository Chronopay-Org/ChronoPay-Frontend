"use client";

import { useState, useId } from "react";
import clsx from "clsx";
import type { EarningsSegment } from "./types";

export interface EarningsChartProps {
  segments: EarningsSegment[];
  className?: string;
}

export function EarningsChart({ segments, className }: EarningsChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const chartId = useId();

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  if (total === 0 || segments.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx("flex flex-col gap-4", className)}
      role="region"
      aria-label="Earnings breakdown"
      aria-describedby={`legend-${chartId}`}
    >
      {/* Chart Bar */}
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-800/50 dark:bg-slate-800/50 bg-slate-200">
        {segments.map((seg) => {
          const width = (seg.value / total) * 100;
          if (width === 0) return null;
          
          const isHovered = hoveredId === seg.id;
          const isDimmed = hoveredId !== null && hoveredId !== seg.id;

          return (
            <div
              key={seg.id}
              className={clsx(
                "group relative h-full transition-all duration-300 ease-in-out motion-reduce:transition-none cursor-pointer border-r border-[var(--background)] last:border-r-0",
                seg.colorClass,
                isDimmed ? "opacity-40" : "opacity-100"
              )}
              style={{ width: `${width}%` }}
              role="progressbar"
              aria-valuenow={seg.value}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${seg.label}: ${seg.formattedValue}`}
              tabIndex={0}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(seg.id)}
              onBlur={() => setHoveredId(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg z-10 animate-in fade-in zoom-in-95 duration-200 rtl:translate-x-1/2"
                  role="tooltip"
                >
                  <span className="font-medium">{seg.label}</span>: {seg.formattedValue}
                  <div className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div id={`legend-${chartId}`} className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-hidden="true">
        {segments.map((seg) => {
          const isDimmed = hoveredId !== null && hoveredId !== seg.id;
          return (
            <div
              key={seg.id}
              className={clsx(
                "flex items-center gap-2 transition-opacity duration-300 motion-reduce:transition-none cursor-pointer",
                isDimmed ? "opacity-40" : "opacity-100"
              )}
              onMouseEnter={() => setHoveredId(seg.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(seg.id)}
              onBlur={() => setHoveredId(null)}
              tabIndex={0}
            >
              <span className={clsx("h-3 w-3 rounded-full", seg.colorClass)} />
              <span className="text-slate-500 dark:text-slate-300">{seg.label}</span>
              <span className="font-medium text-slate-900 dark:text-white">{seg.formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
