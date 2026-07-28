"use client";

/**
 * SentimentChipFilter
 *
 * A chip-row filter that buckets reviews into positive / mixed / critical,
 * plus an "All" catch-all. A compact sparkline to the right shows the
 * sentiment trend over the provided time series.
 *
 * URL state
 * ─────────
 * The active bucket is synced to the `sentiment` search-param so the filter
 * survives navigation and deep-linking. When the param is absent or invalid
 * the component defaults to "all".
 *
 * Accessibility (WCAG 2.1 AA)
 * ───────────────────────────
 * - Chip row is a <div role="group"> with a visible group label.
 * - Each chip is a <button> with aria-pressed to communicate toggle state.
 * - Filter changes are announced to screen readers via a polite LiveRegion.
 * - Focus ring uses the established `.focus-ring-cyan` utility.
 * - Colour is never the sole differentiator; each chip carries an icon and a
 *   distinct text label.
 * - Reduced-motion: sparkline transitions are skipped when
 *   prefers-reduced-motion: reduce is active.
 *
 * Responsive / RTL
 * ────────────────
 * - Chips wrap on narrow viewports; sparkline drops below on xs screens.
 * - `dir="auto"` on the wrapper honours RTL document direction.
 */

import {
  useCallback,
  useId,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";
import { ThumbsUp, Minus, ThumbsDown, List } from "lucide-react";
import { LiveRegion } from "@/components/common/LiveRegion";
import { SentimentSparkline } from "./sentiment-sparkline";
import type { SentimentBucket, SentimentCounts, SentimentDataPoint } from "./types";

// ─── Chip config ──────────────────────────────────────────────────────────────

interface ChipConfig {
  bucket: SentimentBucket;
  label: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Tailwind classes applied when the chip is active */
  activeClasses: string;
  /** Tailwind classes applied when the chip is inactive */
  inactiveClasses: string;
  /** Accessible description of what selecting this chip does */
  description: string;
}

const CHIP_CONFIGS: ChipConfig[] = [
  {
    bucket: "all",
    label: "All",
    Icon: List,
    activeClasses:
      "border-cyan-300/50 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]",
    inactiveClasses:
      "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
    description: "Show all reviews",
  },
  {
    bucket: "positive",
    label: "Positive",
    Icon: ThumbsUp,
    activeClasses:
      "border-emerald-400/50 bg-emerald-400/15 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]",
    inactiveClasses:
      "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-400/30 hover:bg-emerald-400/8 hover:text-emerald-100",
    description: "Show only positive reviews",
  },
  {
    bucket: "mixed",
    label: "Mixed",
    Icon: Minus,
    activeClasses:
      "border-amber-400/50 bg-amber-400/15 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]",
    inactiveClasses:
      "border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/30 hover:bg-amber-400/8 hover:text-amber-100",
    description: "Show only mixed reviews",
  },
  {
    bucket: "critical",
    label: "Critical",
    Icon: ThumbsDown,
    activeClasses:
      "border-rose-400/50 bg-rose-400/15 text-rose-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]",
    inactiveClasses:
      "border-white/10 bg-white/5 text-slate-300 hover:border-rose-400/30 hover:bg-rose-400/8 hover:text-rose-100",
    description: "Show only critical reviews",
  },
];

// ─── URL helpers ──────────────────────────────────────────────────────────────

const PARAM_KEY = "sentiment";
const VALID_BUCKETS = new Set<string>(["all", "positive", "mixed", "critical"]);

function parseParam(raw: string | null): SentimentBucket {
  if (raw && VALID_BUCKETS.has(raw)) return raw as SentimentBucket;
  return "all";
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SentimentChipFilterProps {
  /** Review counts per bucket (excluding "all" which is their sum). */
  counts: SentimentCounts;
  /**
   * Time-series data for the sparkline, ordered oldest → newest.
   * Pass an empty array to hide the sparkline entirely.
   */
  trendData: SentimentDataPoint[];
  /**
   * Called whenever the active filter changes.
   * Useful when the parent manages derived state (e.g., filtered review list).
   */
  onChange?: (bucket: SentimentBucket) => void;
  className?: string;
  /**
   * Override the default URL param key. Useful when multiple filters
   * coexist on the same page.
   * @default "sentiment"
   */
  paramKey?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SentimentChipFilter({
  counts,
  trendData,
  onChange,
  className = "",
  paramKey = PARAM_KEY,
}: SentimentChipFilterProps) {
  const groupId = useId();
  const labelId = `${groupId}-label`;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Derive active bucket entirely from URL; fall back to "all".
  // This is the single source of truth — local click state is NOT kept
  // separately to avoid the setState-in-effect / ref-during-render pitfalls
  // flagged by the project ESLint config.
  //
  // In production, router.replace updates the URL and Next.js re-renders with
  // the new searchParams, so active reflects the click immediately.
  // In tests, the mock searchParams.get should be updated to simulate this.
  const active = parseParam(searchParams.get(paramKey));

  const [announcement, setAnnouncement] = useState("");

  const totalCount = counts.positive + counts.mixed + counts.critical;

  // Build count map including "all".
  const countMap: Record<SentimentBucket, number> = useMemo(
    () => ({
      all: totalCount,
      positive: counts.positive,
      mixed: counts.mixed,
      critical: counts.critical,
    }),
    [counts, totalCount],
  );

  const handleSelect = useCallback(
    (bucket: SentimentBucket) => {
      if (bucket === active) return;

      // Build announcement before URL update.
      const cfg = CHIP_CONFIGS.find((c) => c.bucket === bucket)!;
      const count = countMap[bucket];
      const noun = count === 1 ? "review" : "reviews";
      setAnnouncement(
        bucket === "all"
          ? `Showing all ${count} ${noun}`
          : `Filtered to ${cfg.label.toLowerCase()} sentiment — ${count} ${noun}`,
      );

      onChange?.(bucket);

      // Sync to URL without adding a new history entry so back-button
      // behaviour isn't cluttered by each filter click.
      startTransition(() => {
        const next = new URLSearchParams(searchParams.toString());
        if (bucket === "all") {
          next.delete(paramKey);
        } else {
          next.set(paramKey, bucket);
        }
        const qs = next.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [active, countMap, onChange, router, pathname, searchParams, paramKey],
  );

  // Keyboard: arrow keys move focus between chips inside the group.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const buttons = document
        .getElementById(groupId)
        ?.querySelectorAll<HTMLButtonElement>("[data-chip]");
      if (!buttons) return;

      let next: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        next = (index + 1) % buttons.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        next = (index - 1 + buttons.length) % buttons.length;
      } else if (e.key === "Home") {
        next = 0;
      } else if (e.key === "End") {
        next = buttons.length - 1;
      }

      if (next !== null) {
        e.preventDefault();
        buttons[next].focus();
      }
    },
    [groupId],
  );

  const showSparkline = trendData.length > 0;

  return (
    <div
      className={clsx("flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4", className)}
      dir="auto"
      data-testid="sentiment-chip-filter"
    >
      {/* Chip group */}
      <div
        id={groupId}
        role="group"
        aria-labelledby={labelId}
        className="flex flex-wrap items-center gap-2"
      >
        {/* Visually-visible but sr-friendly label */}
        <span
          id={labelId}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 select-none"
        >
          Filter
        </span>

        {CHIP_CONFIGS.map(({ bucket, label, Icon, activeClasses, inactiveClasses, description }, i) => {
          const isActive = active === bucket;
          const count = countMap[bucket];

          return (
            <button
              key={bucket}
              type="button"
              data-chip
              data-testid={`sentiment-chip-${bucket}`}
              aria-pressed={isActive}
              aria-label={`${label}, ${count} ${count === 1 ? "review" : "reviews"}. ${description}`}
              title={description}
              onClick={() => handleSelect(bucket)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={clsx(
                // Base chip styles — match StatusChip / SocialProofBadge patterns
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
                "text-xs font-semibold uppercase tracking-[0.14em]",
                "transition-colors duration-150 cursor-pointer select-none",
                "focus-ring-cyan",
                isActive ? activeClasses : inactiveClasses,
              )}
            >
              <Icon className="h-3 w-3 shrink-0" aria-hidden />
              <span>{label}</span>
              {/* Count badge */}
              <span
                aria-hidden="true"
                className={clsx(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-white/8 text-slate-400",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sparkline trend */}
      {showSparkline && (
        <div
          className="flex shrink-0 items-center gap-2"
          aria-hidden="false"
          data-testid="sparkline-wrapper"
        >
          {/* Divider — hidden on xs where the layout stacks */}
          <span
            className="hidden h-5 w-px bg-white/10 sm:block"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 leading-none">
              Trend
            </span>
            <SentimentSparkline
              data={trendData}
              width={88}
              height={28}
              className="opacity-80"
            />
          </div>
          {/* Compact legend */}
          <dl className="flex flex-col gap-0.5 text-[10px] leading-none text-slate-400">
            <div className="flex items-center gap-1">
              <span
                className="inline-block h-0.5 w-3 rounded-full bg-emerald-400"
                aria-hidden="true"
              />
              <dt className="sr-only">Positive trend line</dt>
              <dd>Pos</dd>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="inline-block h-0.5 w-3 rounded-full bg-amber-400"
                style={{ backgroundImage: "repeating-linear-gradient(90deg, #fbbf24 0 3px, transparent 3px 5px)" }}
                aria-hidden="true"
              />
              <dt className="sr-only">Mixed trend line</dt>
              <dd>Mix</dd>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="inline-block h-0.5 w-3 rounded-full bg-rose-400"
                style={{ backgroundImage: "repeating-linear-gradient(90deg, #f87171 0 1.5px, transparent 1.5px 3.5px)" }}
                aria-hidden="true"
              />
              <dt className="sr-only">Critical trend line</dt>
              <dd>Crit</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Polite screen reader announcement for filter changes */}
      <LiveRegion ariaLive="polite">{announcement}</LiveRegion>
    </div>
  );
}
