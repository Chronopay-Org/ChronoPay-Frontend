"use client";

import React, { useState, useRef, useCallback } from "react";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { TimezoneRibbon } from "./timezone-ribbon";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { slots as defaultSlots } from "./dashboard-data";
import { EmptyStateCard } from "../../app/components/empty-state-card";
import { slots } from "./dashboard-data";
import { BidiIsolate } from "@/utils/bidi";
import { getDir } from "@/lib/formatters";

interface SlotListProps {
  slots?: Slot[];
  suggestedAlternatives?: Slot[];
  supplierId?: string;
  supplierTimeZone?: string;
  supplierName?: string;
  /** UI locale — controls date/time formatting and text direction. */
  locale?: string;
}

export const SlotList = ({
  slots = defaultSlots,
  suggestedAlternatives = [],
  supplierId = "supplier-001",
  supplierTimeZone = "America/New_York",
  supplierName = "Alex",
  locale = "en",
}: SlotListProps) => {
  const [activeTz, setActiveTz] = useState<string>("UTC");
  const [templatePickerOpen, setTemplatePickerOpen] = useState<boolean>(false);
  const [activeConflictSlotId, setActiveConflictSlotId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [liveMessage, setLiveMessage] = useState("");
  const lastSelectedId = useRef<string | null>(null);
  const alternativeRefs = useRef<Array<HTMLButtonElement | null>>([]);

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

  const dir = getDir(locale);

  return (
    <div className="space-y-4" dir={dir}>
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
                        {isJustAdded(slot.mintedAt) && (
                          <Tooltip
                            content="This slot was added within the last 24 hours."
                            trigger={
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[0.65rem] font-bold tracking-wider text-cyan-300 hover:bg-cyan-400/20 transition-colors cursor-help">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
                                NEW
                              </span>
                            }
                            triggerClassName="inline-flex"
                            ariaLabel="New slot: added within the last 24 hours"
                          />
                        )}
                      </div>
                      <p className="text-sm text-slate-300">
                        <BidiIsolate locale={locale}>{slot.dateLabel}</BidiIsolate>
                        <span aria-hidden="true"> · </span>
                        <BidiIsolate locale={locale}>{slot.timeRange}</BidiIsolate>
                      </p>
                    </div>
                    <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
                  </div>

              return (
                <li key={slot.id} className="space-y-2">
                  {isDropTarget && dropPosition === "before" ? (
                    <div className="h-1 rounded-full bg-cyan-400/80" />
                  ) : null}
                  <div
                    data-slot-id={slot.id}
                    draggable
                    tabIndex={0}
                    aria-label={`availability slot: ${slot.title}, ${slot.dateLabel} ${slot.timeRange}`}
                    aria-pressed={isSelected}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", slot.id);
                      setDraggingId(slot.id);
                      setDragOverId(slot.id);
                      setGhostPosition({ x: event.clientX, y: event.clientY });
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      const rect = event.currentTarget.getBoundingClientRect();
                      const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
                      setDragOverId(slot.id);
                      setDropPosition(position);
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceId = event.dataTransfer.getData("text/plain") || draggingId;
                      if (sourceId) {
                        reorderSlots(sourceId, slot.id, dropPosition);
                      }
                      clearDragState();
                    }}
                    onDragEnd={() => clearDragState()}
                    onKeyDown={(event) => handleListKeyDown(slot.id, event)}
                    className={`rounded-[1.5rem] border p-4 transition-all duration-200 sm:p-5 ${isDragging ? "border-cyan-400/80 bg-cyan-400/10 opacity-70 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]" : isSelected ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-white/[0.03] hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]"}`}
                  >
                    <article aria-labelledby={slotTitleId} aria-describedby={slotDetailsId}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 id={slotTitleId} className="text-lg font-semibold text-white">
                              {slot.title}
                            </h3>
                            {isDragging ? (
                              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                                Moving
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-300">
                            {slot.dateLabel} · {slot.timeRange}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">
                            Drag to move
                          </span>
                          <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
                        </div>
                      </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                      {slot.rate}
                      <HelpPopover
                        term={glossary.rate}
                        triggerLabel="Help: slot rate and XLM pricing"
                      />
                    </span>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                          {slot.rate}
                          <HelpPopover
                            term={glossary.rate}
                            triggerLabel="Help: slot rate and XLM pricing"
                          />
                        </span>

                    <span className="inline-flex items-center gap-1.5">
                      Rate details
                      <HelpPopover
                        term={glossary.xlm}
                        triggerLabel="Help: XLM and Stellar network fees"
                      />
                    </span>
                  </div>
                  {isDropTarget && dropPosition === "after" ? (
                    <div className="h-1 rounded-full bg-cyan-400/80" />
                  ) : null}
                </li>
              );
            })}
          </ul>

          {suggestedAlternatives.length > 0 ? (
            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Rebook a matching slot</h3>
                  <p className="mt-1 text-sm text-slate-300">Suggested alternatives</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {suggestedAlternatives.map((alternative, index) => (
                  <button
                    key={alternative.id}
                    ref={(element) => {
                      alternativeRefs.current[index] = element;
                    }}
                    type="button"
                    tabIndex={0}
                    aria-label={`Alternative slot: ${alternative.title}, ${alternative.dateLabel} ${alternative.timeRange}`}
                    onKeyDown={(event) => handleAlternativeKeyDown(index, event)}
                    className="rounded-[1.25rem] border border-white/10 bg-slate-900/70 p-4 text-left transition hover:border-cyan-400/40 hover:bg-slate-800/90"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-white">{alternative.title}</p>
                      <StatusChip tone={mapTone(alternative.status)}>{alternative.status}</StatusChip>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{alternative.dateLabel} · {alternative.timeRange}</p>
                    <p className="mt-3 text-sm text-slate-400">{alternative.demand}</p>
                    <p className="mt-2 text-sm text-cyan-200">{alternative.rate}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-white">Rebook a matching slot</h3>
              <p className="mt-2 text-sm text-slate-300">No matching alternatives found</p>
              <p className="mt-1 text-sm text-slate-400">No alternatives</p>
            </section>
          )}
        </>
      )}

      {draggingId && ghostPosition ? (
        <div
          className="pointer-events-none fixed z-50 rounded-[1.25rem] border border-cyan-400/60 bg-slate-950/90 px-4 py-3 text-sm text-white shadow-2xl"
          style={{ left: ghostPosition.x + 16, top: ghostPosition.y + 16 }}
        >
          <p className="font-medium">Moving availability</p>
          <p className="mt-1 text-slate-300">Drop to place the slot</p>
        </div>
      ) : null}
    </div>
  );
};
