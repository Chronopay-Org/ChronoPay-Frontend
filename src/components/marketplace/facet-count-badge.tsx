"use client";

import { useEffect, useMemo } from "react";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacetCountBadgeProps {
  /** The raw count to display */
  count: number;
  /**
   * Visual tone:
   * - `default` — neutral accent for unselected facets
   * - `active` — highlighted when the facet chip is selected
   * - `faded` — dimmed when count is zero
   * @default "default"
   */
  tone?: "default" | "active" | "faded";
  /**
   * Overflow threshold. Counts above this display as `${threshold}+`.
   * @default 99
   */
  overflowThreshold?: number;
  /** Custom accessible label. Auto-generated when omitted. */
  "aria-label"?: string;
  /** Additional CSS classes. */
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(count: number, threshold: number): string {
  if (count <= 0) return "0";
  if (count > threshold) return `${threshold}+`;
  return String(count);
}

function makeAriaLabel(count: number, threshold: number): string {
  if (count <= 0) return "No results";
  if (count > threshold) return `Over ${threshold} results`;
  return `${count} ${count === 1 ? "result" : "results"}`;
}

// ─── Tone map ─────────────────────────────────────────────────────────────────

const toneMap: Record<string, string> = {
  default: "bg-white/8 text-slate-400",
  active: "bg-cyan-500/20 text-cyan-300",
  faded: "bg-white/4 text-slate-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FacetCountBadge
 *
 * A compact count badge pinned to marketplace filter facets. Shows how many
 * results match each option, with zero-state and overflow (99+) handling.
 *
 * WCAG 2.1 AA:
 * - `role="status"` + `aria-label` announces the count to screen readers.
 * - Tabular-nums (`tabular-nums`) keeps digit widths stable during animation.
 * - Colour never carries meaning alone — the parent chip provides text context.
 * - Animation respects `prefers-reduced-motion`.
 *
 * @example
 * ```tsx
 * <FacetCountBadge count={42} />
 * <FacetCountBadge count={0} tone="faded" />
 * <FacetCountBadge count={150} overflowThreshold={99} />
 * ```
 */
export function FacetCountBadge({
  count,
  tone = "default",
  overflowThreshold = 99,
  "aria-label": ariaLabel,
  className,
}: FacetCountBadgeProps) {
  // Inject the pop animation keyframe once on first mount
  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById("facet-badge-keyframes")) {
      const style = document.createElement("style");
      style.id = "facet-badge-keyframes";
      style.textContent = `
        @keyframes facet-badge-pop {
          0%   { transform: scale(0.6); opacity: 0.4; }
          50%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const display = useMemo(
    () => formatCount(count, overflowThreshold),
    [count, overflowThreshold],
  );

  const label = ariaLabel ?? makeAriaLabel(count, overflowThreshold);

  return (
    <span
      role="status"
      aria-label={label}
      className={clsx(
        // Layout
        "inline-flex items-center justify-center rounded-full",
        "min-w-[1.25rem] h-[1.125rem] px-1.5",
        // Typography
        "text-[10px] font-bold leading-none tabular-nums",
        // Tone
        toneMap[tone],
        className,
      )}
      data-facet-count-badge=""
      data-count={count}
    >
      {display}
    </span>
  );
}
