"use client";

import React, { useState, useRef, useCallback } from "react";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { TimezoneRibbon } from "./timezone-ribbon";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { EmptyStateCard } from "../../app/components/empty-state-card";

interface SlotListProps {
  slots?: Slot[];
  suggestedAlternatives?: Slot[];
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
    status: "Healthy",
    demand: "High Demand",
    rate: "50 XLM / hr",
    isNextAvailable: true,
  },
  {
    id: "slot-2",
    title: "Code Review & Optimization",
    dateLabel: "Tomorrow",
    timeRange: "10:00 - 11:30 UTC",
    status: "Tight",
    demand: "Medium Demand",
    rate: "75 XLM / hr",
    isNextAvailable: false,
  },
];

type DropPosition = "before" | "after" | null;

const mapTone = (status: string) => {
  if (status === "Healthy") return "positive";
  if (status === "Tight") return "warning";
  if (status === "Busy") return "danger";
  return "neutral";
};

export const SlotList = ({
  slots = defaultSlots,
  suggestedAlternatives = [],
  supplierId = "supplier-001",
  supplierTimeZone = "America/New_York",
  supplierName = "Alex",
}: SlotListProps) => {
  const [activeTz, setActiveTz] = useState<string>("UTC");
  const [orderedSlots, setOrderedSlots] = useState<Slot[]>(slots);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [liveMessage, setLiveMessage] = useState("");
  const lastSelectedId = useRef<string | null>(null);
  const alternativeRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const announce = useCallback((msg: string) => {
    setLiveMessage("");
    window.setTimeout(() => {
      setLiveMessage(msg);
      window.setTimeout(() => setLiveMessage(""), 2600);
    }, 50);
  }, []);

  const clearDragState = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
    setDropPosition(null);
    setGhostPosition(null);
  }, []);

  const reorderSlots = useCallback(
    (sourceId: string, targetId: string, position: DropPosition) => {
      if (!position || sourceId === targetId) return;

      setOrderedSlots((prev) => {
        const fromIndex = prev.findIndex((slot) => slot.id === sourceId);
        const toIndex = prev.findIndex((slot) => slot.id === targetId);

        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;

        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        const normalizedTargetIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
        const insertIndex = position === "after" ? normalizedTargetIndex + 1 : normalizedTargetIndex;
        next.splice(insertIndex, 0, moved);
        announce(`${moved.title} moved to position ${insertIndex + 1}.`);
        return next;
      });
    },
    [announce],
  );

  const toggleSelection = (id: string, event?: React.MouseEvent | React.KeyboardEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const isShift = event && "shiftKey" in event && event.shiftKey;
      const isMeta = event && "metaKey" in event && (event.metaKey || event.ctrlKey);

      if (isShift && lastSelectedId.current) {
        const currentIndex = orderedSlots.findIndex((slot) => slot.id === id);
        const lastIndex = orderedSlots.findIndex((slot) => slot.id === lastSelectedId.current);
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);

        if (!isMeta) {
          next.clear();
        }

        for (let index = start; index <= end; index += 1) {
          next.add(orderedSlots[index].id);
        }
      } else if (isMeta) {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        if (next.has(id) && next.size === 1) {
          next.delete(id);
        } else {
          next.clear();
          next.add(id);
        }
      }

      announce(`${next.size} slot${next.size !== 1 ? "s" : ""} selected.`);
      lastSelectedId.current = id;
      return next;
    });
  };

  const handleListKeyDown = (id: string, event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSelection(id, event);
      return;
    }

    if (event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      const currentIndex = orderedSlots.findIndex((slot) => slot.id === id);
      const nextIndex = event.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex < 0 || nextIndex >= orderedSlots.length) {
        return;
      }

      const target = orderedSlots[nextIndex];
      reorderSlots(id, target.id, event.key === "ArrowDown" ? "after" : "before");
    }
  };

  const handleAlternativeKeyDown = (index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) return;

    event.preventDefault();
    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % suggestedAlternatives.length
        : event.key === "ArrowLeft"
          ? (index - 1 + suggestedAlternatives.length) % suggestedAlternatives.length
          : event.key === "ArrowDown"
            ? Math.min(index + 1, suggestedAlternatives.length - 1)
            : Math.max(index - 1, 0);

    alternativeRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="space-y-4">
      <TimezoneRibbon
        supplierId={supplierId}
        supplierTimeZone={supplierTimeZone}
        supplierName={supplierName}
        onTimezoneChange={(_, activeTimeZone) => setActiveTz(activeTimeZone)}
      />

      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>

      {orderedSlots.length === 0 ? (
        <EmptyStateCard
          title="No slots available"
          description="There are currently no scheduled availability slots for this supplier."
        />
      ) : (
        <>
          <ul className="space-y-4">
            {orderedSlots.map((slot) => {
              const slotTitleId = `slot-${slot.id}-title`;
              const slotDetailsId = `slot-${slot.id}-details`;
              const isSelected = selectedIds.has(slot.id);
              const isDragging = draggingId === slot.id;
              const isDropTarget = dragOverId === slot.id;

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
