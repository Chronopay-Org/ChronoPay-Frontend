"use client";

import React, { useState, useRef, useCallback } from "react";
import { useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { TimezoneRibbon } from "./timezone-ribbon";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { slots as defaultSlots } from "./dashboard-data";
import { EmptyStateCard } from "../../app/components/empty-state-card";

import { AvailabilityTemplatePicker } from "./availability-template-picker";
import {
  AvailabilityConflictDetector,
  type AvailabilityConflict,
  type ConflictResolutionEvent,
} from "./availability-conflict-detector";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface SlotListProps {
  slots?: Slot[];
  supplierId?: string;
  supplierTimeZone?: string;
  supplierName?: string;
  showTemplatePicker?: boolean;
  showConflictDetector?: boolean;
  conflicts?: AvailabilityConflict[];
  suggestedAlternatives?: Slot[];
}

export const SlotList = ({
  slots = defaultSlots,
  supplierId = "supplier-001",
  supplierTimeZone = "America/New_York",
  supplierName = "Alex",
  showTemplatePicker = true,
  showConflictDetector = true,
  conflicts,
  suggestedAlternatives,
}: SlotListProps) => {
  const [activeTz, setActiveTz] = useState<string>("UTC");
  const [templatePickerOpen, setTemplatePickerOpen] = useState<boolean>(false);
  const [activeConflictSlotId, setActiveConflictSlotId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedId = useRef<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const announce = useCallback((msg: string) => {
    setLiveMessage(msg);
    setTimeout(() => setLiveMessage(""), 3000);
  }, []);

  const handleFocusSlot = useCallback((slotId: string) => {
    setActiveConflictSlotId(slotId);
    announce(`Focused slot ${slotId}`);
  }, [announce]);

  const mapTone = (status: string) => {
    const s = status.toLowerCase();
    if (s === "healthy" || s === "available") return "positive";
    if (s === "tight") return "warning";
    if (s === "busy" || s === "booked") return "neutral";
    return "neutral";
  };

  return (
    <div className="space-y-4">
      {/* Timezone Ribbon Header */}
      <TimezoneRibbon
        supplierId={supplierId}
        supplierTimeZone={supplierTimeZone}
        supplierName={supplierName}
        onTimezoneChange={(_, activeTimeZone) => setActiveTz(activeTimeZone)}
      />

      {/* Availability Conflict Detector Card */}
      {showConflictDetector && (
        <AvailabilityConflictDetector
          conflicts={conflicts}
          onFocusAffectedSlot={handleFocusSlot}
        />
      )}

      {/* Availability Template Picker Banner & Drawer */}
      {showTemplatePicker && (
        <div className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-950/20 p-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-cyan-400/10 p-2 text-cyan-400 border border-cyan-400/20">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Availability Templates</h3>
                <p className="text-xs text-slate-300">
                  Apply pre-configured weekly slot templates or save custom schedules.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTemplatePickerOpen((prev) => !prev)}
              aria-expanded={templatePickerOpen}
              aria-controls="availability-template-picker-section"
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {templatePickerOpen ? (
                <>
                  Hide Picker
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  Manage Templates
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          {templatePickerOpen && (
            <div id="availability-template-picker-section" className="mt-4 pt-4 border-t border-cyan-400/20 animate-in fade-in">
              <AvailabilityTemplatePicker bare existingSlots={slots} />
            </div>
          )}
        </div>
      )}

      {/* Suggested Alternatives Section if provided */}
      {suggestedAlternatives !== undefined && (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-4 font-sans space-y-3">
          <div>
            <h3 className="text-base font-semibold text-white">Rebook a matching slot</h3>
            <p className="text-xs text-slate-300">Suggested alternatives</p>
          </div>

          {suggestedAlternatives.length === 0 ? (
            <div className="text-xs text-slate-400 p-3 rounded-xl border border-white/6 bg-white/4">
              No matching alternatives found. No alternatives currently available.
            </div>
          ) : (
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              role="region"
              aria-label="Suggested alternatives carousel"
            >
              {suggestedAlternatives.map((alt) => {
                const labelText = `Alternative slot: ${alt.title}, ${alt.dateLabel} ${alt.timeRange}`;
                return (
                  <div
                    key={alt.id}
                    tabIndex={0}
                    aria-label={labelText}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight") {
                        e.preventDefault();
                        const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                        nextEl?.focus();
                      } else if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        const prevEl = e.currentTarget.previousElementSibling as HTMLElement;
                        prevEl?.focus();
                      }
                    }}
                    className="min-w-[240px] shrink-0 rounded-xl border border-white/10 bg-slate-900/80 p-3 hover:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                  >
                    <div className="font-semibold text-xs text-white truncate">{alt.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {alt.dateLabel} · {alt.timeRange}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">{alt.rate}</span>
                      <StatusChip tone={mapTone(alt.status)}>{alt.status}</StatusChip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Slots List */}
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
            const isConflictTarget = activeConflictSlotId === slot.id || activeConflictSlotId === `slot-${slot.id}`;

            return (
              <li
                key={slot.id}
                id={`slot-${slot.id}`}
                tabIndex={-1}
                className={`rounded-[1.5rem] border p-4 sm:p-5 transition-all outline-none ${
                  isConflictTarget
                    ? "border-amber-400/60 bg-amber-950/20 ring-2 ring-amber-400/50"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <article aria-labelledby={slotTitleId} aria-describedby={slotDetailsId}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 id={slotTitleId} className="text-lg font-semibold text-white">
                          {slot.title}
                        </h3>
                        {isConflictTarget && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            Target Slot
                          </span>
                        )}
                      </div>
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
          })}
        </ul>
      )}
    </div>
  );
};
