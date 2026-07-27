// src/app/components/ui/tooltip.tsx
"use client";

import {
  useState,
  useRef,
  useEffect,
  useId,
  KeyboardEvent as ReactKeyboardEvent,
  FocusEvent as ReactFocusEvent,
  ReactNode,
} from "react";
import { Info } from "lucide-react";

export interface TooltipProps {
  /** Text or rich content (multi-line ReactNode, inline links) */
  content: ReactNode;
  /** Optional custom trigger node; if omitted, defaults to standard Info icon button */
  trigger?: ReactNode;
  /** Optional aria-label override for trigger button */
  ariaLabel?: string;
  /** Additional children rendered inside the tooltip wrapper */
  children?: ReactNode;
  /** Additional class names applied to the container */
  className?: string;
  /** Tooltip visual and structural variant: "standard" or "longform" */
  variant?: "standard" | "longform";
  /** Optional explicit interactive override for mouse hover-intent */
  interactive?: boolean;
}

type Placement = "top" | "bottom";

/** Measure collision and return the preferred placement. */
function computePlacement(
  triggerEl: HTMLElement,
  tooltipEl: HTMLDivElement,
  margin = 8,
): Placement {
  const triggerRect = triggerEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  return triggerRect.top - tooltipRect.height - margin > 0 ? "top" : "bottom";
}

export function Tooltip({
  content,
  trigger,
  ariaLabel = "Help information",
  children,
  className = "",
  variant = "standard",
  interactive,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [placement, setPlacement] = useState<Placement>("top");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = `tooltip-${useId()}`;

  const isLongform = variant === "longform";
  const isInteractive = interactive ?? isLongform;

  const updatePlacement = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    setPlacement(computePlacement(triggerRef.current, tooltipRef.current));
  };

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const showTooltip = () => {
    clearHideTimeout();
    setIsVisible(true);
    requestAnimationFrame(() => {
      if (triggerRef.current && tooltipRef.current) {
        setPlacement(computePlacement(triggerRef.current, tooltipRef.current));
      }
    });
  };

  const hideTooltip = (delay = 0) => {
    clearHideTimeout();
    if (delay > 0 && isInteractive) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, delay);
    } else {
      setIsVisible(false);
    }
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  // Mouse hover handlers for trigger and tooltip surface
  const handleTriggerMouseEnter = () => showTooltip();
  const handleTriggerMouseLeave = () => hideTooltip(isInteractive ? 150 : 0);

  const handleTriggerBlur = (e: ReactFocusEvent) => {
    if (
      tooltipRef.current &&
      e.relatedTarget &&
      tooltipRef.current.contains(e.relatedTarget as Node)
    ) {
      return;
    }
    hideTooltip(isInteractive ? 150 : 0);
  };

  const handleTooltipMouseEnter = () => {
    if (isInteractive) {
      clearHideTimeout();
    }
  };

  const handleTooltipMouseLeave = () => {
    if (isInteractive) {
      hideTooltip(100);
    }
  };

  // Keyboard activation on trigger (Enter / Space / Escape)
  const handleTriggerKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTooltip();
    } else if ((e.key === "Escape" || e.key === "Esc") && isVisible) {
      e.preventDefault();
      hideTooltip();
    }
  };

  // Keyboard Escape handler inside tooltip surface
  const handleTooltipKeyDown = (e: ReactKeyboardEvent) => {
    if ((e.key === "Escape" || e.key === "Esc") && isVisible) {
      e.preventDefault();
      e.stopPropagation();
      hideTooltip();
    }
  };

  // Global Escape key listener when tooltip is visible
  useEffect(() => {
    if (!isVisible) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        setIsVisible(false);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isVisible]);

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

  // Clean up hide timeout on unmount
  useEffect(() => {
    return () => clearHideTimeout();
  }, []);

  // Styling helpers
  const standardClasses =
    "max-w-xs px-3 py-2 text-sm text-white bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg";
  const longformClasses =
    "max-w-sm px-4 py-3 text-sm leading-relaxed text-zinc-100 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl ring-1 ring-white/10";

  const tooltipBaseClasses = `absolute z-50 transition-opacity duration-150 ${
    isLongform ? longformClasses : standardClasses
  }`;

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
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
        onFocus={showTooltip}
        onBlur={handleTriggerBlur}
        onClick={toggleTooltip}
        onKeyDown={handleTriggerKeyDown}
        onTouchStart={handleTouch}
        aria-describedby={isVisible ? tooltipId : undefined}
        aria-label={ariaLabel}
      >
        {trigger ?? <Info className="w-4 h-4 text-zinc-300" />}
      </button>
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          tabIndex={-1}
          className={`${tooltipBaseClasses} ${placementClasses}`}
          style={{ whiteSpace: "normal" }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          onKeyDown={handleTooltipKeyDown}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
              placement === "top"
                ? `-bottom-1 left-1/2 -translate-x-1/2 ${
                    isLongform ? "border-t-zinc-900" : "border-t-zinc-800"
                  }`
                : `-top-1 left-1/2 -translate-x-1/2 ${
                    isLongform ? "border-b-zinc-900" : "border-b-zinc-800"
                  }`
            }`}
          />
        </div>
      )}
    </div>
  );
}
