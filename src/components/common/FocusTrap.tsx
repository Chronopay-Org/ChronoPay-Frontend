import { useEffect, useRef } from "react";

/**
 * FocusTrap component ensures that focus stays within its children while mounted.
 *
 * Contract (WCAG 2.1 AA, dialog focus management):
 *  - Focus **enters** the trap on mount: the first focusable element gains focus,
 *    or the container itself becomes the focus target when there is nothing
 *    focusable (transient `tabindex="-1"`).
 *  - Tab / Shift+Tab **cycle** within the trap and never escape it.
 *  - Focus **never escapes**: if focus is moved outside the trap while it is
 *    mounted (click, `autofocus` elsewhere, focusout), it is reclaimed.
 *  - On unmount, focus **returns to the element that had it before mounting**;
 *    if that element is gone, it falls back to `[data-focus-fallback]`, then
 *    `main`, then `document.body`.
 *
 * Nested overlays: when several traps are mounted at once, focus moving into an
 * *inner* trap is left alone (no stealing) — only focus that escapes *all*
 * open traps is reclaimed by the top-most one.
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/** Registry of every mounted trap, in mounting order (last = top-most). */
const activeTraps = new Set<HTMLDivElement>();

function isBody(): boolean {
  // `document` may be unavailable during SSR renders.
  return typeof document !== "undefined";
}

function isVisible(el: HTMLElement): boolean {
  // `offsetParent` is authoritative in a real browser layout, but jsdom always
  // reports null, so only trust it when it is meaningful and otherwise fall back
  // to attribute checks for hidden / aria-hidden ancestors.
  if (el.offsetParent !== null) return true;
  let node: HTMLElement | null = el;
  while (node) {
    if (node.hidden) return false;
    if (node.getAttribute("aria-hidden") === "true") return false;
    node = node.parentElement;
  }
  return true;
}

export function FocusTrap({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const previouslyActive = isBody()
      ? (document.activeElement as HTMLElement | null)
      : null;
    // Only treat a *real* ancestor element as the return target; `body` is a
    // non-focusable no-op and would otherwise make the "return" a no-op.
    previouslyFocused.current =
      previouslyActive && previouslyActive !== document.body
        ? previouslyActive
        : null;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(isVisible);

    const first = () => getFocusable()[0];
    const last = () => getFocusable().slice(-1)[0];

    // Focus enters the trap.
    const firstEl = first();
    if (firstEl) {
      firstEl.focus();
    } else if (!container.hasAttribute("tabindex")) {
      // Nothing focusable inside — make the container the tab target so focus
      // is not lost and can be returned to later. (A plain <div>'s default
      // tabIndex is already -1, so guard on the presence of the attribute.)
      container.setAttribute("tabindex", "-1");
      container.focus({ preventScroll: true });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const firstFocusable = first();
      const lastFocusable = last();
      const focusInside = container.contains(document.activeElement);

      if (e.shiftKey) {
        // Shift+Tab from the first element OR from outside the trap wraps to
        // the last element (never leaves the dialog backwards).
        if (document.activeElement === firstFocusable || !focusInside) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab from the last element OR from outside the trap wraps to the first.
        if (document.activeElement === lastFocusable || !focusInside) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    // Containment: never allow focus to escape while mounted.
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as Node | null;
      if (!target || container.contains(target)) return;

      // Leave focus alone if it moved into a nested open trap (stacking).
      for (const other of activeTraps) {
        if (other !== container && other.contains(target)) return;
      }

      const focusable = getFocusable();
      if (focusable.length === 0) {
        container.focus({ preventScroll: true });
        return;
      }
      first()?.focus({ preventScroll: true });
    };

    activeTraps.add(container);
    container.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn, true);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn, true);
      activeTraps.delete(container);

      const toFocus = previouslyFocused.current;
      if (toFocus && document.body.contains(toFocus)) {
        toFocus.focus();
        return;
      }

      // Fallback to the nearest logical anchor if the triggering element is gone.
      const fallback =
        document.querySelector<HTMLElement>("[data-focus-fallback]") ||
        document.querySelector<HTMLElement>("main") ||
        document.body;
      if (fallback === document.body) {
        fallback.focus?.();
      } else if (fallback.tabIndex === -1 && !fallback.hasAttribute("tabindex")) {
        fallback.setAttribute("tabindex", "-1");
        fallback.focus({ preventScroll: true });
      } else {
        fallback.focus({ preventScroll: true });
      }
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}