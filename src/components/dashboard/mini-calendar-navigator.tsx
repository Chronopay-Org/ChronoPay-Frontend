"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

export interface MiniCalendarNavigatorProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  availabilityData?: Map<string, number>; // date string -> slot count
  className?: string;
}

export function MiniCalendarNavigator({
  currentDate,
  onDateSelect,
  availabilityData = new Map(),
  className = "",
}: MiniCalendarNavigatorProps) {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getAvailabilityDensity = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const slots = availabilityData.get(dateStr) || 0;
    if (slots === 0) return "none";
    if (slots <= 3) return "low";
    if (slots <= 7) return "medium";
    return "high";
  };

  const days = getDaysInMonth(viewDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const densityDotClass: Record<string, string> = {
    none: "bg-transparent",
    low: "bg-emerald-400",
    medium: "bg-amber-400",
    high: "bg-rose-400",
  };

  return (
    <aside
      className={clsx(
        "rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4",
        className
      )}
      aria-label="Mini calendar navigator"
    >
      {/* Month Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-ring-cyan"
          aria-label={`Previous month, ${monthNames[(viewDate.getMonth() + 11) % 12]}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <h3 className="text-sm font-semibold text-white">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-ring-cyan"
          aria-label={`Next month, ${monthNames[(viewDate.getMonth() + 1) % 12]}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium uppercase tracking-wider text-slate-500"
            aria-hidden="true"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Calendar days">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" aria-hidden="true" />;
          }

          const selected = isSelected(date);
          const today = isToday(date);
          const density = getAvailabilityDensity(date);
          const dateId = `mini-cal-${date.toISOString().split('T')[0]}`;

          return (
            <button
              key={dateId}
              onClick={() => onDateSelect(date)}
              className={clsx(
                "relative aspect-square rounded-lg text-xs font-medium transition-all focus-ring-cyan",
                selected
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : today
                  ? "bg-white/10 text-white ring-1 ring-white/20"
                  : "text-slate-300 hover:bg-white/5",
                "flex flex-col items-center justify-center"
              )}
              aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${selected ? ', selected' : ''}${today ? ', today' : ''}`}
              aria-pressed={selected}
              role="gridcell"
            >
              <span>{date.getDate()}</span>
              
              {/* Availability Density Dot */}
              <span
                className={clsx(
                  "mt-0.5 h-1 w-1 rounded-full",
                  densityDotClass[density]
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Low
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
          Med
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden="true" />
          High
        </span>
      </div>
    </aside>
  );
}
