"use client";

import React, { useRef, useState } from "react";
import clsx from "clsx";
import type { Slot } from "./types";

interface CalendarViewProps {
  slots: Slot[];
  viewMode: "month" | "week" | "day";
}

const generateDays = (viewMode: "month" | "week" | "day") => {
  if (viewMode === "month") return Array.from({ length: 35 }, (_, i) => i + 1);
  if (viewMode === "week") return Array.from({ length: 7 }, (_, i) => i + 1);
  return [15]; // Single day
};

export function CalendarView({ slots, viewMode }: CalendarViewProps) {
  const days = generateDays(viewMode);
  
  // A simple heuristic to place "Today" on day 15, "Tomorrow" on day 16
  const getSlotsForDay = (day: number) => {
    if (day === 15) return slots.filter(s => s.dateLabel.toLowerCase() === "today");
    if (day === 16) return slots.filter(s => s.dateLabel.toLowerCase() === "tomorrow");
    return [];
  };

  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const cols = viewMode === "month" ? 7 : viewMode === "week" ? 7 : 1;
    let nextIndex = index;
    if (e.key === "ArrowRight") nextIndex = index + 1;
    if (e.key === "ArrowLeft") nextIndex = index - 1;
    if (e.key === "ArrowDown") nextIndex = index + cols;
    if (e.key === "ArrowUp") nextIndex = index - cols;
    
    if (nextIndex >= 0 && nextIndex < days.length) {
      e.preventDefault();
      setFocusedIndex(nextIndex);
      const cell = gridRef.current?.children[nextIndex] as HTMLElement;
      cell?.focus();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available": 
      case "healthy": 
        return "bg-green-500/10 border-green-500/30 text-green-300";
      case "booked": 
      case "sold": 
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

  return (
    <div 
      className={clsx(
        "grid gap-2 sm:gap-4 mt-4", 
        viewMode === "month" ? "grid-cols-1 sm:grid-cols-7" : 
        viewMode === "week" ? "grid-cols-1 sm:grid-cols-7" : "grid-cols-1"
      )}
      ref={gridRef}
      role="grid"
      aria-label={`${viewMode} calendar view`}
    >
      {days.map((day, idx) => {
        const daySlots = getSlotsForDay(day);
        return (
          <div 
            key={idx}
            role="gridcell"
            tabIndex={focusedIndex === idx ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onFocus={() => setFocusedIndex(idx)}
            aria-label={`Date ${day}, ${daySlots.length} slots`}
            className={clsx(
              "flex flex-col min-h-[100px] sm:min-h-[120px] rounded-xl border border-white/10 bg-white/[0.02] p-2",
              "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/[0.05]",
              // Collapses to an agenda list under 640px (sm breakpoint handles it with grid-cols-1)
            )}
          >
            <div className="text-xs text-slate-400 font-medium mb-2">{day}</div>
            <div className="flex flex-col gap-1.5 overflow-y-auto">
              {daySlots.map(s => (
                <div 
                  key={s.id} 
                  className={clsx(
                    "text-[10px] sm:text-xs rounded-md p-1.5 border",
                    getStatusColor(s.status)
                  )}
                >
                  <div className="font-semibold truncate">{s.title}</div>
                  <div className="opacity-80 text-[9px] sm:text-[10px] mt-0.5">{s.timeRange}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
