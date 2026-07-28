"use client";

/**
 * CommandPalette — context-sensitive command palette triggered by Cmd+K / Ctrl+K.
 *
 * Features:
 *   - Per-route result boosting (e.g., "Transfer" tops on wallet pages)
 *   - Global toggle to disable route-aware ranking
 *   - "Why this?" tooltip on boosted results explaining the ranking
 *   - Full keyboard navigation (Arrow keys, Enter, Escape)
 *   - ARIA combobox pattern (role="combobox" / role="listbox")
 *   - Click-outside and Escape to dismiss
 *   - Focus trap while open
 *   - Responsive: padded card on desktop, full-width on mobile
 *
 * WCAG 2.1 AA:
 *   - role="dialog" with aria-modal="true" on backdrop
 *   - aria-labelledby on heading
 *   - role="combobox" with aria-expanded / aria-controls / aria-activedescendant
 *   - role="listbox" with role="option" and aria-selected
 *   - All interactive elements have visible focus rings
 *   - Keyboard navigable (Arrow keys, Enter, Escape)
 *   - Screen reader announcements via aria-live
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
import {
  Search,
  X,
  Globe,
  Navigation,
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  History,
  Wallet,
  ArrowRightLeft,
  PlusCircle,
  CalendarCheck,
  TrendingUp,
  Settings,
  Receipt,
  Search as SearchIcon,
  Users,
  BarChart3,
  Cog,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useCommandPalette } from "@/hooks/use-command-palette";
import type { RankedCommand } from "@/lib/commands";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  History,
  Wallet,
  ArrowRightLeft,
  PlusCircle,
  CalendarCheck,
  TrendingUp,
  Settings,
  Receipt,
  Search: SearchIcon,
  Users,
  BarChart3,
  Cog,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const {
    isOpen,
    query,
    activeIndex,
    isGlobal,
    results,
    close,
    setQuery,
    setActiveIndex,
    toggleGlobal,
    executeCommand,
  } = useCommandPalette();

  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);

  // Announcement derived from results + query — useMemo avoids setState-in-effect
  const announcement = useMemo(() => {
    if (!isOpen) return "";
    const count = results.length;
    if (count === 0 && query.trim()) {
      return `No results for "${query}"`;
    }
    if (count > 0) {
      return `${count} result${count !== 1 ? "s" : ""} available`;
    }
    return "";
  }, [isOpen, results, query]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const headingId = `${inputId}-heading`;
  const labelId = `${inputId}-label`;

  // ── Focus input when palette opens ────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // ── Reset tooltip when query changes ─────────────────────────────────────
  // Handled inline in updateQuery — no effect needed.

  // ── Click-outside to close ────────────────────────────────────────────────

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    if (isOpen) {
      document.addEventListener("pointerdown", handlePointerDown);
    }
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, close]);

  // ── Adjust activeIndex when results shrink ────────────────────────────────

  useEffect(() => {
    if (activeIndex >= results.length) {
      setActiveIndex(results.length - 1);
    }
  }, [results.length, activeIndex, setActiveIndex]);

  // ── Scroll active item into view ──────────────────────────────────────────

  useEffect(() => {
    if (activeIndex < 0 || !listboxRef.current) return;
    const item = listboxRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── Query change helper ───────────────────────────────────────────────────

  const updateQuery = useCallback(
    (q: string) => {
      setQuery(q);
      setActiveIndex(-1);
      setTooltipIndex(null);
    },
    [setQuery, setActiveIndex],
  );

  // ── Active item id for aria-activedescendant ──────────────────────────────

  const activeItemId =
    activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined;

  // ── Keyboard navigation ───────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0,
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1,
          );
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (activeIndex >= 0 && results[activeIndex]) {
            executeCommand(results[activeIndex]);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          if (query) {
            updateQuery("");
          } else {
            close();
          }
          break;
        }
        case "Tab": {
          e.preventDefault();
          break;
        }
      }
    },
    [results, activeIndex, query, close, executeCommand, updateQuery, setActiveIndex],
  );

  // ── Result click handler ──────────────────────────────────────────────────

  const handleResultClick = useCallback(
    (command: RankedCommand) => {
      executeCommand(command);
    },
    [executeCommand],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Palette panel */}
      <div
        ref={containerRef}
        className={[
          "relative w-full max-w-lg mx-4",
          "rounded-xl border border-white/10",
          "bg-slate-950/95 shadow-2xl backdrop-blur-xl",
          "ring-1 ring-black/20 z-10",
          "max-h-[60vh] flex flex-col",
        ].join(" ")}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* ── Header: Search input ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-white/6 px-4 py-3">
          <Search
            className="h-4 w-4 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <label htmlFor={inputId} id={labelId} className="sr-only">
            Search commands
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search commands…"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-expanded={results.length > 0}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={activeItemId}
            aria-labelledby={labelId}
            className={[
              "h-8 flex-1 bg-transparent text-sm text-white",
              "placeholder:text-slate-500",
              "focus:outline-none",
            ].join(" ")}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                updateQuery("");
                inputRef.current?.focus();
              }}
              className={[
                "rounded-full p-0.5 text-slate-500",
                "hover:text-slate-300",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
                "transition-colors",
              ].join(" ")}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
            <span>Ctrl+K</span>
          </kbd>
        </div>

        {/* ── Results list ─────────────────────────────────────────────── */}
        {results.length > 0 && (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label="Command results"
            className="flex-1 overflow-y-auto py-1 px-1.5"
          >
            {results.map((command, idx) => {
              const Icon = ICON_MAP[command.icon] ?? Navigation;
              const isBoosted = command.appliedBoost > 1 && command.boostReason;
              const showTooltip = tooltipIndex === idx;

              return (
                <li
                  key={command.id}
                  id={`${listboxId}-item-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={[
                    "group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    idx === activeIndex
                      ? "bg-cyan-500/10 text-white"
                      : "text-slate-300 hover:bg-white/6 hover:text-white",
                  ].join(" ")}
                  onClick={() => handleResultClick(command)}
                  onMouseEnter={() => setTooltipIndex(idx)}
                  onMouseLeave={() => setTooltipIndex(null)}
                >
                  {/* Icon */}
                  <Icon
                    className={[
                      "h-4 w-4 shrink-0",
                      idx === activeIndex ? "text-cyan-400" : "text-slate-500",
                    ].join(" ")}
                    aria-hidden="true"
                  />

                  {/* Label + description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {query.trim() ? (
                          <HighlightMatch
                            text={command.label}
                            query={query.trim()}
                          />
                        ) : (
                          command.label
                        )}
                      </span>
                      {/* Route boost badge */}
                      {isBoosted && !isGlobal && (
                        <span
                          className="shrink-0 rounded-full bg-cyan-500/12 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400"
                          aria-label={`Boosted: ${command.boostReason}`}
                        >
                          Top pick
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {command.description}
                    </p>
                  </div>

                  {/* "Why this?" info button for boosted items */}
                  {isBoosted && !isGlobal && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-label={`Why this? ${command.boostReason}`}
                        className={[
                          "rounded-full p-0.5 text-slate-500",
                          "hover:text-cyan-400",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
                          "transition-colors",
                        ].join(" ")}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTooltipIndex(tooltipIndex === idx ? null : idx);
                        }}
                        onMouseEnter={() => setTooltipIndex(idx)}
                        onFocus={() => setTooltipIndex(idx)}
                        onBlur={() => setTooltipIndex(null)}
                      >
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>

                      {/* Tooltip */}
                      {showTooltip && (
                        <div
                          role="tooltip"
                          className={[
                            "absolute right-0 top-full mt-1.5 z-20",
                            "w-56 rounded-lg border border-white/10",
                            "bg-zinc-800 px-3 py-2 text-xs text-white",
                            "shadow-lg",
                          ].join(" ")}
                        >
                          <p className="font-medium text-cyan-400 mb-0.5">
                            Why this?
                          </p>
                          <p>{command.boostReason}</p>
                          <div
                            className={[
                              "absolute -top-1 right-3",
                              "h-2 w-2 rotate-45 bg-zinc-800",
                              "border-l border-t border-white/10",
                            ].join(" ")}
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* ── Empty state (query with no results) ──────────────────────── */}
        {query.trim() !== "" && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Navigation className="h-8 w-8 text-slate-600" aria-hidden="true" />
            <p className="text-sm text-slate-500">
              No commands match &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-slate-600">
              Try a different search term or browse all commands.
            </p>
          </div>
        )}

        {/* ── Zero-query state (no query, no results) ──────────────────── */}
        {query.trim() === "" && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Navigation className="h-8 w-8 text-slate-600" aria-hidden="true" />
            <p className="text-sm text-slate-500">Type to search commands</p>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-white/6 px-3 py-2">
          {/* Global toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={!isGlobal}
            aria-label={`Route-aware ranking: ${isGlobal ? "off" : "on"}`}
            onClick={toggleGlobal}
            className={[
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
              isGlobal
                ? "text-slate-500 hover:text-slate-300"
                : "text-cyan-400 bg-cyan-500/10",
            ].join(" ")}
          >
            <Globe className="h-3 w-3" aria-hidden="true" />
            <span>{isGlobal ? "Global" : "Contextual"}</span>
          </button>

          {/* Keyboard hints */}
          <p className="text-xs text-slate-600">
            <kbd className="font-mono">↑↓</kbd> nav
            &nbsp;&middot;&nbsp;
            <kbd className="font-mono">Enter</kbd> select
            &nbsp;&middot;&nbsp;
            <kbd className="font-mono">Esc</kbd> close
          </p>
        </div>
      </div>

      {/* ── Screen reader announcement ────────────────────────────────── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </div>
  );
}

// ─── HighlightMatch ───────────────────────────────────────────────────────────

/**
 * Renders a label with the matching portion of the query highlighted.
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-cyan-300 font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}