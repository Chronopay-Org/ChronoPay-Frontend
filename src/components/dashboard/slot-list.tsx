"use client";

import Link from "next/link";
import { ButtonLink } from "@/app/components/ui/button-link";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { ResumedBadge } from "@/app/components/ui/resumed-badge";
import { EmptyStateCard } from "@/app/components/empty-state-card";
import { glossary } from "@/lib/glossary";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { StatusChip } from "./status-chip";
import { SocialProofBadges } from "./social-proof-badges";
import { SampleBadge } from "./sample-badge";
import type { Slot } from "./types";

function mapTone(status: Slot["status"]) {
  if (status === "Healthy") {
    return "positive";
  }

  if (status === "Tight") {
    return "warning";
  }

  return "critical";
}

export function SlotList({ slots }: { slots: Slot[] }) {
  const { containerRef, restoredItemId, markItemAsViewed } =
    useScrollRestoration("slot-list");

  if (slots.length === 0) {
    return (
      <EmptyStateCard
        eyebrow="Slots"
        title="No time slots listed yet"
        description="Add an availability block when you are ready to sell or reserve time."
        accentLabel="Slots"
        status={{ label: "Empty", tone: "neutral" }}
        guidance={[
          "Create your first availability block to begin selling time.",
          "Set clear availability windows so customers can book reliably.",
        ]}
        actions={
          <ButtonLink href="/dashboard#quick-actions" variant="primary" size="md">
            Add availability
          </ButtonLink>
        }
      />
    );
  }

  return (
    <ul ref={containerRef} className="space-y-4" aria-label="Available time slots">
      {slots.map((slot) => {
        const slotTitleId = `slot-${slot.id}-title`;
        const slotDetailsId = `slot-${slot.id}-details`;
        const isRestored = restoredItemId === slot.id;

        return (
          <li
            key={slot.id}
            id={`list-item-${slot.id}`}
            className="group relative rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05] sm:p-5"
            data-sample={slot.isSample ? "true" : undefined}
          >
            {isRestored ? <ResumedBadge itemId={slot.id} /> : null}
            <Link
              href={`/dashboard/slots/${slot.id}`}
              onClick={() => markItemAsViewed(slot.id)}
              className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <article
                aria-labelledby={slotTitleId}
                aria-describedby={slotDetailsId}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        id={slotTitleId}
                        className="text-lg font-semibold text-white transition-colors group-hover:text-cyan-200"
                      >
                        {slot.title}
                      </h3>
                      {slot.isSample ? <SampleBadge /> : null}
                    </div>
                    <p className="text-sm text-slate-300">
                      {slot.dateLabel} · {slot.timeRange}
                    </p>
                  </div>
                  <StatusChip tone={mapTone(slot.status)}>
                    {slot.status}
                  </StatusChip>
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

                  {slot.badges && slot.badges.length > 0 ? (
                    <div className="mt-2 w-full">
                      <SocialProofBadges badges={slot.badges} maxVisible={2} />
                    </div>
                  ) : null}
                </div>
              </article>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
