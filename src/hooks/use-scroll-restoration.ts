import { useEffect, useRef, useState, useCallback } from "react";
import { reportError } from "@/app/dashboard/reportError";

const SCROLL_RESTORATION_KEY = "scroll-restoration";

interface ScrollData {
  listId: string;
  itemId: string;
  timestamp: number;
}

export function useScrollRestoration(listId: string) {
  const [restoredItemId, setRestoredItemId] = useState<string | null>(null);
  const containerRef = useRef<HTMLUListElement | HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`${SCROLL_RESTORATION_KEY}-${listId}`);
      if (stored) {
        const data: ScrollData = JSON.parse(stored);
        
        // Only restore if within reasonable time (e.g., 1 hour) to avoid stale data, 
        // or just rely on manual clears (e.g. on filter change)
        if (Date.now() - data.timestamp < 3600000) {
          // Wait for render
          requestAnimationFrame(() => {
            setRestoredItemId(data.itemId);
            const element = document.getElementById(`list-item-${data.itemId}`);
            if (element) {
              element.scrollIntoView({ behavior: "instant", block: "center" });

              // Clear badge after 3 seconds
              scrollTimeoutRef.current = setTimeout(() => {
                setRestoredItemId(null);
                try {
                  sessionStorage.removeItem(`${SCROLL_RESTORATION_KEY}-${listId}`);
                } catch (e) {
                  reportError(e, "Failed to clear scroll restoration");
                }
              }, 3000);
            }
          });
        }
      }
    } catch (e) {
      reportError(e, "Failed to restore scroll position");
    }

    return () => {
      if (scrollTimeoutRef.current !== undefined) {
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
    try {
      sessionStorage.setItem(`${SCROLL_RESTORATION_KEY}-${listId}`, JSON.stringify(data));
    } catch (e) {
      reportError(e, "Failed to save scroll restoration");
    }
  }, [listId]);

  const resetScrollRestoration = useCallback(() => {
    try {
      sessionStorage.removeItem(`${SCROLL_RESTORATION_KEY}-${listId}`);
    } catch (e) {
      reportError(e, "Failed to reset scroll restoration");
    }
  }, [listId]);

  return {
    containerRef,
    restoredItemId,
    markItemAsViewed,
    resetScrollRestoration,
  };
}
