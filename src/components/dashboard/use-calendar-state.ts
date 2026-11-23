"use client";

import { useState, useCallback, useMemo } from "react";
import { addMonths } from "@/utils/date";
import { useHeatmapPreference } from "@/hooks/use-heatmap-preference";
import type { CalendarViewMode } from "./calendar-view-toggle";
import type { Slot } from "./types";

/**
 * Normalizes a Date to local midnight (00:00:00.000).
 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Returns the first day of the month for the given date at local midnight.
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Adds (or subtracts) a number of days to a date, returning a new Date at local midnight.
 */
export function addDays(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
}

/**
 * Formats a Date as a local ISO date key (YYYY-MM-DD).
 */
export function toISODateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses an ISO date string (YYYY-MM-DD) into a local midnight Date.
 * Returns null if the string is not a valid YYYY-MM-DD date.
 */
export function parseISODateKey(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

/**
 * Checks whether two Dates represent the same calendar day in local time.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Resolves a Slot to an ISO date key (YYYY-MM-DD).
 * Prefers `slot.date`; falls back to parsing relative labels ("today", "tomorrow")
 * or ISO/parseable date strings in `slot.dateLabel` relative to `referenceDate`.
 */
export function resolveSlotDateKey(
  slot: Slot,
  referenceDate: Date = new Date()
): string | null {
  if (slot.date) {
    const parsed = parseISODateKey(slot.date);
    if (parsed) return toISODateKey(parsed);
  }

  const label = slot.dateLabel?.trim();
  if (!label) return null;

  const lower = label.toLowerCase();
  if (lower === "today") {
    return toISODateKey(referenceDate);
  }
  if (lower === "tomorrow") {
    return toISODateKey(addDays(referenceDate, 1));
  }

  const isoFromLabel = parseISODateKey(label);
  if (isoFromLabel) {
    return toISODateKey(isoFromLabel);
  }

  const parsedLabel = new Date(label);
  if (!Number.isNaN(parsedLabel.getTime())) {
    return toISODateKey(parsedLabel);
  }

  return null;
}

/**
 * Groups an array of slots by their resolved ISO date key (YYYY-MM-DD).
 */
export function groupSlotsByDate(
  slots: Slot[],
  referenceDate: Date = new Date()
): Map<string, Slot[]> {
  const grouped = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = resolveSlotDateKey(slot, referenceDate);
    if (!key) continue;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(slot);
    } else {
      grouped.set(key, [slot]);
    }
  }
  return grouped;
}

/**
 * Computes a Map<YYYY-MM-DD, number> of slot counts from grouped slots.
 */
export function buildAvailabilityMap(
  slotsByDate: Map<string, Slot[]>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const [key, daySlots] of slotsByDate.entries()) {
    counts.set(key, daySlots.length);
  }
  return counts;
}

/**
 * Returns the 7 days (Sunday through Saturday) of the week containing `date`.
 */
export function getWeekDays(date: Date): Date[] {
  const base = startOfDay(date);
  const startOfWeek = addDays(base, -base.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
}

export interface UseCalendarStateOptions {
  /** Initial selected date (defaults to today) */
  initialDate?: Date;
  /** Initial view mode (defaults to "month") */
  initialViewMode?: CalendarViewMode;
  /** Controlled selected date */
  selectedDate?: Date;
  /** Callback when selected date changes */
  onDateSelect?: (date: Date) => void;
  /** Controlled view mode */
  viewMode?: CalendarViewMode;
  /** Callback when view mode changes */
  onViewModeChange?: (mode: CalendarViewMode) => void;
  /** Optional localStorage key for heatmap preference */
  heatmapStorageKey?: string;
}

export interface CalendarState {
  selectedDate: Date;
  visibleMonth: Date;
  viewMode: CalendarViewMode;
  heatmapEnabled: boolean;
  selectDate: (date: Date) => void;
  setVisibleMonth: (month: Date) => void;
  navigateMonth: (delta: number) => void;
  setViewMode: (mode: CalendarViewMode) => void;
  setHeatmapEnabled: (enabled: boolean) => void;
  goToToday: () => void;
}

/**
 * Shared calendar state hook coordinating selected date, visible month,
 * view mode, and persisted heatmap preference across MonthCalendarView,
 * CalendarAgendaView, MiniCalendarNavigator, and week/day views.
 */
export function useCalendarState(
  options: UseCalendarStateOptions = {}
): CalendarState {
  const {
    initialDate,
    initialViewMode = "month",
    selectedDate: controlledSelectedDate,
    onDateSelect,
    viewMode: controlledViewMode,
    onViewModeChange,
    heatmapStorageKey,
  } = options;

  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(() =>
    startOfDay(initialDate ?? new Date())
  );

  const activeSelectedDate = useMemo(
    () =>
      controlledSelectedDate
        ? startOfDay(controlledSelectedDate)
        : internalSelectedDate,
    [controlledSelectedDate, internalSelectedDate]
  );

  const [visibleMonth, setVisibleMonthState] = useState<Date>(() =>
    startOfMonth(controlledSelectedDate ?? initialDate ?? new Date())
  );

  const [internalViewMode, setInternalViewMode] =
    useState<CalendarViewMode>(initialViewMode);

  const activeViewMode = controlledViewMode ?? internalViewMode;

  const { enabled: heatmapEnabled, toggle: setHeatmapEnabled } =
    useHeatmapPreference(heatmapStorageKey);

  const selectDate = useCallback(
    (date: Date) => {
      const normalized = startOfDay(date);
      if (!controlledSelectedDate) {
        setInternalSelectedDate(normalized);
      }
      setVisibleMonthState(startOfMonth(normalized));
      onDateSelect?.(normalized);
    },
    [controlledSelectedDate, onDateSelect]
  );

  const setVisibleMonth = useCallback((month: Date) => {
    setVisibleMonthState(startOfMonth(month));
  }, []);

  const navigateMonth = useCallback((delta: number) => {
    setVisibleMonthState((prev) => startOfMonth(addMonths(prev, delta)));
  }, []);

  const setViewMode = useCallback(
    (mode: CalendarViewMode) => {
      if (controlledViewMode === undefined) {
        setInternalViewMode(mode);
      }
      onViewModeChange?.(mode);
    },
    [controlledViewMode, onViewModeChange]
  );

  const goToToday = useCallback(() => {
    selectDate(new Date());
  }, [selectDate]);

  return {
    selectedDate: activeSelectedDate,
    visibleMonth,
    viewMode: activeViewMode,
    heatmapEnabled,
    selectDate,
    setVisibleMonth,
    navigateMonth,
    setViewMode,
    setHeatmapEnabled,
    goToToday,
  };
}
