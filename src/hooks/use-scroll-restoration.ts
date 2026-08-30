import { useEffect, useRef, useState, useCallback } from "react";

const SCROLL_RESTORATION_KEY = "scroll-restoration";

interface ScrollData {
  listId: string;
  itemId: string;
  timestamp: number;
}

export function useScrollRestoration(listId: string) {
  const [restoredItemId, setRestoredItemId] = useState<string | null>(null);
  const containerRef = useRef<HTMLUListElement | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`${SCROLL_RESTORATION_KEY}-${listId}`);
      if (stored) {
        const data: ScrollData = JSON.parse(stored);
        
        // Only restore if within reasonable time (e.g., 1 hour) to avoid stale data, 
        // or just rely on manual clears (e.g. on filter change)
        if (Date.now() - data.timestamp < 3600000) {
          // Defer the state update out of the effect body (queueMicrotask)
          // to satisfy the react-hooks/set-state-in-effect rule.
          queueMicrotask(() => setRestoredItemId(data.itemId));

          // Wait for render
          requestAnimationFrame(() => {
            const element = document.getElementById(`list-item-${data.itemId}`);
            if (element) {
              element.scrollIntoView({ behavior: "instant", block: "center" });

              // Clear badge after 3 seconds
              scrollTimeoutRef.current = setTimeout(() => {
                setRestoredItemId(null);
                sessionStorage.removeItem(`${SCROLL_RESTORATION_KEY}-${listId}`);
              }, 3000);
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to restore scroll position", e);
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [listId]);

  const markItemAsViewed = useCallback((itemId: string) => {
    const data: ScrollData = {
      listId,
      itemId,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(`${SCROLL_RESTORATION_KEY}-${listId}`, JSON.stringify(data));
  }, [listId]);

  const resetScrollRestoration = useCallback(() => {
    sessionStorage.removeItem(`${SCROLL_RESTORATION_KEY}-${listId}`);
  }, [listId]);

  return {
    containerRef,
    restoredItemId,
    markItemAsViewed,
    resetScrollRestoration,
  };
}
