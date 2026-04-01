import { StatusChip } from "./status-chip";
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
  return (
    <ul className="space-y-3" aria-label="Available time slots">
      {slots.map((slot) => (
        <li
          key={slot.id}
          className="rounded-[22px] border border-white/10 bg-white/5 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">{slot.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{slot.window}</p>
            </div>
            <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
            <span>{slot.demand}</span>
            <span className="text-slate-600">•</span>
            <span>{slot.rate}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
