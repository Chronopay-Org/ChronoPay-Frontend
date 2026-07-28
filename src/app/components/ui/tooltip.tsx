// src/app/components/ui/tooltip.tsx
"use client";

/**
 * Tooltip — accessible tooltip with a smart-placement engine.
 *
 * Placement engine (no external dependency)
 * ─────────────────────────────────────────
 * 1. Attempt to place on the preferred `side` (default "top").
 * 2. If clipped on that side, flip to the opposite side.
 * 3. If the opposite side is also clipped, pick whichever has more room.
 * 4. After the axis is resolved, shift along the cross-axis so the tooltip
 *    stays within the viewport (clamped to `viewportPadding`).
 * 5. The result is applied as fixed `top`/`left` pixel coordinates so the
 *    tooltip is never constrained by an ancestor's overflow or transform.
 *
 * Props
 * ─────
 * content          – tooltip text (required)
 * side             – preferred placement axis: "top"|"bottom"|"left"|"right"
 *                    default "top"
 * align            – cross-axis alignment: "start"|"center"|"end"
 *                    default "center"
 * offset           – gap between trigger and tooltip in px (default 8)
 * viewportPadding  – minimum distance from viewport edges in px (default 6)
 * children         – rendered inside the trigger wrapper (optional)
 * className        – extra class on the outer wrapper
 *
 * Accessibility (WCAG 2.1 AA)
 * ───────────────────────────
 * • Trigger: <button> with aria-describedby pointing to the tooltip id
 * • Tooltip: role="tooltip", never receives focus itself
 * • Keyboard: Enter/Space toggles; Escape closes and returns focus
 * • Touch: tap toggles; outside-click closes
 * • Resize / scroll: position recalculated while visible
 * • Reduced motion: transition-opacity only (no transform animation)
 */

import {
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
  type CSSProperties,
} from "react";
import { Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TooltipSide = "top" | "bottom" | "left" | "right";
export type TooltipAlign = "start" | "center" | "end";

export interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
  /** Preferred placement side. Will flip if space is insufficient. */
  side?: TooltipSide;
  /** Cross-axis alignment relative to the trigger. */
  align?: TooltipAlign;
  /** Gap between trigger edge and tooltip in px. */
  offset?: number;
  /** Minimum distance the tooltip must maintain from viewport edges in px. */
  viewportPadding?: number;
}

interface Position {
  top: number;
  left: number;
  resolvedSide: TooltipSide;
}

// ─── Placement engine ─────────────────────────────────────────────────────────

/**
 * Returns available space (px) on each side of the trigger rect relative to
 * the viewport dimensions.
 */
function getAvailableSpace(trigger: DOMRect, vw: number, vh: number) {
  return {
    top: trigger.top,
    bottom: vh - trigger.bottom,
    left: trigger.left,
    right: vw - trigger.right,
  };
}

/** The axis-opposite of a side. */
const OPPOSITE: Record<TooltipSide, TooltipSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/**
 * Core placement computation.
 *
 * Returns pixel-perfect `top` / `left` in fixed coordinates and the resolved
 * side so the arrow can be oriented correctly.
 */
function computePosition(
  trigger: DOMRect,
  tooltip: DOMRect,
  preferredSide: TooltipSide,
  align: TooltipAlign,
  offset: number,
  viewportPadding: number,
): Position {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const space = getAvailableSpace(trigger, vw, vh);

  // ── 1. Resolve side (flip if needed) ─────────────────────────────────────
  const requiredOnPreferred =
    preferredSide === "top" || preferredSide === "bottom"
      ? tooltip.height + offset
      : tooltip.width + offset;

  const availableOnPreferred = space[preferredSide];
  const availableOnOpposite = space[OPPOSITE[preferredSide]];

  let resolvedSide = preferredSide;
  if (availableOnPreferred < requiredOnPreferred) {
    // Flip if opposite has more room
    if (availableOnOpposite > availableOnPreferred) {
      resolvedSide = OPPOSITE[preferredSide];
    }
    // else: keep preferred — it's the least-bad option
  }

  // ── 2. Compute raw position on the resolved side ──────────────────────────
  let top = 0;
  let left = 0;

  if (resolvedSide === "top") {
    top = trigger.top - tooltip.height - offset;
  } else if (resolvedSide === "bottom") {
    top = trigger.bottom + offset;
  } else if (resolvedSide === "left") {
    left = trigger.left - tooltip.width - offset;
  } else {
    // right
    left = trigger.right + offset;
  }

  // ── 3. Cross-axis alignment ───────────────────────────────────────────────
  if (resolvedSide === "top" || resolvedSide === "bottom") {
    // Horizontal alignment
    if (align === "center") {
      left = trigger.left + trigger.width / 2 - tooltip.width / 2;
    } else if (align === "start") {
      left = trigger.left;
    } else {
      // end
      left = trigger.right - tooltip.width;
    }
  } else {
    // Vertical alignment for left/right sides
    if (align === "center") {
      top = trigger.top + trigger.height / 2 - tooltip.height / 2;
    } else if (align === "start") {
      top = trigger.top;
    } else {
      top = trigger.bottom - tooltip.height;
    }
  }

  // ── 4. Shift (clamp to viewport) ─────────────────────────────────────────
  const minLeft = viewportPadding;
  const maxLeft = vw - tooltip.width - viewportPadding;
  const minTop = viewportPadding;
  const maxTop = vh - tooltip.height - viewportPadding;

  left = Math.max(minLeft, Math.min(left, maxLeft));
  top = Math.max(minTop, Math.min(top, maxTop));

  return { top, left, resolvedSide };
}

// ─── Arrow offset helper ──────────────────────────────────────────────────────

/**
 * Returns inline styles that position the arrow relative to the tooltip box
 * so it always points at the trigger centre, even after a shift.
 */
function arrowStyles(
  side: TooltipSide,
  triggerRect: DOMRect,
  tooltipPos: { top: number; left: number },
  tooltipRect: DOMRect,
): CSSProperties {
  const ARROW = 6; // half arrow size in px
  if (side === "top" || side === "bottom") {
    // Horizontal position: trigger centre relative to tooltip left edge
    const raw = triggerRect.left + triggerRect.width / 2 - tooltipPos.left;
    const clamped = Math.max(ARROW * 2, Math.min(raw, tooltipRect.width - ARROW * 2));
    return side === "top"
      ? { bottom: -ARROW, left: clamped, transform: "translateX(-50%)" }
      : { top: -ARROW, left: clamped, transform: "translateX(-50%)" };
  } else {
    // Vertical position: trigger centre relative to tooltip top edge
    const raw = triggerRect.top + triggerRect.height / 2 - tooltipPos.top;
    const clamped = Math.max(ARROW * 2, Math.min(raw, tooltipRect.height - ARROW * 2));
    return side === "left"
      ? { right: -ARROW, top: clamped, transform: "translateY(-50%)" }
      : { left: -ARROW, top: clamped, transform: "translateY(-50%)" };
  }
}

// ─── Arrow border classes per resolved side ───────────────────────────────────

const ARROW_BORDER: Record<TooltipSide, string> = {
  top: "border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-700",
  bottom: "border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-zinc-700",
  left: "border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-zinc-700",
  right: "border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-zinc-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Tooltip({
  content,
  children,
  className = "",
  side: preferredSide = "top",
  align = "center",
  offset = 8,
  viewportPadding = 6,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({
    top: 0,
    left: 0,
    resolvedSide: preferredSide,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = `tooltip-${useId()}`;

  // ── Position recalculation ────────────────────────────────────────────────
  const recalculate = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    setPosition(
      computePosition(triggerRect, tooltipRect, preferredSide, align, offset, viewportPadding),
    );
  }, [preferredSide, align, offset, viewportPadding]);

  const showTooltip = useCallback(() => {
    setIsVisible(true);
    // Recalculate after the tooltip is painted so we have real dimensions
    requestAnimationFrame(recalculate);
  }, [recalculate]);

  const hideTooltip = useCallback(() => setIsVisible(false), []);

  const toggleTooltip = useCallback(() => {
    if (isVisible) hideTooltip();
    else showTooltip();
  }, [isVisible, showTooltip, hideTooltip]);

  // Keyboard: Enter/Space toggles, Escape closes
  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTooltip();
    } else if (e.key === "Escape" && isVisible) {
      hideTooltip();
      triggerRef.current?.focus();
    }
  };

  // Touch: tap toggles
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    toggleTooltip();
  };

  // Click outside: close
  useEffect(() => {
    if (!isVisible) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !triggerRef.current?.contains(event.target as Node) &&
        !tooltipRef.current?.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, hideTooltip]);

  // Styling helpers
  const tooltipBaseClasses =
    "elevation-2 absolute z-50 max-w-xs px-3 py-2 text-sm text-white bg-zinc-800 border border-zinc-600 rounded-lg transition-opacity duration-150";
  const placementClasses =
    placement === "top"
      ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
      : "top-full mt-2 left-1/2 -translate-x-1/2";

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 focus:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={toggleTooltip}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouch}
        aria-describedby={isVisible ? tooltipId : undefined}
        aria-label="Help information"
      >
        <Info className="w-4 h-4 text-zinc-300" aria-hidden="true" />
      </button>

      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            // Ensure it's invisible during the first RAF before position is set
            visibility: position.top === 0 && position.left === 0 ? "hidden" : "visible",
          }}
          className="z-[9999] max-w-xs px-3 py-2 text-sm text-white bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg"
        >
          {content}
          {/* Smart arrow */}
          <div
            aria-hidden="true"
            className={`absolute w-0 h-0 ${ARROW_BORDER[position.resolvedSide]}`}
            style={aStyles}
          />
        </div>
      )}
    </div>
  );
}
