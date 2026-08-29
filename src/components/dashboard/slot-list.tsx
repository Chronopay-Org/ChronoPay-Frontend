"use client";

import { useCallback, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { StatusChip } from "./status-chip";
import { TimezoneRibbon } from "./timezone-ribbon";
import { KeepOriginalPriceChip } from "./keep-original-price-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { EmptyStateCard } from "../../app/components/empty-state-card";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A suggested alternative slot shown in the rebooking carousel.
 * Extends the base Slot with optional pricing metadata for the nudge chip.
 */
export type AlternativeSlot = Slot & {
  /** Numeric price in XLM for this alternative slot. */
  priceXlm?: number;
};

interface SlotListProps {
  /** Availability slots to render. Falls back to local sample data. */
  slots?: Slot[];
  /** Supplier identifiers passed through to the TimezoneRibbon. */
  supplierId?: string;
  supplierTimeZone?: string;
  supplierName?: string;
  /**
   * Alternative slots offered to the buyer during a rebooking flow.
   * When provided (even as an empty array) the "Rebook a matching slot"
   * section renders. Pass `undefined` to hide the section entirely.
   */
  suggestedAlternatives?: AlternativeSlot[];
  /**
   * Original booking price in XLM — used by the KeepOriginalPriceChip to
   * decide whether a price-preservation credit offer should appear.
   */
  originalPriceXlm?: number;
  /** Buyer's available account credit in XLM. */
  availableCreditXlm?: number;
  /** Called when the buyer applies a price-preservation credit. */
  onApplyCredit?: (slotId: string, priceDiff: number) => void;
}

// ─── Local default data ────────────────────────────────────────────────────────

const localDefaultSlots: Slot[] = [
  {
    id: "slot-1",
    title: "Founder office hours",
    dateLabel: "Today",
    timeRange: "10:30 - 11:00 UTC",
    status: "Healthy",
    demand: "High Demand",
    rate: "50 XLM / hr",
    durationMinutes: 30,
    isNextAvailable: true,
  },
  {
    id: "slot-2",
    title: "1-on-1 Architecture Consultation",
    dateLabel: "Tomorrow",
    timeRange: "14:00 - 15:00 UTC",
    status: "Tight",
    demand: "Medium Demand",
    rate: "75 XLM / hr",
    durationMinutes: 60,
  },
  {
    id: "slot-3",
    title: "Code Review & Optimization",
    dateLabel: "Fri, Apr 4",
    timeRange: "09:00 - 10:30 UTC",
    status: "Busy",
    demand: "Low Demand",
    rate: "90 XLM / hr",
    durationMinutes: 90,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapTone(
  status: Slot["status"],
): "positive" | "warning" | "critical" | "neutral" {
  if (status === "Healthy") return "positive";
  if (status === "Tight") return "warning";
  return "critical";
}

// ─── SuggestedAlternativesCarousel ────────────────────────────────────────────

/**
 * Carousel of suggested alternative slots during a rebooking flow.
 * Supports arrow-key navigation between cards and surfaces the
 * KeepOriginalPriceChip when the alternative costs more than the original.
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
    e: ReactKeyboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    const count = alternatives.length;
    if (count === 0) return;

    let nextIndex: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (index + 1) % count;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (index - 1 + count) % count;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = count - 1;
    }

    if (nextIndex === null) return;
    e.preventDefault();
    cardRefs.current[nextIndex]?.focus();
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {alt.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {alt.dateLabel} · {alt.timeRange}
                </p>
              </div>
              <StatusChip tone={mapTone(alt.status)} className="shrink-0">
                {alt.status}
              </StatusChip>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1">
                {alt.demand}
              </span>
              <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 font-mono tabular-nums">
                {alt.rate}
              </span>
            </div>

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
  // Local reorder state so keyboard nudging and drag-and-drop can reorder the
  // rendered list without mutating the parent's prop.
  const [orderedSlots, setOrderedSlots] = useState<Slot[] | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const draggingIdRef = useRef<string | null>(null);

  const visibleSlots = orderedSlots ?? slots;

  const announce = useCallback((message: string) => {
    setLiveMessage(message);
    window.setTimeout(() => setLiveMessage(""), 3000);
  }, []);

  const swapSlots = useCallback(
    (sourceId: string, targetId: string) => {
      if (!sourceId || sourceId === targetId) return;
      setOrderedSlots((prev) => {
        const list = prev ?? slots;
        const sourceIndex = list.findIndex((s) => s.id === sourceId);
        const targetIndex = list.findIndex((s) => s.id === targetId);
        if (sourceIndex === -1 || targetIndex === -1) return prev;
        const next = [...list];
        [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
        return next;
      });
      announce("Slot order updated.");
    },
    [slots, announce],
  );

  const handleSlotKeyDown = (
    id: string,
    e: ReactKeyboardEvent<HTMLLIElement>,
  ) => {
    if (!e.altKey || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    const list = orderedSlots ?? slots;
    const index = list.findIndex((s) => s.id === id);
    if (e.key === "ArrowDown" && index >= 0 && index < list.length - 1) {
      swapSlots(id, list[index + 1].id);
    } else if (e.key === "ArrowUp" && index > 0) {
      swapSlots(id, list[index - 1].id);
    }
  };

  const handleDragStart = (id: string, e: React.DragEvent<HTMLLIElement>) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    draggingIdRef.current = id;
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (id: string, e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggingIdRef.current;
    if (sourceId) {
      swapSlots(sourceId, id);
    }
    draggingIdRef.current = null;
  };

  const handleDragEnd = () => {
    draggingIdRef.current = null;
  };

  return (
    <div className="space-y-4">
      <TimezoneRibbon
        supplierId={supplierId}
        supplierTimeZone={supplierTimeZone}
        supplierName={supplierName}
      />

      {/* Suggested alternatives (rebooking flow) */}
      {suggestedAlternatives !== undefined && (
        <section aria-labelledby="rebook-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <h2
              id="rebook-heading"
              className="text-base font-semibold text-white"
            >
              Rebook a matching slot
            </h2>
            <span className="text-xs text-slate-400">Suggested alternatives</span>
          </div>
          <SuggestedAlternativesCarousel
            alternatives={suggestedAlternatives}
            originalPriceXlm={originalPriceXlm}
            availableCreditXlm={availableCreditXlm}
            onApplyCredit={onApplyCredit}
          />
        </section>
      )}

      {/* Primary slot list */}
      {visibleSlots.length === 0 ? (
        <EmptyStateCard
          eyebrow="Slots"
          title="No slots available"
          description="There are currently no scheduled availability slots for this supplier."
          accentLabel="Slots"
          status={{ label: "Empty", tone: "neutral" }}
          guidance={[
            "Create your first availability block to begin selling time.",
            "Set clear availability windows so customers can book reliably.",
          ]}
        />
      ) : (
        <ul className="space-y-4">
          {visibleSlots.map((slot) => {
            const slotTitleId = `slot-${slot.id}-title`;
            const slotDetailsId = `slot-${slot.id}-details`;

            return (
              <li
                key={slot.id}
                draggable
                aria-label={`availability slot: ${slot.title}, ${slot.dateLabel} ${slot.timeRange}`}
                onDragStart={(e) => handleDragStart(slot.id, e)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(slot.id, e)}
                onDragEnd={handleDragEnd}
                onKeyDown={(e) => handleSlotKeyDown(slot.id, e)}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-cyan-300/20 sm:p-5"
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
                    <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 font-mono tabular-nums">
                      {slot.rate}
                    </span>
                    {slot.isNextAvailable ? (
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">
                        Next available
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      Rate details
                      <HelpPopover
                        term={glossary.rate}
                        triggerLabel="Help: slot rate and XLM pricing"
                      />
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {/* Live region for reorder announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
    </div>
  );
};
