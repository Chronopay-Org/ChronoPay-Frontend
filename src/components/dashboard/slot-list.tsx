"use client";

import React, { useState } from "react";
import { useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { TimezoneRibbon } from "./timezone-ribbon";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { EmptyStateCard } from "../../app/components/empty-state-card";

interface SlotListProps {
  slots?: Slot[];
  supplierId?: string;
  supplierTimeZone?: string;
  supplierName?: string;
}

const defaultSlots: Slot[] = [
  {
    id: "slot-1",
    title: "1-on-1 Architecture Consultation",
    dateLabel: "Today",
    timeRange: "14:00 - 15:00 UTC",
    status: "Available",
    demand: "High Demand",
    rate: "50 XLM / hr",
    isNextAvailable: true,
  },
  {
    id: "slot-2",
    title: "Code Review & Optimization",
    dateLabel: "Tomorrow",
    timeRange: "10:00 - 11:30 UTC",
    status: "Booked",
    demand: "Medium Demand",
    rate: "75 XLM / hr",
    isNextAvailable: false,
  },
];

const mapTone = (status: string) => {
  switch (status.toLowerCase()) {
    case "available":
      return "positive";
    case "booked":
      return "neutral";
    default:
      return "neutral";
  }
};

export const SlotList = ({
  slots = defaultSlots,
  supplierId = "supplier-001",
  supplierTimeZone = "America/New_York",
  supplierName = "Alex",
}: SlotListProps) => {
  const [activeTz, setActiveTz] = useState<string>("UTC");
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(({ swipe: [swipeX, swipeY] }) => {
    if (swipeX !== 0) {
      console.log("Day navigation logic: ", swipeX > 0 ? "Next" : "Previous");
    }
    if (swipeY === -1) {
      console.log("Detail reveal logic");
    }
  });

  return (
    <div className="space-y-4">
      {/* Timezone Ribbon Header */}
      <TimezoneRibbon
        supplierId={supplierId}
        supplierTimeZone={supplierTimeZone}
        supplierName={supplierName}
        onTimezoneChange={(_, activeTimeZone) => setActiveTz(activeTimeZone)}
      />

      {slots.length === 0 ? (
        <EmptyStateCard
          title="No slots available"
          description="There are currently no scheduled availability slots for this supplier."
        />
      ) : (
        <ul className="space-y-4">
          {slots.map((slot) => {
            const slotTitleId = "slot-" + slot.id + "-title";
            const slotDetailsId = "slot-" + slot.id + "-details";

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

                    {/* Rate badge — annotated with HelpPopover for XLM and rate concepts */}
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

                    {/* "Rate details" label — links to broader XLM explanation */}
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
      )}
    </div>
  );
};
