"use client";

import { useState } from "react";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { EmptyStateCard } from "../../app/components/empty-state-card";

type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening";

const TIME_OF_DAY_BOUNDARIES = {
  morning: { maxHour: 12 },
  afternoon: { maxHour: 17 },
  evening: { maxHour: 24 },
};

function getTimeOfDay(timeRange: string): "morning" | "afternoon" | "evening" {
  const [start] = timeRange.split("-");
  const [hours] = start.split(":").map(Number);
  
  if (hours < TIME_OF_DAY_BOUNDARIES.morning.maxHour) return "morning";
  if (hours < TIME_OF_DAY_BOUNDARIES.afternoon.maxHour) return "afternoon";
  return "evening";
}

const mapTone = (status: string) => {
  switch (status.toLowerCase()) {
    case "healthy": return "positive";
    case "tight": return "warning";
    case "busy": return "critical";
    default: return "neutral";
  }
};

const labels: Record<TimeOfDay, string> = {
  anytime: "Anytime",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export const SlotList = ({ slots = [] }: { slots?: Slot[] }) => {
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay>("anytime");

  const filteredSlots = slots.filter(slot => {
    if (selectedTimeOfDay === "anytime") return true;
    return getTimeOfDay(slot.timeRange) === selectedTimeOfDay;
  });

  const counts = {
    anytime: slots.length,
    morning: slots.filter(s => getTimeOfDay(s.timeRange) === "morning").length,
    afternoon: slots.filter(s => getTimeOfDay(s.timeRange) === "afternoon").length,
    evening: slots.filter(s => getTimeOfDay(s.timeRange) === "evening").length,
  };

  return (
    <div className="space-y-6">
      <div 
        role="group" 
        aria-label="Filter by time of day"
        className="flex flex-wrap gap-2"
      >
        {(["anytime", "morning", "afternoon", "evening"] as const).map(tod => (
          <button
            key={tod}
            aria-pressed={selectedTimeOfDay === tod}
            onClick={() => setSelectedTimeOfDay(tod)}
            className={`
              flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50
              ${selectedTimeOfDay === tod 
                ? "bg-white text-black" 
                : "bg-white/5 text-slate-300 hover:bg-white/10"
              }
            `}
          >
            <span>{labels[tod]}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              selectedTimeOfDay === tod ? "bg-black/10 text-black" : "bg-white/10 text-slate-400"
            }`}>
              {counts[tod]}
            </span>
          </button>
        ))}
      </div>

      <ul className="space-y-4">
        {filteredSlots.length === 0 ? (
          <li className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
            No slots available for this time of day.
          </li>
        ) : (
          filteredSlots.map((slot) => {
            const slotTitleId = `slot-${slot.id}-title`;
            const slotDetailsId = `slot-${slot.id}-details`;

            return (
              <li
                key={slot.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <article aria-labelledby={slotTitleId} aria-describedby={slotDetailsId}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <h3 id={slotTitleId} className="text-lg font-semibold text-white">
                        {slot.title}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {slot.dateLabel} · {slot.timeRange}
                      </p>
                    </div>
                    <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
                  </div>

                  <div
                    id={slotDetailsId}
                    className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300"
                  >
                    <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                      {slot.demand}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                      {slot.rate}
                      <HelpPopover
                        term={glossary.rate}
                        triggerLabel="Help: slot rate and XLM pricing"
                      />
                    </span>

                    {slot.isNextAvailable ? (
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">
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
          })
        )}
      </ul>
    </div>
  );
};
