import { useId } from "react";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import type { BookingStage } from "./types";

export function BookingProgress({ stages }: { stages: BookingStage[] }) {
  const headingId = useId();
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <div className="space-y-5">
      {/* Heading row */}
      <div className="flex items-center gap-2 mb-1">
        <p
          id={headingId}
          className="text-xs font-medium uppercase tracking-wide text-slate-400"
        >
          Booking stages
        </p>
        <HelpPopover
          term={glossary.bookingStages}
          triggerLabel="Help: booking lifecycle stages"
        />
      </div>

      {/*
        role="list" is required because the children carry role="listitem".
        Without the list container the ARIA relationship is broken and some
        screen readers will not announce list semantics.
      */}
      <div role="list" aria-labelledby={headingId} className="space-y-5">
        {stages.map((stage, index) => {
          const labelId = `booking-label-${headingId}-${index}`;
          const valueId = `booking-value-${headingId}-${index}`;
          const pct = Math.round((stage.value / maxValue) * 100);

          return (
            <div
              key={`${stage.label}-${index}`}
              role="listitem"
              aria-labelledby={labelId}
              aria-describedby={valueId}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p id={labelId} className="text-sm font-medium text-white">
                  {stage.label}
                </p>
                <p
                  id={valueId}
                  className="text-sm text-slate-300 tabular-nums"
                  aria-atomic="true"
                >
                  {stage.value} bookings
                </p>
              </div>

              {/*
                The progress bar is decorative — the value is already conveyed
                by the text above. A native <progress> is used so assistive
                technologies that expose it via the accessibility tree get the
                percentage for free; it is then styled to match the design.
              */}
              <progress
                value={stage.value}
                max={maxValue}
                aria-label={`${stage.label}: ${pct}% of peak`}
                className="block h-2.5 w-full overflow-hidden rounded-full"
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  background: "rgba(255,255,255,0.1)",
                  accentColor: "transparent",
                }}
              >
                {/* Fallback bar for browsers that don't style <progress> */}
                <div
                  className="h-2.5 rounded-full bg-[linear-gradient(90deg,#67e8f9,#22c55e)]"
                  style={{ width: `${pct}%` }}
                />
              </progress>
              {/*
                Custom CSS-rendered bar overlaid via a sibling span.
                This approach lets us keep the accessible <progress> in the DOM
                while applying the design-system gradient that ::-webkit-progress-value
                can't easily target in Tailwind.
              */}
              <span
                aria-hidden="true"
                className="-mt-2.5 block h-2.5 rounded-full bg-[linear-gradient(90deg,#67e8f9,#22c55e)] pointer-events-none"
                style={{ width: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
