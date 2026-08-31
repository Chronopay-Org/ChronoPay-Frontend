"use client";

/**
 * BottomNavOverflow.tsx
 *
 * Mobile bottom navigation bar with overflow sheet and per-item pinning.
 *
 * Behaviour
 * ─────────
 * • When a role has more than BOTTOM_NAV_MAX_VISIBLE nav items, the bar shows
 *   the first N–1 pinned/default items plus a "More ···" trigger button.
 * • Tapping "More" opens a bottom sheet listing every overflow item.
 * • Each row in the sheet has a pin/unpin toggle (📌 / ➕).
 * • Pinned items are always surfaced in the bottom bar (up to the visible cap),
 *   sorted by pin order, and persisted to localStorage via writePinnedHrefs.
 * • When all items fit (≤ BOTTOM_NAV_MAX_VISIBLE), the "More" button is hidden.
 *
 * Accessibility (WCAG 2.1 AA)
 * ───────────────────────────
 * • Bottom bar is a <nav> landmark with aria-label.
 * • Active tab carries aria-current="page".
 * • Icons are aria-hidden; text labels always visible.
 * • "More" button has aria-expanded + aria-controls pointing to the sheet.
 * • Sheet is role="dialog" aria-modal="true" with a visible label.
 * • FocusTrap keeps keyboard focus inside the open sheet.
 * • Escape closes the sheet and returns focus to the "More" trigger.
 * • Pin toggle announces its new state via an aria-live region.
 * • Touch targets are ≥ 44 × 44 px (min-h-[44px] min-w-[44px]).
 * • Respects prefers-reduced-motion (no transition when reduced).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FocusTrap } from "@/components/common/FocusTrap";
import {
  BOTTOM_NAV_MAX_VISIBLE,
  type NavItem,
  type UserRole,
  readPinnedHrefs,
  sortNavByPins,
  writePinnedHrefs,
} from "./role-nav";

// ─── Props ────────────────────────────────────────────────────────────────────

interface BottomNavOverflowProps {
  /** Full ordered nav items for the current role */
  items: NavItem[];
  /** Current role — used to namespace pin storage */
  role: UserRole;
  /** Extra className applied to the outer <nav> */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNavOverflow({ items, role, className = "" }: BottomNavOverflowProps) {
  const pathname = usePathname();

  // Pin state — initialised from localStorage via lazy initializer
  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>(() =>
    typeof window !== "undefined" ? readPinnedHrefs(role) : [],
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // Ref to the "More" trigger so we can restore focus when sheet closes
  const moreTriggerRef = useRef<HTMLButtonElement>(null);

  // ── Sorted full list (pinned items first) ────────────────────────────────
  const sorted = sortNavByPins(items, pinnedHrefs);
  const needsOverflow = sorted.length > BOTTOM_NAV_MAX_VISIBLE;

  // Items shown directly in the bar: first (MAX_VISIBLE - 1) when overflow is
  // needed; all items when everything fits.
  const visibleItems = needsOverflow ? sorted.slice(0, BOTTOM_NAV_MAX_VISIBLE - 1) : sorted;
  // Items that live in the overflow sheet
  const overflowItems = needsOverflow ? sorted.slice(BOTTOM_NAV_MAX_VISIBLE - 1) : [];

  // ── Toggle pin ────────────────────────────────────────────────────────────
  const togglePin = useCallback(
    (item: NavItem) => {
      setPinnedHrefs((prev) => {
        const already = prev.includes(item.href);
        const next = already ? prev.filter((h) => h !== item.href) : [...prev, item.href];
        writePinnedHrefs(role, next);
        // Announce the change
        setAnnouncement(
          already
            ? `${item.label} unpinned from navigation bar`
            : `${item.label} pinned to navigation bar`
        );
        return next;
      });
    },
    [role]
  );

  // ── Close sheet on Escape ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sheetOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheetOpen(false);
        // Return focus to the trigger
        moreTriggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [sheetOpen]);

  // ── Clear announcement after it is read ──────────────────────────────────
  useEffect(() => {
    if (!announcement) return;
    const id = setTimeout(() => setAnnouncement(""), 3000);
    return () => clearTimeout(id);
  }, [announcement]);

  // ── Determine whether we should skip transitions ──────────────────────────
  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const sheetTransition = prefersReduced
    ? ""
    : "transition-transform duration-300 ease-out";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Live region for pin announcements ──────────────────────────── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* ── Bottom navigation bar ──────────────────────────────────────── */}
      <nav
        aria-label="Mobile bottom navigation"
        className={[
          "fixed bottom-0 left-0 right-0 z-30 sm:hidden",
          "bg-slate-900 text-slate-100",
          "flex items-stretch justify-around",
          "shadow-[0_-1px_0_rgba(255,255,255,0.08)]",
          "pb-[env(safe-area-inset-bottom)]",
          className,
        ].join(" ")}
      >
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.ariaLabel ?? item.label}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex flex-col items-center justify-center gap-0.5",
                "min-h-[44px] min-w-[44px] flex-1 px-1 py-2",
                "text-xs focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
                "focus-visible:ring-offset-slate-900 rounded-sm",
                "transition-colors",
                isActive ? "text-cyan-400" : "text-slate-400 hover:text-slate-100",
              ].join(" ")}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {item.icon}
              </span>
              <span className="leading-tight">{item.label}</span>
              {/* Active underline indicator */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="mt-0.5 h-0.5 w-4 rounded-full bg-cyan-400"
                />
              )}
            </Link>
          );
        })}

        {/* "More" trigger — only rendered when overflow exists */}
        {needsOverflow && (
          <button
            ref={moreTriggerRef}
            id="bottom-nav-more-btn"
            aria-expanded={sheetOpen}
            aria-controls="bottom-nav-overflow-sheet"
            aria-label="More navigation options"
            onClick={() => setSheetOpen(true)}
            className={[
              "flex flex-col items-center justify-center gap-0.5",
              "min-h-[44px] min-w-[44px] flex-1 px-1 py-2",
              "text-xs text-slate-400 hover:text-slate-100",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
              "focus-visible:ring-offset-slate-900 rounded-sm",
              "transition-colors",
              sheetOpen ? "text-cyan-400" : "",
            ].join(" ")}
          >
            <span aria-hidden="true" className="text-lg leading-none">···</span>
            <span className="leading-tight">More</span>
          </button>
        )}
      </nav>

      {/* ── Overflow sheet backdrop + panel ────────────────────────────── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          aria-hidden="false"
        >
          {/* Scrim */}
          <button
            aria-label="Close navigation overflow menu"
            tabIndex={-1}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
            onClick={() => {
              setSheetOpen(false);
              moreTriggerRef.current?.focus();
            }}
          />

          {/* Sheet panel */}
          <FocusTrap>
            <div
              id="bottom-nav-overflow-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="overflow-sheet-title"
              className={[
                "absolute bottom-0 left-0 right-0",
                "bg-slate-900 text-slate-100",
                "rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.4)]",
                "pb-[env(safe-area-inset-bottom)]",
                sheetTransition,
              ].join(" ")}
            >
              {/* Sheet header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/10">
                <h2
                  id="overflow-sheet-title"
                  className="text-sm font-semibold text-slate-100"
                >
                  More navigation
                </h2>
                <button
                  aria-label="Close overflow menu"
                  onClick={() => {
                    setSheetOpen(false);
                    moreTriggerRef.current?.focus();
                  }}
                  className={[
                    "rounded-md p-2 text-slate-400 hover:text-white",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
                    "focus-visible:ring-offset-slate-900",
                    "min-h-[44px] min-w-[44px] flex items-center justify-center",
                  ].join(" ")}
                >
                  {/* ✕ */}
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Pin hint */}
              <p className="px-4 pt-2 pb-1 text-xs text-slate-500">
                Tap 📌 to pin an item to the navigation bar
              </p>

              {/* Overflow item rows */}
              <ul role="list" className="px-2 pb-4">
                {overflowItems.map((item) => {
                  const isPinned = pinnedHrefs.includes(item.href);
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <li
                      key={item.href}
                      className="flex items-center gap-2 rounded-xl hover:bg-white/5"
                    >
                      {/* Nav link */}
                      <Link
                        href={item.href}
                        aria-label={item.ariaLabel ?? item.label}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setSheetOpen(false)}
                        className={[
                          "flex flex-1 items-center gap-3 px-3 py-3",
                          "min-h-[44px] rounded-xl",
                          "focus-visible:outline-none focus-visible:ring-2",
                          "focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
                          "focus-visible:ring-offset-slate-900",
                          isActive ? "text-cyan-400" : "text-slate-200",
                        ].join(" ")}
                      >
                        <span aria-hidden="true" className="text-xl w-7 text-center">
                          {item.icon}
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto text-xs text-cyan-400">Current</span>
                        )}
                      </Link>

                      {/* Pin toggle */}
                      <button
                        aria-label={
                          isPinned
                            ? `Unpin ${item.label} from navigation bar`
                            : `Pin ${item.label} to navigation bar`
                        }
                        aria-pressed={isPinned}
                        onClick={() => togglePin(item)}
                        className={[
                          "mr-2 rounded-lg p-2",
                          "min-h-[44px] min-w-[44px] flex items-center justify-center",
                          "focus-visible:outline-none focus-visible:ring-2",
                          "focus-visible:ring-cyan-400 focus-visible:ring-offset-2",
                          "focus-visible:ring-offset-slate-900",
                          "transition-colors",
                          isPinned
                            ? "text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20"
                            : "text-slate-500 hover:text-slate-200 hover:bg-white/8",
                        ].join(" ")}
                      >
                        <span aria-hidden="true" className="text-base">
                          {isPinned ? "📌" : "➕"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
}
