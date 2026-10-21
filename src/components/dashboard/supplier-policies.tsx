"use client";
import { PanelShell } from "./panel-shell";
import { Ban, CalendarClock, Loader2, RotateCcw, ShieldQuestion } from "lucide-react";

export interface SupplierPolicy {
  id: string;
  title: string;
  description: string;
  icon: "cancellation" | "refund" | "rescheduling" | "late";
}

const ICON_MAP = { cancellation: Ban, refund: RotateCcw, rescheduling: CalendarClock, late: ShieldQuestion };

const DEFAULT_POLICIES: SupplierPolicy[] = [
  { id: "cancellation", title: "Cancellation", description: "Full refund if cancelled at least 24 hours before the scheduled start time.", icon: "cancellation" },
  { id: "refund", title: "Refund Window", description: "No-show or cancellation within 24 hours is non-refundable.", icon: "refund" },
  { id: "rescheduling", title: "Rescheduling", description: "One free reschedule with at least 12 hours notice.", icon: "rescheduling" },
  { id: "late", title: "Late Arrival", description: "More than 15 minutes late may shorten the session.", icon: "late" },
];

export function SupplierPolicies({ policies = DEFAULT_POLICIES, loading = false }: { policies?: SupplierPolicy[]; loading?: boolean }) {
  if (loading) {
    return (
      <PanelShell id="policies" title="Policies" description="Booking and cancellation policies">
        <div className="flex items-center justify-center py-8 text-slate-400" role="status"><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Loading policies…</div>
      </PanelShell>
    );
  }
  if (!policies.length) {
    return (
      <PanelShell id="policies" title="Policies" description="Booking and cancellation policies">
        <p className="py-8 text-center text-sm text-slate-400" data-testid="policies-empty">No policies have been published yet.</p>
      </PanelShell>
    );
  }
  return (
    <PanelShell id="policies" title="Policies" description="Booking and cancellation policies">
      <ul className="divide-y divide-white/5">
        {policies.map((p) => {
          const Icon = ICON_MAP[p.icon] ?? ShieldQuestion;
          return (
            <li key={p.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                <Icon className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{p.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </PanelShell>
  );
}
