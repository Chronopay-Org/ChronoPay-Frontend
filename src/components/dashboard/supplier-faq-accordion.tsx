"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import clsx from "clsx";
import { ChevronDown, Search, X } from "lucide-react";
import { PanelShell } from "./panel-shell";
import { LiveRegion } from "@/components/common/LiveRegion";

/** A single FAQ entry shown in the supplier profile accordion. */
export type SupplierFaqEntry = {
  /** Stable slug used for deep-linking, e.g. `#faq-refund-policy`. */
  id: string;
  question: string;
  answer: string;
  /** Optional grouping label, e.g. "Pricing", "Policy", "Process". */
  category?: string;
};

export type SupplierFaqAccordionProps = {
  /** FAQ entries to render. */
  entries: readonly SupplierFaqEntry[];
  /** Panel title. */
  title?: string;
  /** Panel eyebrow label. */
  eyebrow?: string;
  /** Supporting description under the title. */
  description?: string;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Prefix used for deep-link anchor ids (`${idPrefix}${entry.id}`). */
  idPrefix?: string;
  /** Entry id to expand and scroll to on mount (deep link target). */
  initialDeepLinkId?: string;
  /** Hide the PanelShell chrome when embedding elsewhere. */
  bare?: boolean;
  /** Optional className on the outer element. */
  className?: string;
};

const DEFAULT_ID_PREFIX = "faq-";

/** Splits `text` into segments, tagging the ones that match `query` (case-insensitive). */
function splitMatches(
  text: string,
  query: string,
): Array<{ text: string; match: boolean }> {
  const trimmed = query.trim();
  if (!trimmed) return [{ text, match: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const segments: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    const idx = lowerText.indexOf(lowerQuery, cursor);
    if (idx === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (idx > cursor) {
      segments.push({ text: text.slice(cursor, idx), match: false });
    }
    segments.push({ text: text.slice(idx, idx + lowerQuery.length), match: true });
    cursor = idx + lowerQuery.length;
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}

/** Renders `text` with occurrences of `query` wrapped in a `<mark>` for highlighting. */
function HighlightedText({ text, query }: { text: string; query: string }): ReactNode {
  const segments = useMemo(() => splitMatches(text, query), [text, query]);
  if (!query.trim()) return <>{text}</>;

  return (
    <>
      {segments.map((segment, index) => {
        const key = `${index}-${segment.text}`;
        if (!segment.match) return <Fragment key={key}>{segment.text}</Fragment>;
        return (
          <mark
            key={key}
            className="rounded bg-amber-300/90 px-0.5 text-slate-900"
          >
            {segment.text}
          </mark>
        );
      })}
    </>
  );
}

function matchesQuery(entry: SupplierFaqEntry, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  return (
    entry.question.toLowerCase().includes(trimmed) ||
    entry.answer.toLowerCase().includes(trimmed) ||
    (entry.category?.toLowerCase().includes(trimmed) ?? false)
  );
}

/**
 * SupplierFaqAccordion — searchable, deep-linkable FAQ accordion for supplier
 * profiles. Follows the WAI-ARIA disclosure (accordion) pattern.
 *
 * Accessibility (WCAG 2.1 AA):
 *  - Each header is a real `<button>` with `aria-expanded` / `aria-controls`.
 *  - Panels use `role="region"` + `aria-labelledby` pointing back at the header.
 *  - Arrow Up/Down move focus between visible headers; Home/End jump to the
 *    first/last visible header, matching the standard accordion keyboard model.
 *  - The search input has a visible label (visually hidden) and the live
 *    result count is announced via a polite live region.
 *  - Matched-term `<mark>` highlighting keeps sufficient contrast in both
 *    light and dark themes and never conveys meaning by color alone (the
 *    result count text carries the same information).
 */
export function SupplierFaqAccordion({
  entries,
  title = "Frequently asked questions",
  eyebrow = "Supplier profile",
  description = "Answers about pricing, policy, and process for working with this supplier.",
  searchPlaceholder = "Search questions and answers…",
  idPrefix = DEFAULT_ID_PREFIX,
  initialDeepLinkId,
  bare = false,
  className,
}: SupplierFaqAccordionProps) {
  const baseId = useId();
  const searchInputId = `${baseId}-search`;

  const resolveInitialDeepLinkId = () => {
    if (initialDeepLinkId) return initialDeepLinkId;
    if (typeof window === "undefined") return undefined;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return undefined;
    const stripped = hash.startsWith(idPrefix) ? hash.slice(idPrefix.length) : hash;
    return entries.some((entry) => entry.id === stripped) ? stripped : undefined;
  };

  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const deepLinked = resolveInitialDeepLinkId();
    return deepLinked ? new Set([deepLinked]) : new Set();
  });
  const headerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const hasScrolledToDeepLink = useRef(false);

  const filteredEntries = useMemo(
    () => entries.filter((entry) => matchesQuery(entry, query)),
    [entries, query],
  );

  // Announcement for screen reader users of the search box, derived from
  // the current query and result count (no effect needed).
  const announcement = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return "";
    const count = filteredEntries.length;
    return count === 0
      ? `No questions match "${trimmed}"`
      : `${count} question${count === 1 ? "" : "s"} match "${trimmed}"`;
  }, [filteredEntries.length, query]);

  // On mount, scroll the deep-linked entry into view once it has rendered open.
  useEffect(() => {
    if (hasScrolledToDeepLink.current) return;
    const deepLinkId = resolveInitialDeepLinkId();
    if (!deepLinkId) return;
    const element = document.getElementById(`${idPrefix}${deepLinkId}`);
    if (element) {
      hasScrolledToDeepLink.current = true;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      const header = headerRefs.current.get(deepLinkId);
      header?.focus({ preventScroll: true });
    }
    // Only run on mount / when entries first become available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, idPrefix]);

  const toggleEntry = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const setDeepLinkHash = useCallback(
    (id: string) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      url.hash = `${idPrefix}${id}`;
      window.history.replaceState(null, "", url.toString());
    },
    [idPrefix],
  );

  const handleHeaderClick = useCallback(
    (id: string) => {
      toggleEntry(id);
      setDeepLinkHash(id);
    },
    [toggleEntry, setDeepLinkHash],
  );

  const handleHeaderKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const visibleIds = filteredEntries.map((entry) => entry.id);
      if (visibleIds.length === 0) return;

      let targetIndex: number | null = null;
      switch (event.key) {
        case "ArrowDown":
          targetIndex = (index + 1) % visibleIds.length;
          break;
        case "ArrowUp":
          targetIndex = (index - 1 + visibleIds.length) % visibleIds.length;
          break;
        case "Home":
          targetIndex = 0;
          break;
        case "End":
          targetIndex = visibleIds.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      const targetId = visibleIds[targetIndex];
      headerRefs.current.get(targetId)?.focus();
    },
    [filteredEntries],
  );

  const clearSearch = useCallback(() => setQuery(""), []);

  const hasResults = filteredEntries.length > 0;
  const showingAll = query.trim().length === 0;

  const content = (
    <div className={clsx("space-y-4", className)}>
      <div className="relative">
        <label htmlFor={searchInputId} className="sr-only">
          Search FAQs
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          id={searchInputId}
          type="search"
          role="searchbox"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          aria-describedby={`${baseId}-result-count`}
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <p id={`${baseId}-result-count`} className="text-xs text-slate-400">
        {showingAll
          ? `Showing all ${entries.length} question${entries.length === 1 ? "" : "s"}`
          : `${filteredEntries.length} of ${entries.length} question${entries.length === 1 ? "" : "s"} match`}
      </p>

      <LiveRegion>{announcement}</LiveRegion>

      {hasResults ? (
        <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-slate-900/40">
          {filteredEntries.map((entry, index) => {
            const isOpen = openIds.has(entry.id);
            const headerId = `${baseId}-header-${entry.id}`;
            const panelId = `${baseId}-panel-${entry.id}`;
            const anchorId = `${idPrefix}${entry.id}`;

            return (
              <li key={entry.id} id={anchorId}>
                <h3 className="m-0">
                  <button
                    type="button"
                    id={headerId}
                    ref={(node) => {
                      if (node) headerRefs.current.set(entry.id, node);
                      else headerRefs.current.delete(entry.id);
                    }}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => handleHeaderClick(entry.id)}
                    onKeyDown={(event) => handleHeaderKeyDown(event, index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-400/40"
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      {entry.category ? (
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
                          {entry.category}
                        </span>
                      ) : null}
                      <span className="break-words">
                        <HighlightedText text={entry.question} query={query} />
                      </span>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={clsx(
                        "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  hidden={!isOpen}
                  className="px-4 pb-4 text-sm leading-6 text-slate-300"
                >
                  {isOpen ? (
                    <p className="break-words">
                      <HighlightedText text={entry.answer} query={query} />
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div
          role="status"
          className="rounded-xl border border-dashed border-white/10 bg-slate-900/30 px-4 py-6 text-center text-sm text-slate-400"
        >
          No questions match &ldquo;{query.trim()}&rdquo;. Try a different term.
        </div>
      )}
    </div>
  );

  if (bare) return content;

  return (
    <PanelShell title={title} eyebrow={eyebrow} description={description}>
      {content}
    </PanelShell>
  );
}
