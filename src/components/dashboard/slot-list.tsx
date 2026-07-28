"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { TimezoneRibbon } from "./timezone-ribbon";
import { KeepOriginalPriceChip } from "./keep-original-price-chip";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { EmptyStateCard } from "../../app/components/empty-state-card";
import { SlotPickerMinimap, MinimapSlot } from "./slot-picker-minimap";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlternativeSlot = Slot & {
  /**
   * Numeric price in XLM for this alternative slot.
   */
  priceXlm?: number;
};

export interface SlotListProps {
  slots?: Slot[];
  supplierId?: string;
  supplierTimeZone?: string;
  supplierName?: string;
  suggestedAlternatives?: AlternativeSlot[];
  originalPriceXlm?: number;
  availableCreditXlm?: number;
  onApplyCredit?: (slotId: string, priceDiff: number) => void;
  locale?: string;
}

// ─── Fallback Utilities ───────────────────────────────────────────────────────

function getDir(locale?: string): "ltr" | "rtl" {
  return locale === "ar" || locale === "he" ? "rtl" : "ltr";
}

function isJustAdded(mintedAt?: string | number | Date): boolean {
  if (!mintedAt) return false;
  const created = new Date(mintedAt).getTime();
  const dayInMs = 24 * 60 * 60 * 1000;
  return Date.now() - created < dayInMs;
}

const Tooltip = ({
  content,
  trigger,
  triggerClassName,
}: {
  content: string;
  trigger: React.ReactNode;
  triggerClassName?: string;
  ariaLabel?: string;
}) => (
  <span className={triggerClassName} title={content}>
    {trigger}
  </span>
);

const BidiIsolate = ({
  children,
}: {
  children: React.ReactNode;
  locale?: string;
}) => <span>{children}</span>;

// ─── Local default data ────────────────────────────────────────────────────────

const localDefaultSlots: Slot[] = [
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

// ─── SuggestedAlternativesCarousel ────────────────────────────────────────────

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
        className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-6 text-center"
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
              <StatusChip tone={mapToneAlt(alt.status)} className="shrink-0">
                {alt.status}
              </StatusChip>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {alt.demand}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono tabular-nums">
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

function mapToneAlt(status: string) {
  const s = status.toLowerCase();
  if (s === "healthy" || s === "available") return "positive";
  if (s === "tight") return "warning";
  if (s === "busy" || s === "booked") return "danger";
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
  locale = "en",
}: SlotListProps) => {
  const [, setActiveTz] = useState<string>("UTC");
  const [, api] = useSpring(() => ({ x: 0 }));

  const [isDragging, setIsDragging] = useState(false);
  const [conflicts, setConflicts] = useState<Record<string, string>>({});

  const bind = useDrag((state) => {
    if (state.first) setIsDragging(true);
    if (state.last) setIsDragging(false);

    if (state.active) {
      const found: Record<string, string> = {};
      slots.forEach((s) => {
        if (s.status && s.status.toLowerCase() === "booked") {
          found[s.id] = "Existing booking";
        }
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

  const announce = useCallback((msg: string) => {
    setLiveMessage(msg);
    setTimeout(() => setLiveMessage(""), 3000);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const keys = Object.keys(conflicts);
      if (keys.length > 0) {
        announce(`${keys.length} blocked target${keys.length !== 1 ? "s" : ""}.`);
      } else {
        announce("No conflicts for current drag target.");
      }
    }
  }, [isDragging, conflicts, announce]);

  const toggleSelection = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const isShift = e && "shiftKey" in e && e.shiftKey;
      const isMeta = e && "metaKey" in e && (e.metaKey || e.ctrlKey);

      if (isShift && lastSelectedId.current) {
        const currentIndex = slots.findIndex((s) => s.id === id);
        const lastIndex = slots.findIndex((s) => s.id === lastSelectedId.current);
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

      announce(`${next.size} slot${next.size !== 1 ? "s" : ""} selected.`);
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

  const mapTone = (status: string) => {
    const s = status.toLowerCase();
    if (s === "healthy" || s === "available") return "positive";
    if (s === "tight") return "warning";
    if (s === "busy" || s === "booked") return "neutral";
    return "neutral";
  };

  const dir = getDir(locale);

  // Convert slot items for Minimap view
  const minimapSlots: MinimapSlot[] = slots.map((s) => {
    let status: MinimapSlot["status"] = "available";
    if (selectedIds.has(s.id)) {
      status = "selected";
    } else if (s.status.toLowerCase() === "booked" || s.status.toLowerCase() === "reserved") {
      status = "reserved";
    }
    return { id: s.id, status };
  });

  return (
    <div className="relative space-y-4" dir={dir}>
      {/* Timezone Ribbon Header */}
      <TimezoneRibbon
        supplierId={supplierId}
        supplierTimeZone={supplierTimeZone}
        supplierName={supplierName}
        onTimezoneChange={(_, activeTimeZone) => setActiveTz(activeTimeZone)}
      />

      {/* Suggested alternatives (rebooking flow) */}
      {suggestedAlternatives !== undefined && (
        <section aria-labelledby="rebook-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 id="rebook-heading" className="text-base font-semibold text-white">
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
      {slots.length === 0 ? (
        <EmptyStateCard
          title="No slots available"
          description="There are currently no scheduled availability slots for this supplier."
        />
      ) : (
        <ul className="space-y-4" {...bind()}>
          {slots.map((slot) => {
            const slotTitleId = `slot-${slot.id}-title`;
            const slotDetailsId = `slot-${slot.id}-details`;
            const isSelected = selectedIds.has(slot.id);

            return (
              <li
                key={slot.id}
                tabIndex={0}
                onClick={(e) => toggleSelection(slot.id, e)}
                onKeyDown={(e) => handleKeyDown(slot.id, e)}
                aria-pressed={isSelected}
                className={`relative cursor-pointer rounded-[1.5rem] border p-4 transition-all duration-200 sm:p-5 ${
                  isSelected
                    ? "border-cyan-400/80 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                    : "border-white/10 bg-white/[0.03] hover:border-cyan-400/30 hover:bg-white/[0.05]"
                }`}
                aria-describedby={conflicts[slot.id] ? `conflict-${slot.id}` : undefined}
              >
                {/* Conflict indicator */}
                {conflicts[slot.id] && (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 rounded-[1.5rem]"
                    style={{
                      backgroundColor: "rgba(220,38,38,0.12)",
                      backgroundImage:
                        "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 6px, transparent 6px 12px)",
                    }}
                    role="img"
                    aria-label={`Conflict: ${conflicts[slot.id]}`}
                  >
                    <span
                      id={`conflict-${slot.id}`}
                      className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-red-700/90 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      {conflicts[slot.id]}
                    </span>
                  </div>
                )}

                <article aria-labelledby={slotTitleId} aria-describedby={slotDetailsId}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 id={slotTitleId} className="text-lg font-semibold text-white">
                          {slot.title}
                        </h3>
                        {isJustAdded((slot as any).mintedAt) && (
                          <Tooltip
                            content="This slot was added within the last 24 hours."
                            trigger={
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[0.65rem] font-bold tracking-wider text-cyan-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
                                NEW
                              </span>
                            }
                            triggerClassName="inline-flex"
                          />
                        )}
                      </div>
                      <p className="text-sm text-slate-300" id={slotDetailsId}>
                        <BidiIsolate locale={locale}>{slot.dateLabel}</BidiIsolate>
                        <span aria-hidden="true"> · </span>
                        <BidiIsolate locale={locale}>{slot.timeRange}</BidiIsolate>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {slot.rate}
                      <HelpPopover
                        term={glossary?.rate}
                        triggerLabel="Help: slot rate and XLM pricing"
                      />
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      Rate details
                      <HelpPopover
                        term={glossary?.xlm}
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

      {/* Floating Minimap Overlay */}
      {slots.length > 0 && (
        <div className="sticky bottom-4 right-4 z-20 ml-auto w-fit hidden sm:block">
          <SlotPickerMinimap
            slots={minimapSlots}
            viewport={{ x: 0, y: 0, width: 100, height: 100 }}
            onPan={(pos) => console.log("Pan position:", pos)}
          />
        </div>
      )}

      {/* Live region for accessibility announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
    </div>
  );
};

export default SlotList;
