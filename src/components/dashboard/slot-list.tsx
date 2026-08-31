"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { StatusChip } from "./status-chip";
import type { Slot } from "./types";
import { EmptyStateCard } from "@/app/components/empty-state-card";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A suggested alternative slot shown in the rebooking carousel.
 * Extends the base Slot with optional pricing metadata for the nudge chip.
 */
export type AlternativeSlot = Slot & {
  /**
   * Numeric price in XLM for this alternative slot.
   * Required for the KeepOriginalPriceChip to compute the price difference.
   */
  priceXlm?: number;
};

interface SlotListProps {
  slots?: Slot[];
  suggestedAlternatives?: Slot[];
  supplierId?: string;
  supplierTimeZone?: string;
  supplierName?: string;
  /**
   * Alternative slots offered to the buyer during a rebooking flow.
   * When provided (even as an empty array) the "Rebook a matching slot"
   * section is rendered. Pass `undefined` to hide the section entirely.
   */
  suggestedAlternatives?: AlternativeSlot[];
  /**
   * Original booking price in XLM — used by the KeepOriginalPriceChip to
   * compute whether a price-preservation credit offer should appear on each
   * alternative card.
   */
  originalPriceXlm?: number;
  /**
   * Buyer's available account credit in XLM.
   * Passed through to KeepOriginalPriceChip on each alternative card.
   */
  availableCreditXlm?: number;
  /**
   * Called when the buyer applies a price-preservation credit on an
   * alternative slot.  Receives the slot id and price difference covered.
   */
  onApplyCredit?: (slotId: string, priceDiff: number) => void;
}

// ─── Local default data ────────────────────────────────────────────────────────

const localDefaultSlots: Slot[] = [
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
    status: "Busy",
    demand: "Medium Demand",
    rate: "75 XLM / hr",
    isNextAvailable: false,
  },
];

// ─── SuggestedAlternativesCarousel ────────────────────────────────────────────

/**
 * Internal carousel that renders the suggested alternative slots during
 * a rebooking flow.  Supports arrow-key navigation between cards and
 * surfaces the KeepOriginalPriceChip when there is a price difference.
 */
function SuggestedAlternativesCarousel({
  alternatives,
  originalPriceXlm,
  availableCreditXlm = 0,
  onApplyCredit,
}: {
  alternatives: AlternativeSlot[];
  originalPriceXlm?: number;
  availableCreditXlm?: number;
  onApplyCredit?: (slotId: string, priceDiff: number) => void;
}) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleCardKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = cardRefs.current[(index + 1) % alternatives.length];
      next?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev =
        cardRefs.current[
          (index - 1 + alternatives.length) % alternatives.length
        ];
      prev?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      cardRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      cardRefs.current[alternatives.length - 1]?.focus();
    }
  };

  if (alternatives.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-6 text-center"
      >
        <p className="text-sm font-medium text-slate-300">No alternatives</p>
        <p className="mt-1 text-xs text-slate-500">
          No matching alternatives found for your original booking criteria.
        </p>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Suggested alternative slots"
      className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3"
    >
      {alternatives.map((alt, index) => {
        const cardLabel = `Alternative slot: ${alt.title}, ${alt.dateLabel} ${alt.timeRange}`;
        const showPriceChip =
          originalPriceXlm !== undefined &&
          alt.priceXlm !== undefined &&
          alt.priceXlm > originalPriceXlm;

        return (
          <div
            key={alt.id}
            role="listitem"
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            tabIndex={0}
            aria-label={cardLabel}
            onKeyDown={(e) => handleCardKeyDown(e, index)}
            className={[
              "flex min-w-[260px] flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:min-w-0",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              "transition-colors hover:border-cyan-300/20 hover:bg-white/[0.05]",
            ].join(" ")}
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {alt.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {alt.dateLabel} · {alt.timeRange}
                </p>
              </div>
              <StatusChip tone={mapToneAlt(alt.status)} className="shrink-0">
                {alt.status}
              </StatusChip>
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1">
                {alt.demand}
              </span>
              <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 font-mono tabular-nums">
                {alt.rate}
              </span>
            </div>

            {/* Price nudge chip — only when alternative is more expensive */}
            {showPriceChip && (
              <KeepOriginalPriceChip
                originalPrice={originalPriceXlm!}
                alternativePrice={alt.priceXlm!}
                availableCredit={availableCreditXlm}
                onApplyCredit={(diff) => onApplyCredit?.(alt.id, diff)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function mapToneAlt(status: string) {
  if (status === "Healthy") return "positive";
  if (status === "Tight") return "warning";
  if (status === "Busy") return "danger";
  return "neutral";
}

// ─── SlotList ─────────────────────────────────────────────────────────────────

export const SlotList = ({
  slots = localDefaultSlots,
  supplierId = "supplier-001",
  supplierTimeZone = "America/New_York",
  supplierName = "Alex",
  suggestedAlternatives,
  originalPriceXlm,
  availableCreditXlm = 0,
  onApplyCredit,
}: SlotListProps) => {
  const [activeTz, setActiveTz] = useState<string>("UTC");
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const [isDragging, setIsDragging] = useState(false);
  const [conflicts, setConflicts] = useState<Record<string, string>>({});

  const bind = useDrag((state) => {
    // state.first / state.last indicate drag lifecycle
    if (state.first) setIsDragging(true);
    if (state.last) setIsDragging(false);

    // quick examples of conflict detection while dragging
    // real app should compute based on drop target + business rules
    if (state.active) {
      const found: Record<string, string> = {};
      slots.forEach((s) => {
        // Existing booking
        if (s.status && s.status.toLowerCase() === "booked") {
          found[s.id] = "Existing booking";
        }

        // Blocked day flag (some slot data may include `blocked`)
        if ((s as any).blocked) {
          found[s.id] = "Blocked day";
        }
      });
      setConflicts(found);
    }
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [liveMessage, setLiveMessage] = useState("");
  const lastSelectedId = useRef<string | null>(null);
  const alternativeRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const announce = useCallback((msg: string) => {
    setLiveMessage(msg);
    setTimeout(() => setLiveMessage(""), 3000);
  }, []);

  // Announce conflicts to assistive tech when dragging starts
  useEffect(() => {
    if (isDragging) {
      const keys = Object.keys(conflicts);
      if (keys.length > 0) {
        announce(`${keys.length} blocked target${keys.length !== 1 ? "s" : ""}.`);
      } else {
        announce("No conflicts for current drag target.");
      }
    }
    // only when dragging or conflicts change
  }, [isDragging, conflicts, announce]);

  const toggleSelection = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const isShift = e && 'shiftKey' in e && e.shiftKey;
      const isMeta = e && ('metaKey' in e && (e.metaKey || e.ctrlKey));

      if (isShift && lastSelectedId.current) {
        const currentIndex = slots.findIndex(s => s.id === id);
        const lastIndex = slots.findIndex(s => s.id === lastSelectedId.current);
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        
        if (!isMeta) {
          next.clear();
        }

        for (let i = start; i <= end; i++) {
          next.add(slots[i].id);
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
      
      announce(`${next.size} slot${next.size !== 1 ? 's' : ''} selected.`);
      
      lastSelectedId.current = id;
      return next;
    });
  };

  const handleKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSelection(id, e);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    announce("Selection cleared.");
    lastSelectedId.current = null;
  };

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

      {/* ── Suggested alternatives (rebooking flow) ─────────────────────── */}
      {suggestedAlternatives !== undefined && (
        <section aria-labelledby="rebook-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <h2
              id="rebook-heading"
              className="text-base font-semibold text-white"
            >
              Rebook a matching slot
            </h2>
            <span className="text-xs text-slate-400">
              Suggested alternatives
            </span>
          </div>
          <SuggestedAlternativesCarousel
            alternatives={suggestedAlternatives}
            originalPriceXlm={originalPriceXlm}
            availableCreditXlm={availableCreditXlm}
            onApplyCredit={onApplyCredit}
          />
        </section>
      )}

      {/* ── Primary slot list ───────────────────────────────────────────── */}
      {slots.length === 0 ? (
        <EmptyStateCard
          title="No slots available"
          description="There are currently no scheduled availability slots for this supplier."
        />
      ) : (
        <>
          <ul className="space-y-4">
          {slots.map((slot, index) => {
            const slotTitleId = "slot-" + slot.id + "-title";
            const slotDetailsId = "slot-" + slot.id + "-details";
            const isConflictTarget = activeConflictSlotId === slot.id || activeConflictSlotId === `slot-${slot.id}`;

            return (
              <li
                key={slot.id}
                aria-label={`availability slot: ${slot.title}, ${slot.dateLabel} ${slot.timeRange}`}
                onKeyDown={(event) => handleListKeyDown(event, index)}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{slot.title}</h3>
                    <p className="text-sm text-slate-300">{slot.dateLabel} · {slot.timeRange}</p>
                  </div>
                  <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                  <span>{slot.demand}</span>
                  <span>{slot.rate}</span>
                </div>
                <div
                  className="mt-3 h-2 w-full rounded-full bg-slate-800"
                  draggable
                  onDragStart={() => handleDragStart(slot.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDrop(slot.id);
                  }}
                  aria-hidden="true"
                />
              </li>
            );
            })}
          </ul>
        )}

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

      {/* Live region for multi-select announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
    </div>
  );
};

export default SlotList;
