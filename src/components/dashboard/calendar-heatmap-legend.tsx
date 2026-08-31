"use client";

import clsx from "clsx";

export type HeatmapIntensity = "none" | "low" | "medium" | "high" | "peak";

export interface CalendarHeatmapLegendProps {
  className?: string;
  variant?: "horizontal" | "vertical";
  /** Custom slot count ranges for each intensity level */
  ranges?: Record<HeatmapIntensity, string>;
}

const intensityConfig: Record<
  HeatmapIntensity,
  {
    label: string;
    description: string;
    defaultRange: string;
    /** CSS variable for the fill color */
    fillVar: string;
    /** CSS variable for the pattern */
    patternVar: string;
    /** CSS variable for the pattern size */
    patternSizeVar: string;
  }
> = {
  none: {
    label: "No availability",
    description: "No open slots",
    defaultRange: "0 slots",
    fillVar: "var(--heatmap-step-1)",
    patternVar: "var(--heatmap-step-1-pattern)",
    patternSizeVar: "var(--heatmap-step-1-pattern-size)",
  },
  low: {
    label: "Low",
    description: "1–2 open slots",
    defaultRange: "1–2 slots",
    fillVar: "var(--heatmap-step-2)",
    patternVar: "var(--heatmap-step-2-pattern)",
    patternSizeVar: "var(--heatmap-step-2-pattern-size)",
  },
  medium: {
    label: "Medium",
    description: "3–5 open slots",
    defaultRange: "3–5 slots",
    fillVar: "var(--heatmap-step-3)",
    patternVar: "var(--heatmap-step-3-pattern)",
    patternSizeVar: "var(--heatmap-step-3-pattern-size)",
  },
  high: {
    label: "High",
    description: "6–9 open slots",
    defaultRange: "6–9 slots",
    fillVar: "var(--heatmap-step-4)",
    patternVar: "var(--heatmap-step-4-pattern)",
    patternSizeVar: "var(--heatmap-step-4-pattern-size)",
  },
  peak: {
    label: "Peak",
    description: "10+ open slots",
    defaultRange: "10+ slots",
    fillVar: "var(--heatmap-step-5)",
    patternVar: "var(--heatmap-step-5-pattern)",
    patternSizeVar: "var(--heatmap-step-5-pattern-size)",
  },
};

const intensityOrder: HeatmapIntensity[] = [
  "none",
  "low",
  "medium",
  "high",
  "peak",
];

export function CalendarHeatmapLegend({
  className = "",
  variant = "horizontal",
  ranges,
}: CalendarHeatmapLegendProps) {
  const isHorizontal = variant === "horizontal";

  return (
    <div
      className={clsx(
        "rounded-xl border border-white/10 bg-white/[0.03] p-3",
        isHorizontal ? "flex flex-wrap items-center gap-3" : "flex flex-col gap-2",
        className
      )}
      role="legend"
      aria-label="Availability heatmap intensity legend"
    >
      {intensityOrder.map((intensity) => {
        const config = intensityConfig[intensity];
        const range = ranges?.[intensity] ?? config.defaultRange;

        return (
          <div
            key={intensity}
            className={clsx(
              "flex items-center gap-2",
              isHorizontal ? "flex-row" : "flex-row"
            )}
          >
            {/* Color swatch with pattern for color-blind accessibility */}
            <div
              className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/20"
              aria-hidden="true"
              style={{
                backgroundColor: config.fillVar,
                backgroundImage: config.patternVar,
                backgroundSize: config.patternSizeVar,
              } as React.CSSProperties}
            >
              {/* Screen-reader only label inside swatch */}
              <span className="sr-only">
                {config.label}: {config.description}
              </span>
            </div>

            {/* Label and range */}
            <div className="flex flex-col min-w-[80px]">
              <span className="text-xs font-medium text-white">{config.label}</span>
              <span className="text-[10px] text-slate-400">{range}</span>
            </div>

            {/* Description (vertical variant only) */}
            {!isHorizontal && (
              <span className="text-[10px] text-slate-500 ml-7">{config.description}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}