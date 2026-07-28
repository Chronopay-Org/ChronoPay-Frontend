"use client";

import { useState, useEffect, useId, useCallback } from "react";
import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { ResumedBadge } from "@/app/components/ui/resumed-badge";
import { EmptyStateCard } from "@/app/components/empty-state-card";
import { glossary } from "@/lib/glossary";
import type { Slot, AvailabilityLevel, SlotPickerDensity, HourlySlotBand } from "./types";
import { slots as defaultSlots } from "./dashboard-data";
import { EmptyStateCard } from "../../app/components/empty-state-card";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Layers,
  Grid,
  ListFilter,
  Sparkles,
} from "lucide-react";

import { slots as defaultSlots } from "./dashboard-data";

function mapTone(status: string) {
  if (status === "available") return "positive";
  if (status === "booked") return "neutral";
  return "warning";
}

export const SlotList = ({ slots = defaultSlots }: { slots?: Slot[] } = {}) => {
  return (
    <div className={`space-y-4 ${className}`} id={`slot-picker-${componentId}`}>
      {/* Live Region for Screen Reader Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="aria-announcement"
      >
        {announcement}
      </div>

      {/* Picker Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
            {isCompactMode ? (
              <Layers className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Grid className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {totalSlotsCount} {totalSlotsCount === 1 ? "Slot" : "Slots"}
              </span>
              {isHighDensity && (
                <span
                  data-testid="high-density-badge"
                  className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-200"
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  High-density day ({totalSlotsCount})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isCompactMode
                ? `Grouped into ${hourlyBands.length} hourly bands`
                : "Displaying individual slots in full detail"}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Density Mode Segmented Selector */}
          <div
            role="group"
            aria-label="Slot picker density mode"
            className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1 text-xs"
          >
            <button
              type="button"
              onClick={() => handleDensityChange("auto")}
              aria-pressed={density === "auto"}
              data-testid="density-btn-auto"
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                density === "auto"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Auto ({autoCompactThreshold}+)
            </button>
            <button
              type="button"
              onClick={() => handleDensityChange("full")}
              aria-pressed={density === "full"}
              data-testid="density-btn-full"
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                density === "full"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Full
            </button>
            <button
              type="button"
              onClick={() => handleDensityChange("compact")}
              aria-pressed={density === "compact"}
              data-testid="density-btn-compact"
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                density === "compact"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Compact Bands
            </button>
          </div>

          {/* Quick Expand / Collapse Controls when in Compact Mode */}
          {isCompactMode && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAllBands}
                data-testid="expand-all-btn"
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                aria-label="Expand all hourly bands"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAllBands}
                data-testid="collapse-all-btn"
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                aria-label="Collapse all hourly bands"
              >
                Collapse all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isCompactMode ? (
        <ul
          className="space-y-3"
          aria-label="Hourly aggregate bands"
          data-testid="compact-bands-container"
        >
          {hourlyBands.map((band) => {
            const isExpanded = !!expandedBands[band.hourKey];
            const bandHeaderId = `band-header-${band.hourKey}`;
            const bandContentId = `band-content-${band.hourKey}`;

            return (
              <li
                key={band.hourKey}
                className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden transition-all duration-200"
                data-testid={`band-${band.hourKey}`}
              >
                {/* Collapsed Band Chip Header / Trigger */}
                <button
                  type="button"
                  id={bandHeaderId}
                  aria-expanded={isExpanded}
                  aria-controls={bandContentId}
                  data-testid={`band-toggle-${band.hourKey}`}
                  onClick={() =>
                    toggleBand(band.hourKey, band.hourLabel, band.totalSlots)
                  }
                  className="w-full flex flex-col gap-3 p-4 sm:p-4 text-left hover:bg-white/[0.04] transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-400 shrink-0" aria-hidden="true" />
                      <span className="text-base font-semibold text-white tracking-wide">
                        {band.hourLabel}
                      </span>
                    </div>

                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {band.totalSlots} {band.totalSlots === 1 ? "slot" : "slots"}
                    </span>

                    {band.hasNextAvailable && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                        Next available
                      </span>
                    )}

                    <span className="text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      {band.rateRange}
                    </span>
                  </div>

                  {/* Status Breakdown & Expand Chevron */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      {band.statusCounts.Healthy > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-medium text-emerald-300"
                          title={`${band.statusCounts.Healthy} Healthy slots`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {band.statusCounts.Healthy} Healthy
                        </span>
                      )}
                      {band.statusCounts.Tight > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-medium text-amber-300"
                          title={`${band.statusCounts.Tight} Tight slots`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {band.statusCounts.Tight} Tight
                        </span>
                      )}
                      {band.statusCounts.Busy > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 font-medium text-rose-300"
                          title={`${band.statusCounts.Busy} Busy slots`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                          {band.statusCounts.Busy} Busy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-cyan-300 font-medium ml-2">
                      <span>{isExpanded ? "Collapse" : "Expand"}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Slots Container */}
                {isExpanded && (
                  <div
                    id={bandContentId}
                    role="region"
                    aria-labelledby={bandHeaderId}
                    data-testid={`band-content-${band.hourKey}`}
                    className="border-t border-white/10 bg-black/20 p-3 sm:p-4 space-y-3"
                  >
                    <ul className="space-y-3" aria-label={`Slots for ${band.hourLabel}`}>
                      {band.slots.map((slot) => (
                        <SlotCard key={slot.id} slot={slot} />
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        /* Full Expanded List */
        <ul
          className="space-y-4"
          aria-label="All available time slots"
          data-testid="full-slots-container"
        >
          {slots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} />
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * Individual Slot Card Component
 */
function SlotCard({ slot }: { slot: Slot }) {
  const slotTitleId = `slot-${slot.id}-title`;
  const slotDetailsId = `slot-${slot.id}-details`;

  return (
    <li
      className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5 transition-all hover:border-white/20"
      data-testid={`slot-card-${slot.id}`}
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

          {/* Rate badge annotated with HelpPopover for XLM and rate concepts */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
            {slot.rate}
            <HelpPopover
              term={glossary.rate}
              triggerLabel={`Help: rate details for ${slot.title}`}
            />
          </span>

          {slot.isNextAvailable ? (
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">
              Next available
            </span>
          ) : null}

          {/* "Rate details" label with HelpPopover for XLM */}
          <span className="inline-flex items-center gap-1.5">
            Rate details
            <HelpPopover
              term={glossary.xlm}
              triggerLabel={`Help: XLM network details for ${slot.title}`}
            />
          </span>
        </div>
      </article>
    </li>
  );
};
