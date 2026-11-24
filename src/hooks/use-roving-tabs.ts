import { useCallback, useRef, type KeyboardEvent, type RefObject } from "react";

export interface UseRovingTabsOptions<T> {
  /** Ordered tab identifiers. */
  tabs: readonly T[];
  /** Currently selected tab id. */
  activeTab?: T;
  /** Called when keyboard navigation selects a new tab. */
  onSelect: (tab: T) => void;
  /** Writing direction. Defaults to "ltr". */
  dir?: "ltr" | "rtl";
}

export interface UseRovingTabsResult<T> {
  /** Ref callback to attach to each tab button. */
  registerTab: (tab: T) => (node: HTMLButtonElement | null) => void;
  /** Keydown handler for the tablist container. */
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Get the ref for a specific tab (for advanced use). */
  getTabRef: (tab: T) => RefObject<HTMLButtonElement | null>;
}

/**
 * Manages roving tabIndex keyboard navigation for a WAI-ARIA tablist.
 *
 * Supports Automatic Activation: ArrowLeft/ArrowRight move between tabs
 * (wrapping), Home/End jump to the first/last tab, and moving focus to the
 * newly selected tab. In RTL contexts the horizontal arrows are mirrored.
 */
export function useRovingTabs<T>({ tabs, activeTab, onSelect, dir = "ltr" }: UseRovingTabsOptions<T>): UseRovingTabsResult<T> {
  const refs = useRef(new Map<T, HTMLButtonElement>());

  const registerTab = useCallback(
    (tab: T) => (node: HTMLButtonElement | null) => {
      if (node) {
        refs.current.set(tab, node);
      } else {
        refs.current.delete(tab);
      }
    },
    []
  );

  const getTabRef = useCallback((tab: T) => {
    const existing = refs.current.get(tab);
    if (existing) {
      return { current: existing } as RefObject<HTMLButtonElement | null>;
    }
    return {
      get current() {
        return refs.current.get(tab) ?? null;
      },
    } as RefObject<HTMLButtonElement | null>;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (tabs.length === 0) {
        return;
      }

      const forwardKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      const backwardKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

      const isForward = event.key === forwardKey;
      const isBackward = event.key === backwardKey;
      const isHome = event.key === "Home";
      const isEnd = event.key === "End";

      if (!isForward && !isBackward && !isHome && !isEnd) {
        return;
      }

      event.preventDefault();

      const currentIndex = activeTab !== undefined ? tabs.indexOf(activeTab) : -1;
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;

      let nextIndex: number;
      if (isHome) {
        nextIndex = 0;
      } else if (isEnd) {
        nextIndex = tabs.length - 1;
      } else if (isForward) {
        nextIndex = (safeIndex + 1) % tabs.length;
      } else {
        nextIndex = (safeIndex - 1 + tabs.length) % tabs.length;
      }

      const nextTab = tabs[nextIndex];
      if (nextTab === undefined) {
        return;
      }

      onSelect(nextTab);

      const nextNode = refs.current.get(nextTab);
      if (nextNode) {
        nextNode.focus();
      }
    },
    [tabs, activeTab, onSelect, dir]
  );

  return { registerTab, handleKeyDown, getTabRef };
}
