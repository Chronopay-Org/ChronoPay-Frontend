"use client";

import { Check, X, Clock, Ban } from "lucide-react";
import clsx from "clsx";

export interface AvailabilityLegendProps {
  className?: string;
  variant?: "horizontal" | "vertical";
}

export type AvailabilityStatus = "open" | "held" | "sold" | "blocked";

const legendItems: Record<
  AvailabilityStatus,
  {
    label: string;
    color: string;
    pattern: string;
    icon: typeof Check;
    description: string;
  }
> = {
  open: {
    label: "Open",
    color: "bg-emerald-400",
    pattern: "bg-[radial-gradient(circle,rgba(52,211,153,0.3)_1px,transparent_1px)] [background-size:4px_4px]",
    icon: Check,
    description: "Available for booking",
  },
  held: {
    label: "Held",
    color: "bg-amber-400",
    pattern: "bg-[repeating-linear-gradient(45deg,rgba(251,191,36,0.2)_0,rgba(251,191,36,0.2)_1px,transparent_1px,transparent_4px)]",
    icon: Clock,
    description: "Temporarily reserved",
  },
  sold: {
    label: "Sold",
    color: "bg-rose-400",
    pattern: "bg-[repeating-linear-gradient(90deg,rgba(244,63,94,0.2)_0,rgba(244,63,94,0.2)_1px,transparent_1px,transparent_4px)]",
    icon: X,
    description: "Fully booked",
  },
  blocked: {
    label: "Blocked",
    color: "bg-slate-400",
    pattern: "bg-[radial-gradient(circle,rgba(148,163,184,0.3)_2px,transparent_2px)] [background-size:6px_6px]",
    icon: Ban,
    description: "Not available",
  },
};

export function AvailabilityLegend({
  className = "",
  variant = "horizontal",
}: AvailabilityLegendProps) {
  const isHorizontal = variant === "horizontal";

  return (
    <div
      className={clsx(
        "rounded-xl border border-white/10 bg-white/[0.03] p-3",
        isHorizontal ? "flex flex-wrap items-center gap-4" : "flex flex-col gap-3",
        className
      )}
      role="legend"
      aria-label="Availability status legend"
    >
      {(Object.entries(legendItems) as [AvailabilityStatus, typeof legendItems.open][]).map(
        ([status, item]) => {
          const Icon = item.icon;

          return (
            <div
              key={status}
              className={clsx(
                "flex items-center gap-2",
                isHorizontal ? "flex-row" : "flex-row"
              )}
            >
              {/* Color swatch with pattern for color-blind accessibility */}
              <div
                className={clsx(
                  "relative flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/20",
                  item.color,
                  item.pattern
                )}
                aria-hidden="true"
              >
                <Icon className="h-3 w-3 text-white/90" />
              </div>

              {/* Label */}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.description}
                </span>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}
