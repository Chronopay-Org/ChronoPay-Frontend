"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveRegion } from "@/components/common/LiveRegion";

const PRESET_MINUTES = [15, 30, 60] as const;
type Minutes = typeof PRESET_MINUTES[number];

export function DurationChips({
  counts,
  initial,
  onChange,
}: {
  counts: Record<number, number>;
  initial?: number | null;
  onChange?: (minutes: number | null) => void;
}) {
  const [selected, setSelected] = useState<number | null>(initial ?? null);
  const [liveMessage, setLiveMessage] = useState<string>("");

  useEffect(() => {
    if (onChange) onChange(selected);
    if (selected) {
      const n = counts[selected] ?? 0;
      setLiveMessage(`${selected}-minute filter applied, ${n} result${n === 1 ? "" : "s"}`);
    } else {
      setLiveMessage("Duration filter cleared");
    }
  }, [selected, counts, onChange]);

  const buttons = useMemo(() => PRESET_MINUTES, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {buttons.map((m) => {
        const count = counts[m] ?? 0;
        const pressed = selected === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={pressed}
            onClick={() => setSelected(pressed ? null : m)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${pressed ? "bg-cyan-600/40 border-cyan-300 text-white" : "bg-white/4 border-white/8 text-slate-200"}`}
          >
            <span>{m}m</span>
            <span className="inline-flex items-center justify-center rounded-full bg-white/8 px-2 py-0.5 text-xs font-medium">
              {count}
            </span>
          </button>
        );
      })}

      <LiveRegion>{liveMessage}</LiveRegion>
    </div>
  );
}

export default DurationChips;
