"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FacetCountBadge } from "./facet-count-badge";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveFilter {
  id: string;
  label: string;
  /** Category group, e.g. "category", "availability" */
  group: string;
  /**
   * Optional facet count shown as a badge on the filter chip.
   * When provided, a FacetCountBadge is rendered. Omit to hide the badge.
   */
  count?: number;
}

interface StickyFiltersBarProps {
  /** Currently active filters rendered as chips */
  activeFilters: ActiveFilter[];
  /** Called when a filter chip is removed */
  onRemoveFilter: (filterId: string) => void;
  /** Called when the "Filters" button is clicked to open the full panel */
  onOpenPanel: () => void;
  /** Called to reset all filters */
  onReset: () => void;
  /** Optional label for the filters count */
  filterCount?: number;
  /** Children rendered inside the sticky bar (e.g. search input) */
  children?: ReactNode;
  /** Offset from top in px for sticky positioning (e.g. for fixed headers) */
  topOffset?: number;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * StickyFiltersBar
 *
 * A sticky bar that appears when the user scrolls, showing active filter
 * chips and a "Filters" button. Inline fades on overflow with horizontal
 * scrolling. WCAG 2.1 AA: uses `role="toolbar"`, focus-ring styles,
 * and proper aria labels.
 *
 * @example
 * ```tsx
 * <StickyFiltersBar
 *   activeFilters={filters}
 *   onRemoveFilter={(id) => setFilters(f => f.filter(x => x.id !== id))}
 *   onOpenPanel={() => setPanelOpen(true)}
 *   onReset={() => setFilters([])}
 * />
 * ```
 */
export function StickyFiltersBar({
  activeFilters,
  onRemoveFilter,
  onOpenPanel,
  onReset,
  filterCount,
  children,
  topOffset = 0,
}: StickyFiltersBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const toolbarId = useId();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Scroll detection using IntersectionObserver ────────────────────────

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: `-${topOffset + 1}px 0px 0px 0px`,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [topOffset]);

  // ── Overflow fade detection ────────────────────────────────────────────

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateFades);
      resizeObserver.disconnect();
    };
  }, [updateFades, activeFilters.length]);

  // ── Render ─────────────────────────────────────────────────────────────

  const hasFilters = activeFilters.length > 0;
  const count = filterCount ?? activeFilters.length;

  return (
    <>
      {/* Sentinel for IntersectionObserver — placed above the bar */}
      <div ref={sentinelRef} className="pointer-events-none h-px" aria-hidden="true" />

      <div
        className={`z-40 transition-all duration-200 motion-reduce:transition-none ${
          isStuck
            ? "fixed inset-x-0 shadow-lg backdrop-blur-xl"
            : "relative"
        }`}
        style={{ top: isStuck ? topOffset : undefined }}
      >
        <div
          role="toolbar"
          aria-label="Search filters"
          aria-describedby={`${toolbarId}-desc`}
          className={`mx-auto flex items-center gap-3 px-4 py-2 sm:px-6 ${
            isStuck
              ? "border-b border-white/10 bg-slate-950/90"
              : ""
          }`}
        >
          {/* Filters button */}
          <button
            type="button"
            onClick={onOpenPanel}
            aria-label={`Open filters panel${hasFilters ? ` (${count} active)` : ""}`}
            aria-expanded={false}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path
                d="M2 4h12M4 8h8M6 12h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Filters
            {hasFilters && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500/20 px-1.5 text-[10px] font-bold text-cyan-300">
                {count}
              </span>
            )}
          </button>

          {/* Active filter chips */}
          {hasFilters && (
            <>
              <div className="relative flex-1 overflow-hidden">
                {/* Left fade */}
                {showLeftFade && (
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-950 to-transparent z-10" />
                )}

                <div
                  ref={scrollRef}
                  className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5"
                  role="list"
                  aria-label="Active filters"
                >
                  {activeFilters.map((filter) => (
                    <span
                      key={filter.id}
                      role="listitem"
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-200/20 bg-cyan-400/10 pl-2.5 pr-1 py-0.5 text-xs font-medium text-cyan-300"
                    >
                      <span className="truncate max-w-[120px]">{filter.label}</span>
                      {filter.count !== undefined && (
                        <FacetCountBadge
                          count={filter.count}
                          tone="active"
                          className="ml-0.5"
                        />
                      )}
                      <button
                        type="button"
                        aria-label={`Remove filter: ${filter.label}`}
                        onClick={() => onRemoveFilter(filter.id)}
                        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-cyan-400/60 transition-colors hover:bg-cyan-400/20 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300"
                      >
                        <svg viewBox="0 0 10 10" fill="none" aria-hidden="true" className="h-2.5 w-2.5">
                          <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>

                {/* Right fade */}
                {showRightFade && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-950 to-transparent z-10" />
                )}
              </div>

              {/* Reset all */}
              <button
                type="button"
                onClick={onReset}
                className="shrink-0 text-xs font-medium text-slate-400 underline decoration-slate-500/30 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded"
              >
                Reset
              </button>
            </>
          )}

          {/* Optional children (e.g. search input) */}
          {children}

          {/* Screen-reader description */}
          <span id={`${toolbarId}-desc`} className="sr-only">
            {hasFilters
              ? `${count} filter${count !== 1 ? "s" : ""} active. Use the "Filters" button to change filters or "Reset" to clear all.`
              : "No filters active. Use the Filters button to narrow down results."}
          </span>
        </div>
      </div>

      {/* Spacer when stuck to prevent content jump */}
      {isStuck && hasFilters && (
        <div aria-hidden="true" className="h-12" />
      )}
    </>
  );
}
