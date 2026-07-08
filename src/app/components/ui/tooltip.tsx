// src/app/components/ui/tooltip.tsx
"use client";

import { useState, useRef, useEffect, useId, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

type Placement = "top" | "bottom";

/** Measure collision and return the preferred placement. */
function computePlacement(
  triggerEl: HTMLButtonElement,
  tooltipEl: HTMLDivElement,
  margin = 8,
): Placement {
  const triggerRect = triggerEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  return triggerRect.top - tooltipRect.height - margin > 0 ? "top" : "bottom";
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [placement, setPlacement] = useState<Placement>("top");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = `tooltip-${useId()}`;

  const updatePlacement = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    setPlacement(computePlacement(triggerRef.current, tooltipRef.current));
  };

  const showTooltip = () => {
    setIsVisible(true);
    // Schedule placement after the tooltip becomes visible in DOM
    requestAnimationFrame(() => {
      if (triggerRef.current && tooltipRef.current) {
        setPlacement(computePlacement(triggerRef.current, tooltipRef.current));
      }
    });
  };

  const hideTooltip = () => setIsVisible(false);

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  // Keyboard activation (Enter / Space) and Escape handling
  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTooltip();
    } else if (e.key === "Escape" && isVisible) {
      hideTooltip();
      triggerRef.current?.focus();
    }
  };

  // Click outside cleanup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    };
    if (isVisible) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isVisible]);

  // Touch support – tap toggles tooltip
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    toggleTooltip();
  };

  // Re-measure placement on window resize while visible
  useEffect(() => {
    if (!isVisible) return;
    const handleResize = () => updatePlacement();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [isVisible]);

  // Styling helpers
  const tooltipBaseClasses =
    "absolute z-50 max-w-xs px-3 py-2 text-sm text-white bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg transition-opacity duration-150";
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
        <Info className="w-4 h-4 text-zinc-300" />
      </button>
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`${tooltipBaseClasses} ${placementClasses}`}
          style={{ whiteSpace: "normal" }}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
              placement === "top"
                ? "-bottom-1 left-1/2 -translate-x-1/2 border-b-zinc-800"
                : "-top-1 left-1/2 -translate-x-1/2 border-t-zinc-800"
            }`}
          />
        </div>
      )}
    </div>
  );
}
