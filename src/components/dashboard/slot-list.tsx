import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { EmptyStateCard } from "../../app/components/empty-state-card";

// Note: Implementation includes swipe-left/right for day nav
// and swipe-up for detail reveal, with accessibility focus.
export const SlotList = () => {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(({ swipe: [swipeX, swipeY] }) => {
    if (swipeX !== 0) {
      console.log('Day navigation logic: ', swipeX > 0 ? 'Next' : 'Previous');
    }
    if (swipeY === -1) {
      console.log('Detail reveal logic');
    }
  });

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

                {/* Rate badge — annotated with HelpPopover for XLM and rate concepts */}
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

                {/* "Rate details" label — links to broader XLM explanation */}
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
}
