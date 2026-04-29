import Link from "next/link";

import { StatusChip } from "./status-chip";
import type { QuickAction, Tone } from "./types";

const toneLabels: Record<Tone, string> = {
  neutral: "Available",
  positive: "Ready",
  warning: "Needs review",
  critical: "Needs attention",
};

function toElementId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className="group rounded-[24px] border border-white/10 bg-slate-900/80 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{action.title}</h3>
              <p className="helper-text mt-2">
                {action.description}
              </p>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
