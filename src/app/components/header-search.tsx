"use client";

/**
 * HeaderSearch -- search affordance for the ChronoPay dashboard header.
 *
 * Features:
 *   - Expandable search input triggered by a search icon button
 *   - Dropdown panel with:
 *       - Recent searches (persisted in localStorage) with individual remove buttons
 *       - "Clear all" recents action
 *       - Live suggestion list filtered by current query
 *   - Full keyboard navigation (Arrow keys, Enter to submit, Escape to close, Tab to close)
 *   - ARIA combobox pattern (role="combobox" on the input / role="listbox" on dropdown)
 *   - Click-outside to dismiss
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { useSearch } from "@/hooks/use-search";

// Types

interface ListItem {
  kind: "recent" | "suggestion";
  label: string;
}

// Component

export function HeaderSearch() {
  const {
    query,
    setQuery,
    recentSearches,
    suggestions,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  } = useSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const inputId = useId();
  const listboxId = `${inputId}-listbox`;

  /**
   * Wrap setQuery so that changing the query always resets the active list
   * index. Avoids a separate useEffect that would trigger an extra render.
   */
  const updateQuery = useCallback(
    (q: string) => {
      setQuery(q);
      setActiveIndex(-1);
    },
    [setQuery],
  );

  // Derived list for keyboard navigation -- memoized to stabilise useCallback deps
  const listItems = useMemo<ListItem[]>(
    () => [
      ...(query.trim() === ""
        ? recentSearches.map((r) => ({ kind: "recent" as const, label: r }))
        : []),
      ...suggestions.map((s) => ({ kind: "suggestion" as const, label: s })),
    ],
    [query, recentSearches, suggestions],
  );

  const isPanelVisible =
    isOpen && (recentSearches.length > 0 || suggestions.length > 0);

  const showEmptyHint =
    isOpen && query.trim() === "" && recentSearches.length === 0;

  // Open / close helpers
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      return !prev;
    });
    setActiveIndex(-1);
  }, []);

  // Submit a search term
  const submitSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      addRecentSearch(trimmed);
      updateQuery(trimmed);
      close();
      // In a real app, trigger navigation / search results here.
    },
    [addRecentSearch, close, updateQuery],
  );

  // Click-outside to close
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

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (!isOpen) {
            open();
            return;
          }
          setActiveIndex((prev) =>
            prev < listItems.length - 1 ? prev + 1 : 0,
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : listItems.length - 1,
          );
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (activeIndex >= 0 && listItems[activeIndex]) {
            submitSearch(listItems[activeIndex].label);
          } else if (query.trim()) {
            submitSearch(query);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          if (query) {
            updateQuery("");
          } else {
            close();
            inputRef.current?.blur();
          }
          break;
        }
        case "Tab": {
          close();
          break;
        }
      }
    },
    [isOpen, listItems, activeIndex, query, open, close, submitSearch, updateQuery],
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listboxRef.current) return;
    const item = listboxRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const activeItemId =
    activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Collapsed: search icon toggle */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleExpand}
          aria-label="Open search"
          className="rounded-full p-2 text-slate-400 hover:bg-white/6 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {/* Expanded: input + dropdown */}
      {isOpen && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <label htmlFor={inputId} className="sr-only">
              Search ChronoPay
            </label>
            <div className="relative flex items-center">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              {/* Input carries all combobox ARIA */}
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                role="combobox"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search..."
                value={query}
                onChange={(e) => {
                  updateQuery(e.target.value);
                  if (!isOpen) open();
                }}
                onFocus={open}
                onKeyDown={handleKeyDown}
                aria-expanded={isPanelVisible || showEmptyHint}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-activedescendant={activeItemId}
                className="
                  h-8 w-48 rounded-full border border-white/10 bg-white/6 pl-8 pr-7
                  text-sm text-white placeholder:text-slate-500
                  focus:border-cyan-300/40 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950
                  transition-[width,background-color,border-color] duration-200
                  sm:w-56
                "
              />
              {/* Clear input button */}
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    updateQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300 transition-colors"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Dropdown panel */}
            {(isPanelVisible || showEmptyHint) && (
              <div
                className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl ring-1 ring-black/20 z-50"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Recent searches header -- shown when query is empty */}
                {query.trim() === "" && recentSearches.length > 0 && (
                  <div className="flex items-center justify-between px-3 pt-3 pb-1">
                    <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Recent
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-xs text-slate-500 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300 rounded transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* Suggestions header -- shown when query has text */}
                {query.trim() !== "" && suggestions.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
                    <TrendingUp className="h-3 w-3 text-slate-500" aria-hidden="true" />
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Suggestions
                    </span>
                  </div>
                )}

                {/* Empty recents hint */}
                {showEmptyHint && (
                  <p className="px-3 py-4 text-sm text-slate-500 text-center">
                    No recent searches yet.
                  </p>
                )}

                {/* Listbox */}
                {listItems.length > 0 && (
                  <ul
                    ref={listboxRef}
                    id={listboxId}
                    role="listbox"
                    aria-label="Search suggestions"
                    className="max-h-64 overflow-y-auto py-1 px-1"
                  >
                    {listItems.map((item, idx) => (
                      <li
                        key={`${item.kind}-${item.label}`}
                        id={`${listboxId}-item-${idx}`}
                        role="option"
                        aria-selected={idx === activeIndex}
                        className={[
                          "group flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                          idx === activeIndex
                            ? "bg-cyan-500/10 text-white"
                            : "text-slate-300 hover:bg-white/6 hover:text-white",
                        ].join(" ")}
                        onPointerDown={(e) => {
                          // Prevent input blur before click fires
                          e.preventDefault();
                        }}
                        onClick={() => submitSearch(item.label)}
                      >
                        {/* Icon */}
                        {item.kind === "recent" ? (
                          <Clock
                            className="h-3.5 w-3.5 shrink-0 text-slate-500"
                            aria-hidden="true"
                          />
                        ) : (
                          <Search
                            className="h-3.5 w-3.5 shrink-0 text-slate-500"
                            aria-hidden="true"
                          />
                        )}

                        {/* Label with query highlight */}
                        <span className="flex-1 truncate">
                          {item.kind === "suggestion" && query.trim() ? (
                            <HighlightMatch
                              text={item.label}
                              query={query.trim()}
                            />
                          ) : (
                            item.label
                          )}
                        </span>

                        {/* Remove button for recents */}
                        {item.kind === "recent" && (
                          <button
                            type="button"
                            aria-label={`Remove "${item.label}" from recent searches`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(item.label);
                            }}
                            className="ml-auto shrink-0 rounded-full p-0.5 text-slate-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300 transition-[opacity,color]"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* No suggestions found */}
                {query.trim() !== "" && suggestions.length === 0 && (
                  <p className="px-3 py-4 text-sm text-slate-500 text-center">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                )}

                {/* Keyboard hint footer */}
                <div className="border-t border-white/6 px-3 py-2">
                  <p className="text-xs text-slate-600">
                    <kbd className="font-mono">up/down</kbd> navigate
                    &nbsp;&middot;&nbsp;
                    <kbd className="font-mono">Enter</kbd> select
                    &nbsp;&middot;&nbsp;
                    <kbd className="font-mono">Esc</kbd> close
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Collapse / close button */}
          <button
            type="button"
            onClick={() => {
              updateQuery("");
              close();
            }}
            aria-label="Close search"
            className="rounded-full p-2 text-slate-400 hover:bg-white/6 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

// HighlightMatch

/**
 * Renders a suggestion label with the matching portion of the query highlighted.
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
