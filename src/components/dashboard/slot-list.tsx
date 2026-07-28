"use client";

import Link from "next/link";
import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { SocialProofBadges } from "./social-proof-badges";
import { EmptyStateCard } from "../../app/components/empty-state-card";
import { glossary } from "@/lib/glossary";
import type { Slot, Tone } from "./types";

// ─── Tone mapping ─────────────────────────────────────────────────────────────

function mapTone(status: Slot["status"]): Tone {
  if (status === "Healthy") return "positive";
  if (status === "Tight") return "warning";
  return "critical";
}

// ─── SlotRow ──────────────────────────────────────────────────────────────────

function SlotRow({ slot }: { slot: Slot }) {
  const slotTitleId = `slot-${slot.id}-title`;
  const slotDetailsId = `slot-${slot.id}-details`;

  return (
    <li className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5 transition-colors hover:border-white/20">
      <article aria-labelledby={slotTitleId} aria-describedby={slotDetailsId}>
        {/* Title row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h3 id={slotTitleId} className="text-lg font-semibold text-white">
              {slot.title}
            </h3>
            <p className="text-sm text-slate-300">
              <span className="font-mono tabular-nums">{slot.dateLabel}</span>
              {" · "}
              <span className="font-mono tabular-nums">{slot.timeRange}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {slot.isNextAvailable && (
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                Next available
              </span>
            )}
            <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
          </div>
        </div>

        {/* Detail row */}
        <div
          id={slotDetailsId}
          className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300"
        >
          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
            {slot.demand}
          </span>

          {/* Rate — annotated with HelpPopover for XLM */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
            <span className="font-mono tabular-nums">{slot.rate}</span>
            <HelpPopover
              term={glossary.rate}
              triggerLabel="Help: slot rate and XLM pricing"
            />
          </span>

          {/* XLM explanation */}
          <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs">
            Rate details
            <HelpPopover
              term={glossary.xlm}
              triggerLabel="Help: XLM and Stellar network fees"
            />
          </span>
        </div>

        {/* Social proof badges */}
        {slot.badges && slot.badges.length > 0 && (
          <div className="mt-4">
            <SocialProofBadges badges={slot.badges} maxVisible={3} />
          </div>
        )}

        {/* Action */}
        <div className="mt-5 flex justify-end">
          <ButtonLink
            href={`/dashboard/slots/${slot.id}`}
            variant="secondary"
            size="sm"
          >
            View slot
          </ButtonLink>
        </div>
      </article>
    </li>
  );
}

// ─── SlotList ─────────────────────────────────────────────────────────────────

export function SlotList({ slots }: { slots: Slot[] }) {
  if (slots.length === 0) {
    return (
      <EmptyStateCard
        title="No time slots yet"
        description="List your first availability block to start accepting bookings."
        action={
          <ButtonLink href="/dashboard" variant="primary" size="sm">
            List a slot
          </ButtonLink>
        }
      />
    );
  }

  return (
    <ul
      className="space-y-4"
      aria-label="Available time slots"
    >
      {slots.map((slot) => (
        <SlotRow key={slot.id} slot={slot} />
      ))}
    </ul>
  );
}
