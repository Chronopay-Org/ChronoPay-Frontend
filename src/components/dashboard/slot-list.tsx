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
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center">
      <p className="text-sm font-semibold text-white">
        {filtered ? "No slots match these filters." : "No time slots listed yet."}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {filtered
          ? `Try widening ${filterLabel ?? "the current filters"} to bring more availability back into view.`
          : "Add an availability block when you are ready to sell or reserve time."}
      </p>
    </div>
  );
}

export function SlotList({
  slots,
  totalSlotCount = slots.length,
  filterLabel,
}: {
  slots: Slot[];
  totalSlotCount?: number;
  filterLabel?: string;
}) {
  if (slots.length === 0) {
    return (
      <SlotState filtered={totalSlotCount > 0} filterLabel={filterLabel} />
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[46rem]">
        <div
          className="grid grid-cols-[minmax(14rem,1.7fr)_8rem_8.5rem_9rem_7.5rem] items-center gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
          aria-hidden="true"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-white">{slot.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{slot.window}</p>
            </div>
            <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
          </div>
          <div className="helper-text helper-text--muted mt-4 flex flex-wrap gap-3">
            <span>{slot.demand}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              {slot.rate}
              <Tooltip content="Hourly rate in Stellar Lumens (XLM). Includes network fees and escrow protection." />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
