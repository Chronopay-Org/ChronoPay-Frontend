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
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ROLE_META, ALL_ROLES, type UserRole } from "../navigation/role-nav";
import { useRole } from "../navigation/RoleContext";

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

  // SSR / hydration skeleton — prevents layout shift
  if (isHydrating) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-xs text-slate-500"
      >
        <span className="h-3 w-3 rounded-full bg-slate-600 animate-pulse" />
        <span className="hidden sm:inline h-2.5 w-12 rounded bg-slate-700 animate-pulse" />
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
        <span aria-hidden="true" className="text-sm leading-none">
          {meta.icon}
        </span>

        {/* Visible label on sm+ */}
        <span className="hidden sm:inline">{meta.label}</span>

        {/* Always-accessible label for narrow viewports */}
        <span className="sr-only">{meta.label} — switch role</span>

        {/* Chevron */}
        <svg
          aria-hidden="true"
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
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Switch role"
          onKeyDown={handleListKeyDown}
          className={[
            "absolute right-0 top-full z-50 mt-2",
            "w-60 rounded-2xl border border-white/10",
            "bg-slate-900/95 py-1.5 shadow-xl backdrop-blur-xl",
          ].join(" ")}
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
                <span aria-hidden="true" className="text-base leading-none">
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
      )}
    </div>
  );
}
