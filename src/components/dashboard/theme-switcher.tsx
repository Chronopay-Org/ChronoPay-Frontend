"use client";

import { useRef } from "react";
import clsx from "clsx";
import { Sun, Moon, Monitor, Clock } from "lucide-react";
import { useTheme, type ThemeMode } from "@/hooks/use-theme";
import { ThemePreviewStrip } from "@/app/components/ui/theme-preview-strip";

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "auto", label: "Auto", Icon: Monitor },
  { value: "scheduled", label: "Scheduled", Icon: Clock },
];

const ariaLabels: Record<ThemeMode, string> = {
  light: "Use light theme",
  dark: "Use dark theme",
  auto: "Use system theme",
  scheduled: "Use scheduled theme",
};

/**
 * ThemeSwitcher — segmented radio control for Light / Dark / Auto / Scheduled.
 *
 * Accessible (WCAG 2.1 AA):
 *  - role="radiogroup" + role="radio" with aria-checked
 *  - Arrow keys move focus per the WAI-ARIA radio pattern (roving tabindex)
 *  - Home/End jump to first/last option
 *  - Visible high-contrast focus ring
 *  - sr-only group label for screen readers / assistive tech
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { mode, changeTheme, scheduleConfig, updateScheduleConfig } = useTheme();
  const groupRef = useRef<HTMLDivElement>(null);
  const activeIndex = OPTIONS.findIndex((o) => o.value === mode);

  function focusOption(index: number) {
    const buttons = Array.from(
      groupRef.current?.querySelectorAll<HTMLButtonElement>("[role='radio']") ?? [],
    );
    buttons[Math.max(0, Math.min(index, buttons.length - 1))]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = activeIndex;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusOption(idx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusOption(idx - 1);
        break;
      case "Home":
        e.preventDefault();
        focusOption(0);
        break;
      case "End":
        e.preventDefault();
        focusOption(OPTIONS.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className={clsx("inline-flex flex-col gap-3", className)}>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Color theme"
        onKeyDown={handleKeyDown}
        className={clsx(
          "inline-flex items-center gap-1 rounded-full border border-slate-300/30 bg-slate-900/10 p-1 dark:border-white/10 dark:bg-white/6",
          "focus-within:ring-2 focus-within:ring-cyan-500 dark:focus-within:ring-cyan-300 focus-within:ring-offset-2",
        )}
      >
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = value === mode;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={ariaLabels[value]}
              tabIndex={active ? 0 : -1}
              onClick={() => changeTheme(value)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-300 focus-visible:ring-offset-1",
                active
                  ? "bg-cyan-600 text-white dark:bg-cyan-300 dark:text-slate-950 shadow-sm"
                  : "text-slate-600 hover:bg-slate-900/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {mode === "scheduled" && (
        <div
          className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800 animate-in fade-in slide-in-from-top-1"
          aria-label="Theme schedule configuration"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="theme-schedule-light-time"
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"
              >
                <Sun size={12} aria-hidden="true" /> Light Mode
              </label>
              <input
                id="theme-schedule-light-time"
                type="time"
                value={scheduleConfig.lightTime}
                onChange={(e) =>
                  updateScheduleConfig({ lightTime: e.target.value })
                }
                className="w-full rounded border border-slate-300/40 bg-transparent p-1 text-sm dark:border-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="theme-schedule-dark-time"
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"
              >
                <Moon size={12} aria-hidden="true" /> Dark Mode
              </label>
              <input
                id="theme-schedule-dark-time"
                type="time"
                value={scheduleConfig.darkTime}
                onChange={(e) =>
                  updateScheduleConfig({ darkTime: e.target.value })
                }
                className="w-full rounded border border-slate-300/40 bg-transparent p-1 text-sm dark:border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Daylight Preview
            </span>
            <ThemePreviewStrip
              lightTime={scheduleConfig.lightTime}
              darkTime={scheduleConfig.darkTime}
            />
          </div>
        </div>
      )}
    </div>
  );
}