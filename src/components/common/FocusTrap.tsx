import { useEffect, useRef } from "react";

/**
 * FocusTrap component ensures that focus stays within its children while mounted.
 * It captures the element that was focused before mounting and returns focus to it on unmount.
 * It also listens for Tab/Shift+Tab to cycle focus within the trap.
 */
export function FocusTrap({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ];
    const getFocusable = () =>
      Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(focusableSelectors.join(",")) ?? []
      ).filter((el) => el.offsetParent !== null);

    const first = () => getFocusable()[0];
    const last = () => getFocusable().slice(-1)[0];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first()) {
          e.preventDefault();
          last()?.focus();
        }
      } else {
        if (document.activeElement === last()) {
          e.preventDefault();
          first()?.focus();
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener("keydown", handleKeyDown);
    // Move focus to the container on mount
    first()?.focus();
    return () => {
      container?.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
