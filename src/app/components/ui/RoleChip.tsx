"use client";

/**
 * RoleChip.tsx
 *
 * Displays the currently-active role as a pill badge in the header.
 * Clicking or pressing Enter/Space opens a compact popover that lets the
 * user switch roles.
 *
 * Accessibility
 * ─────────────
 * • Trigger: aria-haspopup="listbox", aria-expanded, aria-controls.
 * • List: role="listbox", aria-label.
 * • Options: role="option", aria-selected, keyboard navigable.
 * • Focus moves to the selected option on open; Escape returns focus to trigger.
 * • Arrow keys cycle through options (APG Listbox pattern).
 * • Tab while open closes the popover and moves focus naturally.
 * • Role indicator always uses icon + text — never icon-only (WCAG 1.4.1).
 * • Checkmark SVG + "Current role" aria-label on the selected option.
 *
 * Responsive
 * ──────────
 * • Label text hidden below sm breakpoint; sr-only label always present.
 * • Popover right-aligned on all sizes to avoid viewport clipping.
 *
 * Reduced motion
 * ──────────────
 * • Chevron rotate and popover fade respect prefers-reduced-motion via
 *   Tailwind's motion-safe: prefix.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ROLE_META, ALL_ROLES, type UserRole } from "../navigation/role-nav";
import { useRole } from "../navigation/RoleContext";

type Density = "comfortable" | "balanced" | "compact";
type Theme = "light" | "dark";

// Tone → chip colour classes (text + bg pairs satisfy ≥ 4.5:1 contrast)
const TONE_CHIP: Record<string, string> = {
  info:    "border-cyan-300/30 bg-cyan-300/12 text-cyan-100",
  success: "border-emerald-300/30 bg-emerald-300/12 text-emerald-100",
  warning: "border-amber-300/30 bg-amber-300/12 text-amber-100",
  neutral: "border-white/15 bg-white/8 text-slate-200",
};

export function RoleChip() {
  const { role, setRole, isHydrating } = useRole();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const meta = ROLE_META[role];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Move focus to selected option when popover opens
  useEffect(() => {
    if (!open) return;
    const selected = listRef.current?.querySelector<HTMLElement>(
      '[aria-selected="true"]'
    );
    selected?.focus();
  }, [open]);

  const handleListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "Tab") {
      // Let Tab close the popover and move focus forward naturally
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []
      );
      const idx = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === "ArrowDown") items[(idx + 1) % items.length]?.focus();
      else items[(idx - 1 + items.length) % items.length]?.focus();
    }
  };

  const handleSelect = (next: UserRole) => {
    setRole(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // ── Quick-settings (theme + density) ─────────────────────────────────
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("chronopay-theme") as Theme) ?? "dark";
  });

  const [currentDensity, setCurrentDensity] = useState<Density>(() => {
    if (typeof window === "undefined") return "balanced";
    return (localStorage.getItem("chronopay-density") as Density) ?? "balanced";
  });

  const applyTheme = useCallback((t: Theme) => {
    setCurrentTheme(t);
    localStorage.setItem("chronopay-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const applyDensity = useCallback((d: Density) => {
    setCurrentDensity(d);
    localStorage.setItem("chronopay-density", d);
    document.documentElement.dataset.density = d;
  }, []);

  const DENSITIES: { key: Density; label: string }[] = [
    { key: "comfortable", label: "Cozy" },
    { key: "balanced", label: "Balanced" },
    { key: "compact", label: "Compact" },
  ];

  // SSR / hydration skeleton — prevents layout shift
  if (isHydrating) {
    return (
      <span
        aria-hidden={true}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-xs text-slate-500"
      >
        <span className="skeleton h-3 w-3 rounded-full" />
        <span className="skeleton hidden h-2.5 w-12 rounded sm:inline" />
      </span>
    );
  }

  const chipClasses = TONE_CHIP[meta.tone] ?? TONE_CHIP.neutral;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-describedby={`${listboxId}-desc`}
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
          "text-xs font-medium tracking-[0.1em] uppercase",
          "transition-colors duration-150 hover:brightness-110",
          "focus-ring-cyan",
          chipClasses,
        ].join(" ")}
      >
        {/* Icon — decorative, text label follows */}
        <span aria-hidden={true} className="text-sm leading-none">
          {meta.icon}
        </span>

        {/* Visible label on sm+ */}
        <span className="hidden sm:inline">{meta.label}</span>

        {/* Always-accessible label for narrow viewports */}
        <span className="sr-only">{meta.label} — switch role</span>

        {/* Chevron */}
        <svg
          aria-hidden={true}
          className={[
            "h-3 w-3",
            "motion-safe:transition-transform motion-safe:duration-150",
            open ? "rotate-180" : "",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Hidden description for aria-describedby */}
      <span id={`${listboxId}-desc`} className="sr-only">
        {meta.description}
      </span>

      {/* Popover listbox */}
      {open && (
        <div
          className={[
            "absolute right-0 top-full z-50 mt-2",
            "w-72 rounded-2xl border border-white/10",
            "bg-slate-900/95 shadow-xl backdrop-blur-xl",
          ].join(" ")}
        >
          {/* Role listbox */}
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Switch role"
            onKeyDown={handleListKeyDown}
            className="py-1.5"
          >
            {/* Section heading — presentational */}
            <li
              role="presentation"
              className="px-4 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Switch role
            </li>

            {ALL_ROLES.map((r) => {
              const m = ROLE_META[r];
              const isCurrent = r === role;
              return (
                <li
                  key={r}
                  role="option"
                  aria-selected={isCurrent}
                  tabIndex={0}
                  onClick={() => handleSelect(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(r);
                    }
                  }}
                  className={[
                    "mx-1.5 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                    "text-sm transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300",
                    isCurrent
                      ? "bg-white/8 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  {/* Role icon — decorative */}
                  <span aria-hidden={true} className="text-base leading-none">
                    {m.icon}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="block font-medium">{m.label}</span>
                    <span className="block text-xs text-slate-500 leading-snug">
                      {m.description}
                    </span>
                  </span>

                  {/* Selected indicator — checkmark SVG + aria-label, not colour alone */}
                  {isCurrent && (
                    <svg
                      aria-label="Current role"
                      role="img"
                      className="h-4 w-4 shrink-0 text-cyan-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>

          {/* ── Quick-settings footer ──────────────────────────────────── */}
          <div className="border-t border-white/10 px-4 py-3 space-y-3">
            {/* Theme toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Theme
              </span>
              <div className="flex gap-1">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={currentTheme === t}
                    onClick={() => applyTheme(t)}
                    className={[
                      "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300",
                      currentTheme === t
                        ? "bg-white/8 text-white"
                        : "text-slate-400 hover:text-slate-200",
                    ].join(" ")}
                  >
                    {t === "light" ? (
                      <svg className="h-3.5 w-3.5" aria-hidden={true} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" aria-hidden={true} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    <span className="sr-only">{t === "light" ? "Light" : "Dark"}</span>
                    {t === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </div>

            {/* Density toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Density
              </span>
              <div className="flex gap-1">
                {DENSITIES.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    aria-pressed={currentDensity === d.key}
                    onClick={() => applyDensity(d.key)}
                    className={[
                      "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300",
                      currentDensity === d.key
                        ? "bg-white/8 text-white"
                        : "text-slate-400 hover:text-slate-200",
                    ].join(" ")}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
