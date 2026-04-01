import type { Tone } from "./types";

const toneClasses: Record<Tone, string> = {
  neutral: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  positive: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  critical: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

export function StatusChip({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
