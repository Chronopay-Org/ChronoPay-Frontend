import { useEffect, useMemo, useState } from "react";
import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import type { Slot } from "./types";
import { EmptyStateCard } from "../../app/components/empty-state-card";
import DurationChips from "./DurationChips";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { slots as allSlots } from "./dashboard-data";

export const SlotList = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paramDuration = parseInt(searchParams?.get("duration") ?? "", 10);

  const [durationFilter, setDurationFilter] = useState<number | null>(
    Number.isFinite(paramDuration) && paramDuration > 0 ? paramDuration : null
  );

  // Sync URL when filter changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (durationFilter) {
      params.set("duration", String(durationFilter));
    } else {
      params.delete("duration");
    }
    const url = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationFilter]);

  const counts = useMemo(() => {
    const m: Record<number, number> = {};
    for (const s of allSlots) {
      const d = s.durationMinutes ?? 0;
      m[d] = (m[d] ?? 0) + 1;
    }
    return m;
  }, []);

  const filtered = useMemo<Slot[]>(() => {
    if (!durationFilter) return allSlots;
    return allSlots.filter((s) => (s.durationMinutes ?? 0) === durationFilter);
  }, [durationFilter]);

  function mapTone(status: string) {
    switch (status) {
      case "Healthy":
        return "positive" as const;
      case "Tight":
        return "warning" as const;
      case "Busy":
        return "critical" as const;
      default:
        return "neutral" as const;
    }
  }

  return (
    <div>
      <div className="mb-4">
        <DurationChips
          counts={{ 15: counts[15] ?? 0, 30: counts[30] ?? 0, 60: counts[60] ?? 0 }}
          initial={durationFilter ?? undefined}
          onChange={(m) => setDurationFilter(m)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyStateCard
          eyebrow="No slots"
          title="No slots match your filters"
          description="Try removing the duration filter or broaden your search to see available times."
          accentLabel="No results"
          status={{ label: "No results", tone: "neutral" }}
          guidance={["Clear filters", "Try other dates"]}
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((slot) => {
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
      )}
    </div>
  );
};
