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

export function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [placement, setPlacement] = useState<Placement>("top");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = `tooltip-${useId()}`;

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);
  const toggleTooltip = () => setIsVisible((v) => !v);

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

  // Click outside & Escape cleanup
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
    e.preventDefault(); // prevent simulated mouse event
    toggleTooltip();
  };

  // Positioning – compute collision with viewport edges
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const margin = 8; // space between trigger and tooltip
    // Prefer top placement; if not enough space, place bottom
    const canPlaceTop = triggerRect.top - tooltipRect.height - margin > 0;
    setPlacement(canPlaceTop ? "top" : "bottom");
  }, [isVisible]);

  // Styling helpers
  const tooltipBaseClasses =
    "absolute z-50 max-w-xs px-3 py-2 text-sm text-white bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg transition-opacity duration-150";
  const placementClasses = placement === "top" ? "bottom-full mb-2 left-1/2 -translate-x-1/2" : "top-full mt-2 left-1/2 -translate-x-1/2";

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
            className={`absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${placement === "top" ? "-bottom-1 left-1/2 -translate-x-1/2 border-b-zinc-800" : "-top-1 left-1/2 -translate-x-1/2 border-t-zinc-800"}`}
          />
        </div>
      )}
    </div>
  );
}