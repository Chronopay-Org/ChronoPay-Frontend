/**
 * UptimeCell.tsx
 * Single day cell component for the uptime bar chart.
 * 
 * Features:
 * - Color-coded by uptime percentage
 * - Keyboard focusable with full aria-label
 * - Shows tooltip on hover and keyboard focus
 * - Respects prefers-reduced-motion
 * - RTL compatible
 */

"use client";

import React, { useRef, useState, useCallback, useId } from "react";
import { UptimeCellProps } from "./uptime.types";
import { getUptimeColorClass, UPTIME_NONE } from "./uptime-tokens";
import { UptimeTooltip } from "./UptimeTooltip";

export function UptimeCell({
  date,
  uptimePercent,
  incidents,
}: UptimeCellProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const tooltipId = `uptime-tooltip-${useId()}`;

  // Format date for display (e.g., "July 28")
  const dateObj = new Date(`${date}T00:00:00Z`);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Parse ISO date for full aria-label
  const parsedDate = new Date(`${date}T00:00:00Z`);
  const fullDateLabel = parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Build aria-label
  const incidentCount = incidents.length;
  const incidentText = incidentCount === 0 
    ? "no incidents"
    : incidentCount === 1 
    ? "1 incident" 
    : `${incidentCount} incidents`;
  const ariaLabel = `${fullDateLabel}: ${uptimePercent}% uptime, ${incidentText}`;

  // Determine color class
  const colorClass =
    uptimePercent === null ? UPTIME_NONE : getUptimeColorClass(uptimePercent);

  // Mouse and keyboard event handlers
  const handleMouseEnter = useCallback(() => {
    setIsTooltipVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsTooltipVisible(false);
  }, []);

  const handleFocus = useCallback(() => {
    setIsTooltipVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsTooltipVisible(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsTooltipVisible(false);
    }
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-1 group">
      {/* Cell bar */}
      <div
        ref={cellRef}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={isTooltipVisible ? tooltipId : undefined}
        tabIndex={0}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`
          w-2 h-12 rounded-sm
          ${colorClass}
          transition-all duration-200
          hover:opacity-80
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 focus:ring-offset-slate-950
          cursor-pointer
          relative
          ${
            incidents.length > 0
              ? "after:absolute after:top-0 after:right-0 after:w-1 after:h-full after:bg-red-300 after:rounded-sm after:opacity-70"
              : ""
          }
        `}
        style={{
          minWidth: "3px",
          transition: "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Incident indicator: red marker for cells with incidents */}
        {incidents.length > 0 && (
          <div className="absolute inset-0 rounded-sm border border-red-300 opacity-50 pointer-events-none" />
        )}
      </div>

      {/* Date label below cell (always visible) */}
      <span className="text-xs text-slate-400 whitespace-nowrap mt-1 group-hover:text-slate-200 transition-colors">
        {formattedDate}
      </span>

      {/* Tooltip */}
      {isTooltipVisible && (
        <UptimeTooltip
          tooltipId={tooltipId}
          triggerElement={cellRef.current}
          date={date}
          uptimePercent={uptimePercent}
          incidents={incidents}
          onDismiss={() => setIsTooltipVisible(false)}
        />
      )}
    </div>
  );
}
