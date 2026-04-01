import type { BookingStage } from "./types";

export function BookingProgress({ stages }: { stages: BookingStage[] }) {
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);

  return (
    <div className="space-y-5">
      {stages.map((stage) => (
        <div key={stage.label}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">{stage.label}</p>
            <p className="text-sm text-slate-300">{stage.value} bookings</p>
          </div>
          <div
            className="h-2.5 rounded-full bg-white/10"
            aria-hidden="true"
          >
            <div
              className="h-2.5 rounded-full bg-[linear-gradient(90deg,#67e8f9,#22c55e)]"
              style={{ width: `${(stage.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
