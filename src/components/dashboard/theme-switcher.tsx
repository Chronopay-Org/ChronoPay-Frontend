"use client";

import { useRef } from "react";
import clsx from "clsx";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemeMode } from "@/hooks/use-theme";

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "auto", label: "Auto", Icon: Monitor },
];

const ariaLabels: Record<ThemeMode, string> = {
  light: "Use light theme",
  dark: "Use dark theme",
  auto: "Use system theme",
};

/**
 * ThemeSwitcher — segmented radio control for Light / Dark / Auto.
 *
 * Accessible (WCAG 2.1 AA):
 *  - role="radiogroup" + role="radio" with aria-checked
 *  - Arrow keys move focus per the WAI-ARIA radio pattern (roving tabindex)
 *  - Home/End jump to first/last option
 *  - Visible high-contrast focus ring
 *  - sr-only group label for screen readers / assistive tech
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { mode, changeTheme } = useTheme();
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
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Color theme"
      onKeyDown={handleKeyDown}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 p-1",
        "focus-within:ring-2 focus-within:ring-cyan-300 focus-within:ring-offset-2 focus-within:ring-offset-slate-950",
        "dark:bg-white/6",
        className,
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
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1",
              active
                ? "bg-cyan-300 text-slate-950"
                : "text-slate-300 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}