"use client";

import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
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

type SlotListProps = {
  slots: Slot[];
  suggestedAlternatives?: Slot[];
};

export const SlotList = ({ slots, suggestedAlternatives }: SlotListProps) => {
  const [focusedAlternativeIndex, setFocusedAlternativeIndex] = useState(0);
  const alternativeCardRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    if (!suggestedAlternatives || suggestedAlternatives.length === 0) return;
    setFocusedAlternativeIndex(0);
  }, [suggestedAlternatives]);

  useEffect(() => {
    if (!suggestedAlternatives || suggestedAlternatives.length === 0) return;
    const element = alternativeCardRefs.current[focusedAlternativeIndex];
    if (element) {
      element.focus({ preventScroll: true });
      element.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [focusedAlternativeIndex, suggestedAlternatives]);

  const handleAlternativeKeyDown = (
    event: React.KeyboardEvent<HTMLLIElement>,
    index: number,
  ) => {
    if (!suggestedAlternatives) return;

    if (
      event.key === "ArrowRight" &&
      index < suggestedAlternatives.length - 1
    ) {
      event.preventDefault();
      setFocusedAlternativeIndex(index + 1);
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      setFocusedAlternativeIndex(index - 1);
    }
  };

  const counts = {
    anytime: slots.length,
    morning: slots.filter(s => getTimeOfDay(s.timeRange) === "morning").length,
    afternoon: slots.filter(s => getTimeOfDay(s.timeRange) === "afternoon").length,
    evening: slots.filter(s => getTimeOfDay(s.timeRange) === "evening").length,
  };

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

          <div className="mt-5">
            {suggestedAlternatives.length === 0 ? (
              <EmptyStateCard
                eyebrow="Suggestions"
                title="No matching alternatives found"
                description="We could not find another slot that matches price and time-of-day closely enough. Try widening your search criteria or check back later."
                accentLabel="No alternatives"
                status={{ label: "Unavailable", tone: "warning" }}
                guidance={[
                  "Expand the search window to include adjacent time blocks.",
                  "Check for other sellers offering the same hourly rate.",
                ]}
              />
            ) : (
              <ul
                className="flex gap-4 snap-x snap-mandatory touch-pan-x overflow-x-auto pb-2"
                aria-roledescription="carousel"
              >
                {suggestedAlternatives.map((slot, index) => (
                <li
                  key={slot.id}
                  ref={(element) => {
                    alternativeCardRefs.current[index] = element;
                  }}
                  tabIndex={index === focusedAlternativeIndex ? 0 : -1}
                  onKeyDown={(event) => handleAlternativeKeyDown(event, index)}
                  aria-label={`Alternative slot: ${slot.title}, ${slot.dateLabel} ${slot.timeRange}`}
                  className={`min-w-[260px] max-w-[260px] snap-start rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    index === focusedAlternativeIndex
                      ? "ring-1 ring-cyan-300/50"
                      : ""
                  }`}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        {slot.dateLabel}
                      </p>
                      <h3 className="text-base font-semibold text-white">
                        {slot.title}
                      </h3>
                      <p className="text-sm text-slate-300">{slot.timeRange}</p>
                    </div>

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
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
