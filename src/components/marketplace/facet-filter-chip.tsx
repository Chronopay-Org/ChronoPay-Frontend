"use client";

import { useCallback } from "react";
import clsx from "clsx";
import { FacetCountBadge } from "./facet-count-badge";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FacetOption {
  /** Unique identifier for this facet option */
  id: string;
  /** Human-readable label */
  label: string;
  /** Current result count for this facet */
  count: number;
  /** Facet group/category, e.g. "category", "availability", "price" */
  group: string;
}

export interface FacetFilterChipProps {
  /** Facet option data */
  option: FacetOption;
  /** Whether this facet is currently selected */
  isActive: boolean;
  /** Called when the chip is clicked/toggled */
  onToggle: (optionId: string) => void;
  /**
   * Overflow threshold for the count badge.
   * @default 99
   */
  overflowThreshold?: number;
  /** Additional CSS classes. */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FacetFilterChip
 *
 * A toggleable filter chip for marketplace search facets that combines a
 * text label with a live count badge. The chip reflects active/inactive
 * state through colour, border, and `aria-checked`.
 *
 * WCAG 2.1 AA:
 * - `role="checkbox"` + `aria-checked` conveys toggle state to AT.
 * - `aria-label` includes the option label and result count.
 * - Visible focus ring via `focus-visible:ring-2 focus-visible:ring-cyan-300`.
 * - Colour is never the sole differentiator — text label and badge count
 *   provide the same information.
 * - Enter / Space keys toggle the chip.
 *
 * @example
 * ```tsx
 * <FacetFilterChip
 *   option={{ id: "cat-1", label: "Consultation", count: 24, group: "category" }}
 *   isActive={false}
 *   onToggle={(id) => handleToggle(id)}
 * />
 * ```
 */
export function FacetFilterChip({
  option,
  isActive,
  onToggle,
  overflowThreshold = 99,
  className,
}: FacetFilterChipProps) {
  const handleClick = useCallback(() => {
    onToggle(option.id);
  }, [option.id, onToggle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  const badgeTone = isActive ? "active" : option.count === 0 ? "faded" : "default";
  const badgeLabel = `${option.count} ${option.count === 1 ? "result" : "results"} for ${option.label}`;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isActive}
      aria-label={`${option.label} — ${badgeLabel}${isActive ? " (currently selected)" : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        // Layout
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        // Typography
        "text-xs font-semibold uppercase tracking-[0.14em]",
        // Interaction
        "cursor-pointer select-none transition-colors duration-150 motion-reduce:transition-none",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
        // State
        isActive
          ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
        className,
      )}
      data-facet-chip=""
      data-active={isActive || undefined}
    >
      {/* Label */}
      <span className="truncate max-w-[160px]">{option.label}</span>

      {/* Count badge — `badgeTone` already resolves to "faded" when count is 0 */}
      <FacetCountBadge
        count={option.count}
        tone={badgeTone}
        overflowThreshold={overflowThreshold}
        aria-label={badgeLabel}
      />
    </button>
  );
}
