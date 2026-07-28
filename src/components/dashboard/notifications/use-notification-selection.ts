import { useState, useCallback, useRef } from "react";

export function useNotificationSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastFocusedIndexRef = useRef<number | null>(null);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const rangeSelect = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const id of ids) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((allIds: string[]) => {
    setSelectedIds(new Set(allIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const setSelected = useCallback((ids: Set<string>) => {
    setSelectedIds(ids);
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const selectedCount = selectedIds.size;

  return {
    selectedIds,
    lastFocusedIndexRef,
    toggleSelect,
    rangeSelect,
    selectAll,
    clearSelection,
    setSelected,
    isSelected,
    selectedCount,
  };
}
