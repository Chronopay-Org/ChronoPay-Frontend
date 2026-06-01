import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";
import type { Slot } from "./types";
import { EmptyStateCard } from "../../app/components/empty-state-card";

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
    <ul className="space-y-4">
      {slots.map((slot) => {
        const slotTitleId = `slot-${slot.id}-title`;
        const slotDetailsId = `slot-${slot.id}-details`;

        return (
          <li
            key={slot.id}
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5"
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
                <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                  {slot.rate}
                </span>
                {slot.isNextAvailable ? (
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">
                    Next available
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  Rate details
                  <Tooltip content="Hourly rate in Stellar Lumens. Includes network fees and escrow protection." />
                </span>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
