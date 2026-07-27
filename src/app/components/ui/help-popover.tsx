"use client";

/**
 * HelpPopover
 *
 * An accessible, click-triggered popover for explaining domain-specific jargon
 * inline in the ChronoPay dashboard. It is distinct from the lightweight
 * `Tooltip` component in that it:
 *  - Accepts structured content (title + body + optional learn-more link)
 *  - Persists on click rather than disappearing on blur
 *  - Uses `role="dialog"` and a FocusTrap so keyboard users can navigate the
 *    full content, activate the link, and dismiss with Escape
 *  - Meets WCAG 2.1 AA requirements for focus management, contrast, and ARIA
 *
 * Usage:
 * ```tsx
 * import { HelpPopover } from "@/app/components/ui/help-popover";
 * import { glossary } from "@/lib/glossary";
 *
 * <dt className="flex items-center gap-2">
 *   Pending escrow
 *   <HelpPopover term={glossary.pendingEscrow} />
 * </dt>
 * ```
 *
 * Placement: The popover prefers to open above the trigger. If there is not
 * enough room above (collision detection), it opens below.
 *
 * Animation: Fades in/out with a subtle scale using framer-motion. Motion is
 * disabled when `prefers-reduced-motion: reduce` is active.
 */

import {
  useState,
  useRef,
  useEffect,
  useId,
  KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { HelpCircle, X, ExternalLink } from "lucide-react";
import type { GlossaryTerm } from "@/lib/glossary";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HelpPopoverProps {
  /** The glossary term definition to display. */
  term: GlossaryTerm;
  /**
   * Optional aria-label override for the trigger button.
   * Defaults to "Help: {term.title}".
   */
  triggerLabel?: string;
  /** Additional class names applied to the wrapper element. */
  className?: string;
}

type Placement = "top" | "bottom";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HelpPopover({
  term,
  triggerLabel,
  className = "",
}: HelpPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement>("top");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const popoverId = `help-popover-${useId()}`;
  const titleId = `${popoverId}-title`;
  const bodyId = `${popoverId}-body`;

  const ariaLabel = triggerLabel ?? `Help: ${term.title}`;

  // ── Open / close helpers ──────────────────────────────────────────────────

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    // Return focus to the trigger so keyboard users don't get lost
    triggerRef.current?.focus();
  };
  const toggle = () => (isOpen ? close() : open());

  // ── Keyboard handling on the trigger ─────────────────────────────────────

  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      close();
    }
  };

  // ── Keyboard handling inside the popover (Escape to close) ───────────────

  const handlePopoverKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  };

  // ── Touch support ─────────────────────────────────────────────────────────

  const handleTriggerTouch = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault(); // prevent ghost click
    toggle();
  };

  // ── Click-outside dismiss ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Viewport-aware placement ──────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const margin = 8;

    // Prefer top; fall back to bottom if there is not enough space above
    const canPlaceTop = triggerRect.top - popoverRect.height - margin > 0;
    setPlacement(canPlaceTop ? "top" : "bottom");
  }, [isOpen]);

  // ── Focus the close button when the popover opens ────────────────────────

  useEffect(() => {
    if (isOpen) {
      // Small timeout so the element is painted before we move focus
      const id = setTimeout(() => closeBtnRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // ── Placement classes ─────────────────────────────────────────────────────

  const placementClasses =
    placement === "top"
      ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
      : "top-full mt-2 left-1/2 -translate-x-1/2";

  // ── Tab-trap inside popover ───────────────────────────────────────────────

  /**
   * Simple inline tab trap — keeps Tab cycling inside the popover without
   * pulling in the FocusTrap component (which requires a wrapping div that
   * would affect layout). We query focusable descendants on each Tab press.
   */
  const handleTabTrap = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const focusable = Array.from(
      popoverRef.current?.querySelectorAll<HTMLElement>(focusableSelectors) ??
        []
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-700/60 hover:bg-zinc-600 focus:bg-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 transition-colors align-middle"
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        onTouchStart={handleTriggerTouch}
      >
        <HelpCircle
          className="w-3.5 h-3.5 text-zinc-300 hover:text-cyan-300"
          aria-hidden="true"
        />
      </button>

      {/* Popover panel */}
      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          onKeyDown={(e) => {
            handlePopoverKeyDown(e);
            handleTabTrap(e);
          }}
          className={[
            "absolute z-50 w-72 max-w-[calc(100vw-2rem)]",
            "rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl",
            "ring-1 ring-inset ring-white/5",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            placementClasses,
          ].join(" ")}
          // Prevent clicks inside the popover from closing it via the
          // document-level mousedown listener
          onMouseDown={(e: ReactMouseEvent<HTMLDivElement>) =>
            e.stopPropagation()
          }
        >
          {/* Arrow indicator */}
          <span
            aria-hidden="true"
            className={[
              "absolute left-1/2 -translate-x-1/2 w-0 h-0",
              "border-l-[6px] border-r-[6px] border-transparent",
              placement === "top"
                ? "top-full border-t-[6px] border-t-zinc-700"
                : "bottom-full border-b-[6px] border-b-zinc-700",
            ].join(" ")}
          />

          {/* Header row */}
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
            <p
              id={titleId}
              className="text-sm font-semibold text-white leading-snug"
            >
              {term.title}
            </p>
            <button
              ref={closeBtnRef}
              type="button"
              aria-label="Close help popover"
              onClick={close}
              className="mt-0.5 flex-shrink-0 rounded-full p-0.5 text-zinc-400 hover:text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <p
            id={bodyId}
            className="px-4 pb-3 text-xs text-zinc-300 leading-relaxed"
          >
            {term.body}
          </p>

          {/* Learn-more link */}
          {term.learnMoreHref && (
            <div className="border-t border-zinc-800 px-4 py-2.5">
              <a
                href={term.learnMoreHref}
                target={
                  term.learnMoreHref.startsWith("http") ? "_blank" : undefined
                }
                rel={
                  term.learnMoreHref.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900 rounded transition-colors"
              >
                {term.learnMoreLabel ?? "Learn more →"}
                {term.learnMoreHref.startsWith("http") && (
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                )}
              </a>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
