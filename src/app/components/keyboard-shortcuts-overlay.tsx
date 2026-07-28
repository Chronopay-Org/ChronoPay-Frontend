"use client";

/**
 * KeyboardShortcutsOverlay
 *
 * A searchable, filterable reference dialog listing every keyboard shortcut
 * available in the ChronoPay dashboard. Addresses issue #315: "Design a
 * keyboard shortcut overlay searchable command index".
 *
 * Behaviour
 * ─────────
 * - Opened via the "Keyboard shortcuts" button in the dashboard header, or the
 *   global Ctrl+/ shortcut registered in `dashboard-shell.tsx`.
 * - A search box filters shortcuts by description or key label as the user
 *   types.
 * - Category filter chips (All / Navigation / Search / Actions / General)
 *   narrow the list further; search and category combine (AND).
 * - Arrow Up/Down move a roving highlight through the visible results
 *   (`aria-activedescendant`), so keyboard users can scan matches without
 *   leaving the search field. The first result is highlighted automatically
 *   whenever the result set changes.
 * - No matches renders a descriptive empty state instead of an empty list.
 *
 * Accessibility (WCAG 2.1 AA)
 * ───────────────────────────
 * - `role="dialog"` `aria-modal="true"` `aria-labelledby` on the panel.
 * - `FocusTrap` keeps Tab/Shift+Tab cycling inside the dialog while open, and
 *   restores focus to the previously-focused element (the trigger) on close.
 * - Escape closes the dialog.
 * - Category chips are a `role="group"` with `aria-pressed` per chip and
 *   arrow-key roving focus (Left/Right/Home/End), matching the
 *   `SentimentChipFilter` convention used elsewhere in the dashboard.
 * - Search input uses the combobox/listbox pattern (`aria-controls`,
 *   `aria-activedescendant`, `aria-expanded`) consistent with `HeaderSearch`
 *   and `AccountSwitcher`.
 * - Result count and filter changes are announced via a polite live region.
 * - Colour is never the only differentiator — the active chip and highlighted
 *   row both carry a border/background change plus retained text contrast.
 *
 * Responsive
 * ──────────
 * - Panel is a centered, max-width dialog on desktop and a full-width sheet
 *   with safe margins on narrow viewports; chips wrap; the list scrolls
 *   independently of the header/search/chip row.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Search, X, Command } from "lucide-react";
import { FocusTrap } from "@/components/common/FocusTrap";
import { LiveRegion } from "@/components/common/LiveRegion";
import {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  filterShortcuts,
  type ShortcutCategory,
} from "@/lib/keyboard-shortcuts";

// ─── Props ──────────────────────────────────────────────────────────────────

export interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryFilter = ShortcutCategory | "All";

const CATEGORY_FILTERS: CategoryFilter[] = ["All", ...SHORTCUT_CATEGORIES];

// ─── Component ────────────────────────────────────────────────────────────────

export function KeyboardShortcutsOverlay({
  isOpen,
  onClose,
}: KeyboardShortcutsOverlayProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const listboxId = `${dialogId}-listbox`;

  const results = useMemo(
    () => filterShortcuts(KEYBOARD_SHORTCUTS, category, query),
    [category, query],
  );

  // Reset the roving highlight whenever the result set changes so the first
  // match is always the active one ("focus first result"). Adjusting state
  // during render (guarded by a snapshot of the previous key in state) is
  // the documented React pattern and avoids the extra render + cascading
  // update that doing this in an effect would cause.
  const resultsKey = `${category}|${query}`;
  const [lastResultsKey, setLastResultsKey] = useState(resultsKey);
  if (lastResultsKey !== resultsKey) {
    setLastResultsKey(resultsKey);
    if (activeIndex !== 0) setActiveIndex(0);
  }

  // Reset transient state each time the dialog transitions from closed to
  // open. Same render-time-adjustment pattern as above.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      if (query !== "") setQuery("");
      if (category !== "All") setCategory("All");
      if (activeIndex !== 0) setActiveIndex(0);
    }
  }

  // Focus the search field once the dialog has opened (DOM side effect, so
  // an effect is appropriate here).
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Keep the highlighted row scrolled into view.
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  const handleCategorySelect = useCallback((next: CategoryFilter) => {
    setCategory(next);
  }, []);

  // Arrow-key roving focus across the category chip row.
  const handleChipKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const chips = Array.from(
        e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
          "[data-shortcut-chip]",
        ) ?? [],
      );
      if (chips.length === 0) return;

      let next: number | null = null;
      if (e.key === "ArrowRight") next = (index + 1) % chips.length;
      else if (e.key === "ArrowLeft")
        next = (index - 1 + chips.length) % chips.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = chips.length - 1;

      if (next !== null) {
        e.preventDefault();
        chips[next].focus();
      }
    },
    [],
  );

  // Arrow-key navigation through the results list from the search input.
  const handleInputKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    },
    [results.length],
  );

  if (!isOpen) return null;

  const activeItemId =
    results.length > 0 ? `${listboxId}-item-${activeIndex}` : undefined;

  const resultCountLabel =
    results.length === 0
      ? "No shortcuts match your search"
      : `${results.length} shortcut${results.length === 1 ? "" : "s"} found`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[8vh] sm:pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ring-1 ring-black/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <h2
              id={titleId}
              className="flex items-center gap-2 text-sm font-semibold text-white"
            >
              <Command className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              Keyboard shortcuts
            </h2>
            <button
              type="button"
              aria-label="Close keyboard shortcuts"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-white/6 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 pt-4">
            <label htmlFor={`${dialogId}-search`} className="sr-only">
              Search keyboard shortcuts
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                id={`${dialogId}-search`}
                type="search"
                role="combobox"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search shortcuts…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                aria-expanded={results.length > 0}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-activedescendant={activeItemId}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Category filter chips */}
          <div
            role="group"
            aria-label="Filter shortcuts by category"
            className="flex flex-wrap items-center gap-2 px-5 pt-3"
          >
            {CATEGORY_FILTERS.map((cat, index) => {
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  data-shortcut-chip
                  data-testid={`shortcut-category-${cat}`}
                  aria-pressed={isActive}
                  onClick={() => handleCategorySelect(cat)}
                  onKeyDown={(e) => handleChipKeyDown(e, index)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                    isActive
                      ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Results */}
          <div className="px-2 py-3">
            {results.length > 0 ? (
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-label="Keyboard shortcuts"
                className="max-h-80 overflow-y-auto px-1"
              >
                {results.map((shortcut, index) => (
                  <li
                    key={shortcut.id}
                    id={`${listboxId}-item-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={[
                      "flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      index === activeIndex
                        ? "bg-cyan-500/10 text-white"
                        : "text-slate-300",
                    ].join(" ")}
                  >
                    <span className="flex-1">{shortcut.description}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-white">
                  No shortcuts found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try a different search term or choose another category.
                </p>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-white/10 px-5 py-2.5">
            <p className="text-xs text-slate-600">
              <kbd className="font-mono">↑↓</kbd> navigate
              &nbsp;&middot;&nbsp;
              <kbd className="font-mono">Esc</kbd> close
            </p>
          </div>
        </div>
      </FocusTrap>

      {/* Screen-reader announcement of result count on every filter change */}
      <LiveRegion ariaLive="polite">{resultCountLabel}</LiveRegion>
    </div>
  );
}
