"use client";

import { DayAvailability } from "./availability-strip";
import clsx from "clsx";

export interface CalendarAgendaViewProps {
  days: DayAvailability[];
  onBook?: (date: Date) => void;
  className?: string;
}

const statusClasses: Record<DayAvailability["status"], string> = {
  available: "bg-emerald-400/10 border-emerald-400/30 text-emerald-100",
  limited: "bg-amber-400/10 border-amber-400/30 text-amber-100",
  full: "bg-rose-400/10 border-rose-400/30 text-rose-100",
  none: "bg-slate-400/10 border-slate-400/30 text-slate-400",
};

const statusLabels: Record<DayAvailability["status"], string> = {
  available: "Available",
  limited: "Limited",
  full: "Full",
  none: "No slots",
};

export function CalendarAgendaView({
  days,
  onBook,
  className = "",
}: CalendarAgendaViewProps) {
  // Group days by month for better organization
  const groupedByMonth = days.reduce<Record<string, DayAvailability[]>>(
    (acc, day) => {
      const monthKey = day.date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(day);
      return acc;
    },
    {}
  );

  if (days.length === 0) {
    return (
      <div
        className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-slate-400">No availability data available</p>
      </div>
    );
  }

  return (
    <section
      className={clsx("rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5", className)}
      aria-label="Agenda view of availability"
    >
      <h2 className="mb-4 text-lg font-semibold text-white">
        Availability Agenda
      </h2>

      <div role="list" aria-label="Available days grouped by month">
        {Object.entries(groupedByMonth).map(([month, monthDays]) => (
          <div key={month} className="mb-6 last:mb-0">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              {month}
            </h3>
            <ul className="space-y-2" role="group" aria-label={`Days in ${month}`}>
              {monthDays.map((day) => {
                const isBookable = day.status === "available" || day.status === "limited";
                const dayId = `agenda-${day.dateLabel.replace(/\s+/g, "-").toLowerCase()}`;

                return (
                  <li
                    key={dayId}
                    className="flex items-center justify-between rounded-lg border border-white/8 bg-white/4 p-3 transition-colors hover:border-white/12"
                    role="listitem"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {day.dayName}
                          </span>
                          <span className="text-sm font-medium text-white">
                            {day.dateLabel}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-3 sm:mt-0">
                        <span className="text-sm text-slate-300">
                          {day.slotCount} {day.slotCount === 1 ? "slot" : "slots"}
                        </span>
                        <span
                          className={clsx(
                            "rounded-full border px-2.5 py-1 text-xs font-medium",
                            statusClasses[day.status]
                          )}
                          aria-label={`Status: ${statusLabels[day.status]}`}
                        >
                          {statusLabels[day.status]}
                        </span>
                      </div>
                    </div>

                    {isBookable ? (
                      <button
                        onClick={() => onBook?.(day.date)}
                        className="ml-4 rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-400 focus-ring-cyan"
                        aria-label={`Book slots for ${day.dateLabel}`}
                      >
                        Book
                      </button>
                    ) : (
                      <button
                        disabled
                        className="ml-4 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-slate-500 opacity-60"
                        aria-label={`No slots available for ${day.dateLabel}`}
                      >
                        {day.status === "full" ? "Fully Booked" : "Unavailable"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
