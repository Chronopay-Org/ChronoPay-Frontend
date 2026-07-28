"use client";

import { useId } from "react";
import { CalendarDays, Ban } from "lucide-react";
import { ButtonLink } from "@/app/components/ui/button-link";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import type { HolidayHint, RegionInfo } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface HolidayHintsStripProps {
  /** Upcoming public holidays for the supplier's region. */
  holidays: HolidayHint[];
  /** Region the holidays are sourced from. */
  region: RegionInfo;
  /** Optional className for the outermost wrapper. */
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRegionLabel(region: RegionInfo): string {
  return `${region.name} (${region.code})`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HolidayHintsStrip({
  holidays,
  region,
  className = "",
}: HolidayHintsStripProps) {
  const stripId = useId();
  const titleId = `${stripId}-title`;
  const hasHolidays = holidays.length > 0;

  return (
    <section
      aria-labelledby={titleId}
      className={`rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6 ${className}`}
    >
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            {formatRegionLabel(region)}
          </p>
          <div>
            <h2
              id={titleId}
              className="flex items-center gap-2 text-xl font-semibold text-white"
            >
              Upcoming Holidays
              <HelpPopover
                term={glossary.holidayHints}
                triggerLabel="Help: what are holiday hints?"
              />
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
              {hasHolidays
                ? "Plan ahead — block these days to prevent accidental bookings when you're unavailable."
                : "No upcoming public holidays in your region."}
            </p>
          </div>
        </div>
        {/* Region badge */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100"
          aria-label={`Holidays sourced for ${region.name}`}
        >
          <HelpPopover
            term={glossary.regionHolidays}
            triggerLabel="Help: how are regional holidays determined?"
          />
          <span>Region: {region.code}</span>
        </span>
      </div>

      {/* ── Holiday chips strip ── */}
      <div className="pt-5">
        {hasHolidays ? (
          <ul
            className="flex flex-wrap gap-3"
            aria-label={`Upcoming public holidays for ${region.name}`}
          >
            {holidays.map((holiday) => (
              <li
                key={holiday.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5"
              >
                {/* Calendar icon */}
                <CalendarDays
                  className="h-5 w-5 flex-shrink-0 text-cyan-300"
                  aria-hidden
                />

                {/* Holiday info */}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                    {holiday.name}
                    {holiday.isMoving && (
                      <span
                        className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200"
                        aria-label="Moveable holiday — date changes each year"
                      >
                        Moveable
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{holiday.dateLabel}</p>
                </div>

                {/* Block day action */}
                <ButtonLink
                  href={`/dashboard?block=${holiday.date}`}
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 gap-1.5 text-rose-300 hover:text-rose-200"
                  aria-label={`Block ${holiday.name} — ${holiday.dateLabel}`}
                >
                  <Ban className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Block day</span>
                </ButtonLink>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-5 text-sm text-slate-400"
            role="status"
          >
            <CalendarDays className="h-5 w-5 flex-shrink-0 text-slate-500" aria-hidden />
            <p>
              No upcoming public holidays for {region.name}.{" "}
              <span className="text-slate-500">
                Update your region in{" "}
                <a
                  href="/dashboard/settings"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  Settings
                </a>{" "}
                if this looks wrong.
              </span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
