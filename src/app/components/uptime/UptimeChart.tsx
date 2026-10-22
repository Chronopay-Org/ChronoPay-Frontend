/**
 * UptimeChart.tsx
 * 90-day historical uptime bar chart component.
 * 
 * Features:
 * - Horizontal strip layout with 90 cells
 * - Responsive design (min 3px width on mobile, full size on desktop)
 * - Scrollable on small screens
 * - RTL support (reverses cell order)
 * - Keyboard navigation with arrow keys
 * - Summary line with component name and uptime percentage
 * - WCAG 2.1 AA compliant
 */

"use client";

import React, { useCallback, useRef, useState, useEffect, useId } from "react";
import { UptimeChartProps, DayData } from "./uptime.types";
import { UptimeCell } from "./UptimeCell";

export function UptimeChart({
  componentName,
  days,
  currentUptimePercent,
}: UptimeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headingId = useId();
  const [isRtl, setIsRtl] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Ensure we have exactly 90 days
  const displayDays = days?.slice(-90) || []; // Take last 90 days (newest last)

  useEffect(() => {
    setIsRtl(document.documentElement.dir === "rtl");
  }, []);

  // Keyboard navigation: arrow keys, Home, End move focus between cells
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, currentIndex: number) => {
      if (!displayDays || displayDays.length === 0) return;

      let nextIndex = currentIndex;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nextIndex = isRtl
          ? Math.min(currentIndex + 1, displayDays.length - 1)
          : Math.max(currentIndex - 1, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextIndex = isRtl
          ? Math.max(currentIndex - 1, 0)
          : Math.min(currentIndex + 1, displayDays.length - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = isRtl ? displayDays.length - 1 : 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = isRtl ? 0 : displayDays.length - 1;
      } else {
        return;
      }

      setFocusedIndex(nextIndex);
      cellsRef.current[nextIndex]?.focus();
    },
    [displayDays, isRtl]
  );

  if (!days || days.length === 0) {
    return (
      <div className="text-slate-400 text-sm">
        No uptime data available
      </div>
    );
  }

  // Format dates for labels
  const oldestDate = new Date(`${displayDays[0].date}T00:00:00Z`);
  const newestDate = new Date(
    `${displayDays[displayDays.length - 1].date}T00:00:00Z`
  );

  const oldestLabel = oldestDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const newestLabel = newestDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <section
      className="space-y-6"
      aria-labelledby={headingId}
    >
      {/* Title and summary */}
      <div>
        <h2 id={headingId} className="text-lg font-semibold text-slate-100 mb-1">
          {componentName}
        </h2>
        <p className="text-sm text-slate-400">
          <span className="font-medium text-slate-200">{currentUptimePercent}%</span> uptime
          {" "}over the last 90 days
        </p>
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        className="overflow-x-auto pb-4"
        role="region"
        aria-label="90-day uptime history"
      >
        {/* Cell wrapper with flex layout */}
        <div
          className="flex gap-3 min-w-min px-1 py-2"
          style={{
            flexDirection: isRtl ? "row-reverse" : "row",
          }}
        >
          {/* Time period label: 90 days ago */}
          <div className="flex flex-col items-center justify-start gap-1 flex-shrink-0">
            <div className="w-2 h-12 rounded-sm bg-slate-700/30 flex-shrink-0" />
            <span className="text-xs text-slate-500 whitespace-nowrap mt-1">
              {oldestLabel}
            </span>
          </div>

          {/* Cells for each day */}
          {displayDays.map((day: DayData, index: number) => (
            <UptimeCell
              key={day.date}
              cellRef={(el) => {
                cellsRef.current[index] = el;
              }}
              date={day.date}
              uptimePercent={day.uptimePercent}
              incidents={day.incidents}
              tabIndex={index === focusedIndex ? 0 : -1}
              onFocus={() => setFocusedIndex(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}

          {/* Time period label: Today */}
          <div className="flex flex-col items-center justify-start gap-1 flex-shrink-0">
            <div className="w-2 h-12 rounded-sm bg-slate-700/30 flex-shrink-0" />
            <span className="text-xs text-slate-500 whitespace-nowrap mt-1">
              Today
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400 mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>100% uptime</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-400" />
          <span>99–99.9%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-orange-400" />
          <span>95–98.9%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span>&lt;95%</span>
        </div>
      </div>
    </section>
  );
}
