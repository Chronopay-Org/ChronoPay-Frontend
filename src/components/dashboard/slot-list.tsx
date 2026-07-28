import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";

function mapTone(status: Slot["status"]) {
  if (status === "Healthy") return "positive" as const;
  if (status === "Tight") return "warning" as const;
  return "critical" as const;
}

export function SlotList({ slots }: { slots: Slot[] }) {
  if (slots.length === 0) {
    return <p className="helper-text helper-text--muted">No time slots available right now.</p>;
  }

  return (
    <div className="space-y-6">
      {suggestedAlternatives ? (
        <section
          aria-labelledby="alternative-slots-heading"
          className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Suggested alternatives
              </p>
              <h2
                id="alternative-slots-heading"
                className="mt-2 text-lg font-semibold text-white"
              >
                Rebook a matching slot with one tap.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                We found the top three slots that match your preferred price and
                time of day. Swipe through options or use arrow keys to compare
                before you rebook.
              </p>
            </div>
          </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                  {slot.rate}
                  <HelpPopover
                    term={glossary.rate}
                    triggerLabel="Help: slot rate and XLM pricing"
                  />
                </span>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-400">Rate</span>
                        <span className="font-semibold text-white">
                          {slot.rate}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-slate-400">Demand</span>
                        <span className="font-semibold text-white">
                          {slot.demand}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <ButtonLink
                        href={`/dashboard/slots/${slot.id}`}
                        variant="primary"
                        size="sm"
                        className="w-full"
                      >
                        Book
                      </ButtonLink>
                      <ButtonLink
                        href={`/dashboard/slots/${slot.id}#compare`}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        Compare
                      </ButtonLink>
                    </div>

                    <p className="text-xs text-slate-400">
                      Matched price and time-of-day for a smooth rebooking
                      experience.
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <ul className="space-y-4">
        {slots.map((slot) => {
          const slotTitleId = `slot-${slot.id}-title`;
          const slotDetailsId = `slot-${slot.id}-details`;

          return (
            <li
              key={slot.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <article
                aria-labelledby={slotTitleId}
                aria-describedby={slotDetailsId}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h3
                      id={slotTitleId}
                      className="text-lg font-semibold text-white"
                    >
                      {slot.title}
                    </h3>
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

                <span className="inline-flex items-center gap-1.5">
                  Rate details
                  <HelpPopover
                    term={glossary.xlm}
                    triggerLabel="Help: XLM and Stellar network fees"
                  />
                </span>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
};
