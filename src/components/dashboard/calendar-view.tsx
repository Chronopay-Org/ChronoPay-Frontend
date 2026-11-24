"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { addMonths } from "@/utils/date";
import { LiveRegion } from "@/components/common/LiveRegion";
import type { Slot } from "./types";
import type { DayAvailability } from "./availability-strip";
import { MonthCalendarView } from "./month-calendar-view";
import { CalendarAgendaView } from "./calendar-agenda-view";
import { MiniCalendarNavigator } from "./mini-calendar-navigator";
import {
  CalendarViewToggle,
  type CalendarViewMode,
} from "./calendar-view-toggle";
import {
  addDays,
  buildAvailabilityMap,
  getWeekDays,
  groupSlotsByDate,
  isSameDay,
  parseISODateKey,
  startOfDay,
  toISODateKey,
  useCalendarState,
} from "./use-calendar-state";

export interface CalendarViewProps {
  slots: Slot[];
  viewMode?: CalendarViewMode;
  onViewModeChange?: (mode: CalendarViewMode) => void;
  initialDate?: Date;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onBook?: (date: Date) => void;
  locale?: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "available":
    case "healthy":
      return "bg-green-500/10 border-green-500/30 text-green-300";
    case "booked":
    case "sold":
    case "sold out":
    case "busy":
      return "bg-slate-500/10 border-slate-500/30 text-slate-300";
    case "escrowed":
    case "pending":
    case "tight":
      return "bg-amber-500/10 border-amber-500/30 text-amber-300";
    case "expired":
      return "bg-red-500/10 border-red-500/30 text-red-300";
    default:
      return "bg-cyan-500/10 border-cyan-500/30 text-cyan-300";
  }
};

function deriveDayStatus(daySlots: Slot[]): DayAvailability["status"] {
  if (daySlots.length === 0) return "none";
  const statuses = daySlots.map((s) => s.status.toLowerCase());
  if (statuses.some((s) => s === "healthy" || s === "available")) {
    return "available";
  }
  if (statuses.some((s) => s === "tight" || s === "pending")) {
    return "limited";
  }
  return "full";
}

function formatMonthAnnouncement(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

export function CalendarView({
  slots,
  viewMode: controlledViewMode,
  onViewModeChange,
  initialDate,
  selectedDate: controlledSelectedDate,
  onDateSelect,
  onBook,
  locale = "en-US",
}: CalendarViewProps) {
  const {
    selectedDate,
    visibleMonth,
    viewMode,
    heatmapEnabled,
    selectDate,
    setVisibleMonth,
    setViewMode,
    setHeatmapEnabled,
  } = useCalendarState({
    initialDate,
    initialViewMode: controlledViewMode ?? "month",
    selectedDate: controlledSelectedDate,
    onDateSelect,
    viewMode: controlledViewMode,
    onViewModeChange,
  });

  const [announcement, setAnnouncement] = useState("");
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const referenceDate = useMemo(
    () => startOfDay(initialDate ?? new Date()),
    [initialDate]
  );

  const slotsByDate = useMemo(
    () => groupSlotsByDate(slots, referenceDate),
    [slots, referenceDate]
  );

  const availabilityData = useMemo(
    () => buildAvailabilityMap(slotsByDate),
    [slotsByDate]
  );

  const handleMonthChange = useCallback(
    (nextMonth: Date) => {
      setVisibleMonth(nextMonth);
      setAnnouncement(`Showing ${formatMonthAnnouncement(nextMonth, locale)}`);
    },
    [setVisibleMonth, locale]
  );

  const handleDateSelect = useCallback(
    (date: Date) => {
      const monthChanged =
        date.getMonth() !== visibleMonth.getMonth() ||
        date.getFullYear() !== visibleMonth.getFullYear();
      selectDate(date);
      if (monthChanged) {
        setAnnouncement(`Showing ${formatMonthAnnouncement(date, locale)}`);
      }
    },
    [selectDate, visibleMonth, locale]
  );

  const gridDays = useMemo(() => {
    if (viewMode === "week") return getWeekDays(selectedDate);
    if (viewMode === "day") return [startOfDay(selectedDate)];
    return [];
  }, [viewMode, selectedDate]);

  const agendaDays = useMemo<DayAvailability[]>(() => {
    const keys = Array.from(slotsByDate.keys()).sort();
    const result: DayAvailability[] = [];
    for (const key of keys) {
      const date = parseISODateKey(key);
      if (!date) continue;
      const daySlots = slotsByDate.get(key) ?? [];
      result.push({
        date,
        dayName: date.toLocaleDateString(locale, { weekday: "short" }),
        dateLabel: date.toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        slotCount: daySlots.length,
        status: deriveDayStatus(daySlots),
      });
    }
    return result;
  }, [slotsByDate, locale]);

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const currentDate = gridDays[index];
      if (!currentDate) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextDate = addDays(currentDate, 1);
        handleDateSelect(nextDate);
        const nextIdx = index + 1;
        if (nextIdx < gridDays.length) {
          cellRefs.current[nextIdx]?.focus();
        }
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevDate = addDays(currentDate, -1);
        handleDateSelect(prevDate);
        const prevIdx = index - 1;
        if (prevIdx >= 0) {
          cellRefs.current[prevIdx]?.focus();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDateSelect(addDays(currentDate, 7));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleDateSelect(addDays(currentDate, -7));
        return;
      }

      if (e.key === "Home") {
        e.preventDefault();
        const firstDate = gridDays[0];
        if (firstDate) {
          handleDateSelect(firstDate);
          cellRefs.current[0]?.focus();
        }
        return;
      }

      if (e.key === "End") {
        e.preventDefault();
        const lastIdx = gridDays.length - 1;
        const lastDate = gridDays[lastIdx];
        if (lastDate) {
          handleDateSelect(lastDate);
          cellRefs.current[lastIdx]?.focus();
        }
        return;
      }

      if (e.key === "PageUp") {
        e.preventDefault();
        const prevMonthDate = addMonths(currentDate, -1);
        handleDateSelect(prevMonthDate);
        return;
      }

      if (e.key === "PageDown") {
        e.preventDefault();
        const nextMonthDate = addMonths(currentDate, 1);
        handleDateSelect(nextMonthDate);
        return;
      }
    },
    [gridDays, handleDateSelect]
  );

  const selectedDaySlots = slotsByDate.get(toISODateKey(selectedDate)) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CalendarViewToggle
          currentMode={viewMode}
          onModeChange={setViewMode}
          heatmapEnabled={heatmapEnabled}
          onHeatmapToggle={setHeatmapEnabled}
        />
        <p className="text-xs font-medium text-slate-400">
          Selected:{" "}
          <span className="text-slate-200">
            {selectedDate.toLocaleDateString(locale, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:items-start">
        <MiniCalendarNavigator
          currentDate={selectedDate}
          visibleMonth={visibleMonth}
          onMonthChange={handleMonthChange}
          onDateSelect={handleDateSelect}
          availabilityData={availabilityData}
        />

        <div className="min-w-0 space-y-4">
          {viewMode === "month" && (
            <>
              <MonthCalendarView
                selectedDate={selectedDate}
                visibleMonth={visibleMonth}
                onMonthChange={handleMonthChange}
                onDateSelect={handleDateSelect}
                availabilityData={availabilityData}
                heatmapEnabled={heatmapEnabled}
                onHeatmapToggle={setHeatmapEnabled}
                locale={locale}
              />

              {/* Selected day's slots summary below month calendar */}
              <div
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4"
                aria-label="Selected day slots"
              >
                <h3 className="mb-2 text-sm font-semibold text-white">
                  {selectedDate.toLocaleDateString(locale, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                {selectedDaySlots.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No slots scheduled for this date.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {selectedDaySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={clsx(
                          "rounded-md border p-2 text-xs",
                          getStatusColor(slot.status)
                        )}
                      >
                        <div className="font-semibold truncate">{slot.title}</div>
                        <div className="mt-0.5 text-[11px] opacity-80">
                          {slot.timeRange}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {(viewMode === "week" || viewMode === "day") && (
            <div
              className={clsx(
                "grid gap-2 sm:gap-4",
                viewMode === "week" ? "grid-cols-1 sm:grid-cols-7" : "grid-cols-1"
              )}
              role="grid"
              aria-label={`${viewMode} calendar view`}
            >
              <div role="row" className="contents">
                {gridDays.map((day, idx) => {
                  const dateKey = toISODateKey(day);
                  const daySlots = slotsByDate.get(dateKey) ?? [];
                  const isSelected = isSameDay(day, selectedDate);
                  const formattedDate = day.toLocaleDateString(locale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={dateKey}
                      ref={(el) => {
                        cellRefs.current[idx] = el;
                      }}
                      role="gridcell"
                      tabIndex={isSelected || (idx === 0 && gridDays.length === 1) ? 0 : -1}
                      aria-selected={isSelected}
                      aria-label={`${formattedDate}, ${daySlots.length} ${daySlots.length === 1 ? "slot" : "slots"}`}
                      onClick={() => handleDateSelect(day)}
                      onKeyDown={(e) => handleGridKeyDown(e, idx)}
                      className={clsx(
                        "flex min-h-[100px] sm:min-h-[120px] flex-col rounded-xl border p-2 transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/[0.05]",
                        isSelected
                          ? "border-cyan-400/50 bg-cyan-500/10"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="mb-2 text-xs font-medium text-slate-300">
                        {formattedDate}
                      </div>
                      <div className="flex flex-col gap-1.5 overflow-y-auto">
                        {daySlots.map((s) => (
                          <div
                            key={s.id}
                            className={clsx(
                              "rounded-md border p-1.5 text-[10px] sm:text-xs",
                              getStatusColor(s.status)
                            )}
                          >
                            <div className="truncate font-semibold">{s.title}</div>
                            <div className="mt-0.5 text-[9px] opacity-80 sm:text-[10px]">
                              {s.timeRange}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === "agenda" && (
            <CalendarAgendaView
              days={agendaDays}
              onBook={(date) => {
                handleDateSelect(date);
                onBook?.(date);
              }}
            />
          )}
        </div>
      </div>

      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
}
