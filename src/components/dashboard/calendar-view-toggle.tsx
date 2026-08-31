"use client";

import { useState } from "react";
import { Calendar, List, LayoutGrid, Flame } from "lucide-react";
import clsx from "clsx";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

export interface CalendarViewToggleProps {
  currentMode: CalendarViewMode;
  onModeChange: (mode: CalendarViewMode) => void;
  heatmapEnabled?: boolean;
  onHeatmapToggle?: (enabled: boolean) => void;
  className?: string;
}

const viewConfig: Record<
  CalendarViewMode,
  { label: string; icon: typeof Calendar; description: string }
> = {
  month: {
    label: "Month",
    icon: LayoutGrid,
    description: "View entire month at a glance",
  },
  week: {
    label: "Week",
    icon: LayoutGrid,
    description: "View current week in detail",
  },
  day: {
    label: "Day",
    icon: Calendar,
    description: "Focus on single day",
  },
  agenda: {
    label: "Agenda",
    icon: List,
    description: "Chronological list view",
  },
};

export function CalendarViewToggle({
  currentMode,
  onModeChange,
  heatmapEnabled = false,
  onHeatmapToggle,
  className = "",
}: CalendarViewToggleProps) {
  const [focusedIndex, setFocusedIndex] = useState(
    Object.keys(viewConfig).indexOf(currentMode)
  );

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    mode: CalendarViewMode
  ) => {
    const modes = Object.keys(viewConfig) as CalendarViewMode[];

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        const prevIndex = (index - 1 + modes.length) % modes.length;
        setFocusedIndex(prevIndex);
        onModeChange(modes[prevIndex]);
        break;
      case "ArrowRight":
        e.preventDefault();
        const nextIndex = (index + 1) % modes.length;
        setFocusedIndex(nextIndex);
        onModeChange(modes[nextIndex]);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onModeChange(mode);
        break;
    }
  };

  const handleHeatmapKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onHeatmapToggle?.(!heatmapEnabled);
    }
  };

  return (
    <nav
      className={clsx(
        "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1",
        className
      )}
      aria-label="Calendar view mode"
      role="tablist"
    >
      <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5" role="group" aria-label="Calendar view">
        {(Object.entries(viewConfig) as [CalendarViewMode, typeof viewConfig.month][]).map(
          ([mode, config], index) => {
            const Icon = config.icon;
            const isActive = mode === currentMode;

            return (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                onKeyDown={(e) => handleKeyDown(e, index, mode)}
                onFocus={() => setFocusedIndex(index)}
                className={clsx(
                  "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-ring-cyan",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-100 shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
                aria-label={config.label}
                aria-selected={isActive}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                title={config.description}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{config.label}</span>

                {/* Screen reader only full label */}
                <span className="sr-only">{config.description}</span>
              </button>
            );
          }
        )}
      </div>

      {onHeatmapToggle && (
        <button
          onClick={() => onHeatmapToggle(!heatmapEnabled)}
          onKeyDown={handleHeatmapKeyDown}
          className={clsx(
            "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus-ring-cyan",
            heatmapEnabled
              ? "bg-cyan-500/20 text-cyan-100 shadow-sm"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          )}
          aria-label={heatmapEnabled ? "Hide availability heatmap" : "Show availability heatmap"}
          aria-pressed={heatmapEnabled}
          title={heatmapEnabled ? "Hide availability heatmap" : "Show availability heatmap"}
        >
          <Flame className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{heatmapEnabled ? "Heatmap On" : "Heatmap Off"}</span>
          <span className="sr-only">
            {heatmapEnabled ? "Hide availability heatmap overlay" : "Show availability heatmap overlay"}
          </span>
        </button>
      )}
    </nav>
  );
}
