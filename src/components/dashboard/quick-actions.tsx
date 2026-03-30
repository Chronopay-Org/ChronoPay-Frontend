import Link from "next/link";

import { StatusChip } from "./status-chip";
import type { QuickAction } from "./types";

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className="group rounded-[24px] border border-white/10 bg-slate-900/80 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {action.description}
              </p>
            </div>
            <StatusChip tone={action.tone}>{action.tone}</StatusChip>
          </div>
          <p className="mt-5 text-sm font-medium text-cyan-200 transition group-hover:text-cyan-100">
            Open workflow
          </p>
        </Link>
      ))}
    </div>
  );
}
