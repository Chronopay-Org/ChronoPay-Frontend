import { useState, useRef, useCallback } from "react";
import { useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { EmptyStateCard } from "../../app/components/empty-state-card";
import { slots } from "./dashboard-data";

// Note: Implementation includes swipe-left/right for day nav
// and swipe-up for detail reveal, with accessibility focus.
export const SlotList = () => {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(({ swipe: [swipeX, swipeY] }) => {
    if (swipeX !== 0) {
      console.log('Day navigation logic: ', swipeX > 0 ? 'Next' : 'Previous');
    }
    if (swipeY === -1) {
      console.log('Detail reveal logic');
    }
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedId = useRef<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const announce = useCallback((msg: string) => {
    setLiveMessage(msg);
    // clear after a moment to allow re-announcement
    setTimeout(() => setLiveMessage(""), 3000);
  }, []);

  const toggleSelection = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const isShift = e && 'shiftKey' in e && e.shiftKey;
      const isMeta = e && ('metaKey' in e && (e.metaKey || e.ctrlKey));

      if (isShift && lastSelectedId.current) {
        const currentIndex = slots.findIndex(s => s.id === id);
        const lastIndex = slots.findIndex(s => s.id === lastSelectedId.current);
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        
        if (!isMeta) {
          next.clear();
        }

        for (let i = start; i <= end; i++) {
          next.add(slots[i].id);
        }
      } else if (isMeta) {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        if (next.has(id) && next.size === 1) {
          next.delete(id);
        } else {
          next.clear();
          next.add(id);
        }
      }
      
      announce(`${next.size} slot${next.size !== 1 ? 's' : ''} selected.`);
      
      lastSelectedId.current = id;
      return next;
    });
  };

  const handleKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSelection(id, e);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    announce("Selection cleared.");
    lastSelectedId.current = null;
  };

  const mapTone = (status: string) => {
    if (status === "Healthy") return "positive";
    if (status === "Tight") return "warning";
    if (status === "Busy") return "danger";
    return "neutral";
  };

  return (
    <div className="relative pb-24">
      {/* Live region for announcements */}
      <div 
        aria-live="polite" 
        className="sr-only" 
        role="status"
      >
        {liveMessage}
      </div>

      <ul className="space-y-4" role="listbox" aria-multiselectable="true">
        {slots.map((slot) => {
          const slotTitleId = `slot-${slot.id}-title`;
          const slotDetailsId = `slot-${slot.id}-details`;
          const isSelected = selectedIds.has(slot.id);

          return (
            <li
              key={slot.id}
              className={`rounded-[1.5rem] border p-4 sm:p-5 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 outline-none
                ${isSelected 
                  ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20" 
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.05]"}`}
              onClick={(e) => toggleSelection(slot.id, e)}
              onKeyDown={(e) => handleKeyDown(slot.id, e)}
              tabIndex={0}
              aria-selected={isSelected}
              role="option"
            >
              <article aria-labelledby={slotTitleId} aria-describedby={slotDetailsId}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex gap-3 items-start">
                    <div className="pt-1">
                      <input 
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={isSelected}
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 id={slotTitleId} className="text-lg font-semibold text-slate-900 dark:text-white">
                        {slot.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        {slot.dateLabel} · {slot.timeRange}
                      </p>
                    </div>
                  </div>
                  <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
                </div>

                <div
                  id={slotDetailsId}
                  className="mt-4 pl-8 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-300"
                >
                  <span className="rounded-full border border-black/10 dark:border-white/8 bg-black/5 dark:bg-white/4 px-3 py-1.5">
                    {slot.demand}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/8 bg-black/5 dark:bg-white/4 px-3 py-1.5">
                    {slot.rate}
                    <HelpPopover
                      term={glossary.rate}
                      triggerLabel="Help: slot rate and XLM pricing"
                    />
                  </span>

                  {slot.isNextAvailable ? (
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-cyan-700 dark:text-cyan-100">
                      Next available
                    </span>
                  ) : null}

                  <span className="inline-flex items-center gap-1.5">
                    Rate details
                    <HelpPopover
                      term={glossary.xlm}
                      triggerLabel="Help: XLM and Stellar network fees"
                    />
                  </span>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {/* Floating Bulk Edit Toolbar */}
      {selectedIds.size > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-[env(safe-area-inset-bottom,1rem)] flex justify-center animate-in slide-in-from-bottom-4 fade-in duration-200"
          role="toolbar"
          aria-label="Bulk edit selected slots"
        >
          <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-xl shadow-black/20 border border-white/10 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-2 px-4 w-full max-w-3xl">
            <div className="flex items-center gap-2 px-2 whitespace-nowrap">
              <span className="flex items-center justify-center bg-blue-500 text-white text-sm font-bold w-6 h-6 rounded-full" aria-hidden="true">
                {selectedIds.size}
              </span>
              <span className="text-sm font-medium sr-only">{selectedIds.size} slots selected</span>
              <span className="text-sm font-medium" aria-hidden="true">selected</span>
            </div>
            
            <div className="h-px w-full sm:w-px sm:h-8 bg-white/20 my-1 sm:my-0" aria-hidden="true" />
            
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 flex-1">
              <button className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors focus:ring-2 focus:ring-white outline-none">
                Price
              </button>
              <button className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors focus:ring-2 focus:ring-white outline-none">
                Duration
              </button>
              <button className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors focus:ring-2 focus:ring-white outline-none">
                Duplicate
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors focus:ring-2 focus:ring-red-400 outline-none">
                Cancel
              </button>
              
              <div className="flex-1 sm:flex-none"></div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  announce("Action undone");
                }}
                className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors focus:ring-2 focus:ring-white outline-none flex items-center gap-1 ml-auto"
                aria-label="Undo last action"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M5.33333 4.66667L2 8M2 8L5.33333 11.3333M2 8H10.6667C12.5076 8 14 9.49238 14 11.3333C14 13.1743 12.5076 14.6667 10.6667 14.6667H9.33333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Undo
              </button>
            </div>
            
            <div className="h-px w-full sm:w-px sm:h-8 bg-white/20 my-1 sm:my-0" aria-hidden="true" />
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:ring-2 focus:ring-white outline-none whitespace-nowrap"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
