"use client";

import { useState, useCallback, useRef, useEffect, useId } from "react";
import clsx from "clsx";
import { LiveRegion } from "@/components/common/LiveRegion";
import { EmptyStateCard } from "@/app/components/empty-state-card";
import { NotificationItem } from "./notification-item";
import { BulkActionBar } from "./bulk-action-bar";
import { useNotificationSelection } from "./use-notification-selection";
import type { NotificationItem as NotificationItemType } from "./types";

export function NotificationList({
  notifications: initialNotifications,
  onMarkAsRead,
  onArchive,
}: {
  notifications: NotificationItemType[];
  onMarkAsRead?: (ids: string[]) => void;
  onArchive?: (ids: string[]) => void;
}) {
  const [items, setItems] = useState(initialNotifications);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const announceId = useId();

  const {
    selectedIds,
    lastFocusedIndexRef,
    toggleSelect,
    rangeSelect,
    selectAll,
    clearSelection,
    setSelected,
    isSelected,
    selectedCount,
  } = useNotificationSelection();

  const anchorIndexRef = useRef<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems((prevItems) => {
      const overrides = new Map(
        prevItems.map((item) => [
          item.id,
          { read: item.read, archived: (item as NotificationItemType & { archived?: boolean }).archived },
        ]),
      );
      return initialNotifications
        .filter((item) => !overrides.get(item.id)?.archived)
        .map((item) => {
          const override = overrides.get(item.id);
          return override ? { ...item, read: override.read } : item;
        });
    });
  }, [initialNotifications]);

  useEffect(() => {
    setSelected((prev) => {
      const currentIds = new Set(items.map((i) => i.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (currentIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items, setSelected]);

  const someSelected = selectedCount > 0 && selectedCount < items.length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleSelectAllToggle = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(items.map((i) => i.id));
    }
  }, [allSelected, clearSelection, selectAll, items]);

  const handleToggleSelect = useCallback(
    (id: string, index?: number) => {
      if (typeof index === "number") {
        anchorIndexRef.current = index;
      } else {
        const foundIndex = items.findIndex((item) => item.id === id);
        if (foundIndex !== -1) {
          anchorIndexRef.current = foundIndex;
        }
      }
      toggleSelect(id);
    },
    [items, toggleSelect],
  );

  const handleMarkAsRead = useCallback(() => {
    const ids = Array.from(selectedIds);
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, read: true } : item,
      ),
    );
    onMarkAsRead?.(ids);
    clearSelection();
  }, [selectedIds, onMarkAsRead, clearSelection]);

  const handleArchive = useCallback(() => {
    const ids = Array.from(selectedIds);
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    onArchive?.(ids);
    clearSelection();
  }, [selectedIds, onArchive, clearSelection]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const focusedElement = listRef.current?.querySelector<HTMLElement>(
        "[data-index]:focus",
      );
      if (!focusedElement) return;

      const currentIndex = parseInt(focusedElement.dataset.index ?? "", 10);

      if (e.key === "ArrowDown" && e.shiftKey) {
        e.preventDefault();
        const nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) return;
        const anchor = anchorIndexRef.current ?? currentIndex;
        anchorIndexRef.current = anchor;
        const start = Math.min(anchor, nextIndex);
        const end = Math.max(anchor, nextIndex);
        const rangeIds = items.slice(start, end + 1).map((i) => i.id);
        setSelected(new Set(rangeIds));
        lastFocusedIndexRef.current = nextIndex;
        const nextEl = listRef.current?.querySelector<HTMLElement>(
          `[data-index="${nextIndex}"]`,
        );
        nextEl?.focus();
        return;
      }

      if (e.key === "ArrowUp" && e.shiftKey) {
        e.preventDefault();
        const nextIndex = currentIndex - 1;
        if (nextIndex < 0) return;
        const anchor = anchorIndexRef.current ?? currentIndex;
        anchorIndexRef.current = anchor;
        const start = Math.min(anchor, nextIndex);
        const end = Math.max(anchor, nextIndex);
        const rangeIds = items.slice(start, end + 1).map((i) => i.id);
        setSelected(new Set(rangeIds));
        lastFocusedIndexRef.current = nextIndex;
        const nextEl = listRef.current?.querySelector<HTMLElement>(
          `[data-index="${nextIndex}"]`,
        );
        nextEl?.focus();
        return;
      }

      if (e.key === "ArrowDown" && !e.shiftKey) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < items.length) {
          e.preventDefault();
          anchorIndexRef.current = nextIndex;
          lastFocusedIndexRef.current = nextIndex;
          const nextEl = listRef.current?.querySelector<HTMLElement>(
            `[data-index="${nextIndex}"]`,
          );
          nextEl?.focus();
        }
        return;
      }

      if (e.key === "ArrowUp" && !e.shiftKey) {
        const nextIndex = currentIndex - 1;
        if (nextIndex >= 0) {
          e.preventDefault();
          anchorIndexRef.current = nextIndex;
          lastFocusedIndexRef.current = nextIndex;
          const nextEl = listRef.current?.querySelector<HTMLElement>(
            `[data-index="${nextIndex}"]`,
          );
          nextEl?.focus();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        selectAll(items.map((i) => i.id));
        return;
      }

      if (e.key === "Escape") {
        clearSelection();
        return;
      }
    },
    [items, lastFocusedIndexRef, setSelected, selectAll, clearSelection],
  );

  const handleFocusIndex = useCallback(
    (index: number) => {
      lastFocusedIndexRef.current = index;
      if (anchorIndexRef.current === null) {
        anchorIndexRef.current = index;
      }
    },
    [lastFocusedIndexRef],
  );

  if (items.length === 0) {
    return (
      <EmptyStateCard
        eyebrow="NOTIFICATIONS"
        title="All caught up"
        description="You have no notifications at the moment."
        accentLabel="✓"
        status={{ label: "Clear", tone: "success" }}
        guidance={["New notifications will appear here", "You can also check your notification preferences"]}
      />
    );
  }

  return (
    <div>
      <LiveRegion ariaLive="polite">
        {selectedCount > 0
          ? `${selectedCount} notification${selectedCount === 1 ? "" : "s"} selected`
          : "No notifications selected"}
      </LiveRegion>

      <div className="mb-3 flex items-center gap-3">
        <label className="relative flex items-center gap-2 text-sm text-slate-400">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAllToggle}
            className="peer sr-only"
            aria-label={allSelected ? "Deselect all notifications" : "Select all notifications"}
          />
          <span
            className={clsx(
              "inline-flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
              allSelected
                ? "border-cyan-300 bg-cyan-300 text-slate-950"
                : "border-white/20 bg-white/5",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-slate-950",
            )}
            aria-hidden="true"
          >
            {allSelected ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : null}
          </span>
          {allSelected ? "Deselect all" : "Select all"}
        </label>
        {selectedCount > 0 ? (
          <span className="text-xs text-slate-500" aria-live="polite">
            {selectedCount} selected
          </span>
        ) : null}
      </div>

      <ul
        ref={listRef}
        role="group"
        aria-multiselectable="true"
        aria-label="Notifications list"
        onKeyDown={handleKeyDown}
        className="space-y-2"
      >
        {items.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            isSelected={isSelected(notification.id)}
            onToggle={handleToggleSelect}
            index={index}
            onFocusIndex={handleFocusIndex}
          />
        ))}
      </ul>

      {selectedCount > 0 ? (
        <BulkActionBar
          selectedCount={selectedCount}
          onMarkAsRead={handleMarkAsRead}
          onArchive={handleArchive}
        />
      ) : null}
    </div>
  );
}
