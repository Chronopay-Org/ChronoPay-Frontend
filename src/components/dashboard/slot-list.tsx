"use client";

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
import { EmptyStateCard } from "../../app/components/empty-state-card";
import { useToast } from "@/hooks/use-toast";

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
        const isSoldOut = slot.status === "Sold Out";

        return (
          <li
            key={slot.id}
            className={`rounded-[1.5rem] border border-white/10 p-4 sm:p-5 ${
              isSoldOut ? "bg-white/[0.01] opacity-60" : "bg-white/[0.03]"
            }`}
          >
            <article aria-labelledby={slotTitleId} aria-describedby={slotDetailsId}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h3 id={slotTitleId} className="text-lg font-semibold text-white">
                    {slot.title}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {slot.dateLabel} ·{" "}
                    <span className={isSoldOut ? "line-through opacity-70" : ""}>
                      {slot.timeRange}
                    </span>
                  </p>
                </div>
                <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
              </div>

              <div
                id={slotDetailsId}
                className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300"
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

                {/* "Rate details" label — links to broader XLM explanation */}
                <span className="inline-flex items-center gap-1.5">
                  Rate details
                  <HelpPopover
                    term={glossary.xlm}
                    triggerLabel="Help: XLM and Stellar network fees"
                  />
                </span>
              </div>

              {isSoldOut && (
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  {slot.nextAvailableHint ? (
                    <p className="text-sm text-slate-400">
                      Next: <span className="text-white font-medium">{slot.nextAvailableHint}</span>
                    </p>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() =>
                      toast({
                        variant: "success",
                        title: "Notification set",
                        description: `You will be notified when ${slot.title} becomes available.`,
                      })
                    }
                    className="text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
                    aria-label={`Notify me when ${slot.title} is available`}
                  >
                    Notify me
                  </button>
                </div>
              )}
            </article>
          </li>
        );
      })}
    </ul>
  );
};
