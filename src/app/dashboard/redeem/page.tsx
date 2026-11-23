"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { BreadcrumbOverflow } from "@/app/components/ui/breadcrumb-overflow";
import { StatusChip } from "@/components/dashboard/status-chip";
import { mockSlots } from "@/components/dashboard/dashboard-data";
import type { Slot, Tone } from "@/components/dashboard/types";
import {
  RedemptionScanner,
  type RedemptionResult,
} from "@/components/receipt/RedemptionScanner";

export type SlotRedemptionStatus = "ready" | "redeemed" | "expired";

export interface RedeemableSlot {
  id: string;
  code: string;
  title: string;
  dateLabel: string;
  timeRange: string;
  status: SlotRedemptionStatus;
}

function initialRedemptionStatus(slot: Slot): SlotRedemptionStatus {
  if (slot.status === "Sold Out") return "redeemed";
  if (slot.status === "Busy") return "expired";
  return "ready";
}

export function buildRedeemableSlots(slots: Slot[] = mockSlots): RedeemableSlot[] {
  return slots.map((slot) => ({
    id: slot.id,
    code: `CHRONO-${slot.id.toUpperCase()}`,
    title: slot.title,
    dateLabel: slot.dateLabel,
    timeRange: slot.timeRange,
    status: initialRedemptionStatus(slot),
  }));
}

const statusTone: Record<SlotRedemptionStatus, Tone> = {
  ready: "positive",
  expired: "warning",
  redeemed: "neutral",
};

const statusLabel: Record<SlotRedemptionStatus, string> = {
  ready: "Ready to redeem",
  expired: "Expired",
  redeemed: "Redeemed",
};

export default function RedeemPage() {
  const [slots, setSlots] = useState<RedeemableSlot[]>(() =>
    buildRedeemableSlots(mockSlots),
  );

  const handleVerify = useCallback(
    async (rawCode: string): Promise<RedemptionResult> => {
      const normalized = rawCode.trim().toUpperCase();
      const match = slots.find(
        (slot) =>
          slot.code.toUpperCase() === normalized ||
          slot.id.toUpperCase() === normalized,
      );

      if (!match) {
        throw new Error(`No slot found for code "${rawCode.trim()}".`);
      }

      if (match.status === "expired") {
        return "expired";
      }

      if (match.status === "redeemed") {
        return "already_redeemed";
      }

      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === match.id ? { ...slot, status: "redeemed" } : slot,
        ),
      );
      return "valid";
    },
    [slots],
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-cyan-300/30 hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <ArrowLeft className="icon-directional h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>

          <BreadcrumbOverflow
            className="relative"
            items={[
              {
                label: "Dashboard",
                href: "/dashboard",
                icon: <LayoutDashboard className="h-4 w-4" />,
              },
              { label: "Redeem" },
            ]}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <RedemptionScanner onVerify={handleVerify} />

          <section
            aria-labelledby="redeem-slots-heading"
            className="glass-panel rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 text-slate-100 sm:p-8"
          >
            <header className="mb-5 space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                Supplier check-in
              </p>
              <h1
                id="redeem-slots-heading"
                className="text-xl font-extrabold tracking-tight text-white"
              >
                Slot redemption status
              </h1>
              <p className="helper-text helper-text--muted">
                Scan a buyer&apos;s QR code or enter a slot code to check in and
                update its redemption status.
              </p>
            </header>

            <ul className="space-y-3" aria-label="Redeemable slots">
              {slots.map((slot) => (
                <li
                  key={slot.id}
                  data-testid={`redeem-slot-${slot.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-white">
                      {slot.title}
                    </p>
                    <p className="font-mono text-xs text-cyan-300">
                      {slot.code}
                    </p>
                    <p className="text-xs text-slate-400">
                      {slot.dateLabel} · {slot.timeRange}
                    </p>
                  </div>
                  <StatusChip tone={statusTone[slot.status]}>
                    {statusLabel[slot.status]}
                  </StatusChip>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
