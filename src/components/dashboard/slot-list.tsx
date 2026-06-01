import { StatusChip } from "./status-chip";
import { Tooltip } from "@/app/components/ui/tooltip";
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

function toElementId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function SlotList({ slots }: { slots: Slot[] }) {
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center">
        <p className="text-sm font-semibold text-white">
          No time slots listed yet.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
          Add an availability block when you are ready to sell or reserve time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="feed" aria-label="Available Time Slots">
      {slots.map((slot) => {
        const tone = mapTone(slot.status);
        const headingId = `slot-title-${toElementId(slot.id)}`;

        return (
          <article
            key={slot.id}
            aria-labelledby={headingId}
            className="group relative rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition-all duration-300 hover:border-cyan-400/30 hover:bg-slate-900/90 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Left Side: Meta & Title */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={tone}>{slot.status}</StatusChip>
                  {slot.isNextAvailable && (
                    <span className="inline-flex items-center rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-cyan-200 border border-cyan-400/20">
                      ⚡ NEXT AVAILABLE
                    </span>
                  )}
                </div>
                <h3
                  id={headingId}
                  className="text-lg font-bold text-white transition group-hover:text-cyan-300"
                >
                  {slot.title}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 text-cyan-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {slot.dateLabel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 text-cyan-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {slot.timeRange}
                  </span>
                </div>
              </div>

              {/* Middle Side: Demand Indicators */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {slot.demand}
                </span>
              </div>

              {/* Right Side: Rate & CTA Button */}
              <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4 sm:flex-col sm:items-end sm:justify-center sm:border-none sm:pt-0">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Hourly Rate</p>
                  <p className="text-lg font-bold text-cyan-300">{slot.rate}</p>
                </div>
                <Link
                  href={`/dashboard/slots/${slot.id}`}
                  className="inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 px-4 py-2 text-sm border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-400/20 hover:text-white"
                >
                  View / Book
                  <span className="sr-only"> {slot.title} on {slot.dateLabel}</span>
                  <svg
                    aria-hidden="true"
                    className="ml-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

