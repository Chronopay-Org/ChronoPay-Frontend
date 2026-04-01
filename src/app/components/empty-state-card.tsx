import type { ReactNode } from "react";
import { EmptyStateIllustration } from "./empty-state-illustration";
import { StatusChip } from "./ui/status-chip";

type EmptyStateCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  accentLabel: string;
  status: {
    label: string;
    tone?: "info" | "warning" | "success" | "danger" | "neutral";
  };
  guidance: string[];
  actions?: ReactNode;
};

export function EmptyStateCard({
  eyebrow,
  title,
  description,
  accentLabel,
  status,
  guidance,
  actions,
}: EmptyStateCardProps) {
  return (
    <section className="glass-panel rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          {eyebrow}
        </p>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </div>
      <div className="mt-4">
        <EmptyStateIllustration accentLabel={accentLabel} />
      </div>
      <div className="mt-5 space-y-3">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="max-w-xl text-sm leading-6 text-slate-300">{description}</p>
        <ul className="space-y-2 text-sm text-slate-300" aria-label={`${title} guidance`}>
          {guidance.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
