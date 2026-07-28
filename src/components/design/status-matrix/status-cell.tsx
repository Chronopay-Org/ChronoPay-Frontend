"use client";

import { useState, useRef, useId, useCallback, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import clsx from "clsx";
import type { Status, CellData, Region, Component } from "./types";

const statusIcon: Record<Status, React.ElementType> = {
  operational: CheckCircle2,
  degraded: AlertTriangle,
  outage: XCircle,
  unknown: HelpCircle,
};

const statusBg: Record<Status, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-rose-500",
  unknown: "bg-slate-500",
};

const statusRing: Record<Status, string> = {
  operational: "focus-visible:ring-emerald-400",
  degraded: "focus-visible:ring-amber-400",
  outage: "focus-visible:ring-rose-400",
  unknown: "focus-visible:ring-slate-400",
};

export function StatusCell({
  cell,
  region,
  component,
}: {
  cell: CellData;
  region: Region;
  component: Component;
}) {
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = `cell-tooltip-${useId()}`;
  const Icon = statusIcon[cell.status];

  const showTooltip = useCallback(() => setTooltipVisible(true), []);
  const hideTooltip = useCallback(() => setTooltipVisible(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && isTooltipVisible) {
        hideTooltip();
        triggerRef.current?.focus();
      }
    },
    [isTooltipVisible, hideTooltip],
  );

  useEffect(() => {
    if (!isTooltipVisible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        hideTooltip();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isTooltipVisible, hideTooltip]);

  const label = `${component.label} ${region.label}: ${cell.status}. ${cell.message}. Last checked ${cell.lastChecked}.`;

  return (
    <div className="relative flex items-center justify-center">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-describedby={isTooltipVisible ? tooltipId : undefined}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={() => setTooltipVisible((v) => !v)}
        onKeyDown={handleKeyDown}
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all",
          statusBg[cell.status],
          "shadow-sm",
          "hover:scale-110 hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          statusRing[cell.status],
        )}
      >
        <Icon className="h-5 w-5 text-white" aria-hidden="true" />
      </button>

      {isTooltipVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={clsx(
            "absolute z-50 w-56 rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm shadow-xl",
            "bottom-full mb-2 left-1/2 -translate-x-1/2",
          )}
        >
          <p className="font-medium text-white">{component.label}</p>
          <p className="text-xs text-slate-400">{region.label}</p>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-xs text-slate-300">{cell.message}</p>
            <p className="text-xs text-slate-500">
              Last check: {cell.lastChecked}
            </p>
          </div>
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
