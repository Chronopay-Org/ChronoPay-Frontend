import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { Status } from "./types";

const items: { status: Status; icon: React.ElementType; label: string; bg: string }[] = [
  { status: "operational", icon: CheckCircle2, label: "Operational", bg: "bg-emerald-500" },
  { status: "degraded", icon: AlertTriangle, label: "Degraded", bg: "bg-amber-500" },
  { status: "outage", icon: XCircle, label: "Outage", bg: "bg-rose-500" },
  { status: "unknown", icon: HelpCircle, label: "Unknown", bg: "bg-slate-500" },
];

export function StatusLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-4"
      role="list"
      aria-label="Status legend"
    >
      {items.map(({ status, icon: Icon, label, bg }) => (
        <div key={status} className="flex items-center gap-1.5" role="listitem">
          <span className={`inline-flex h-4 w-4 items-center justify-center rounded ${bg}`}>
            <Icon className="h-3 w-3 text-white" aria-hidden="true" />
          </span>
          <span className="text-xs text-slate-400">{label}</span>
        </div>
      ))}
    </div>
  );
}
