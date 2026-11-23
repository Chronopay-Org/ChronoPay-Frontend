"use client";

import Link from "next/link";
import { BreadcrumbOverflow } from "@/app/components/ui/breadcrumb-overflow";
import { StatusChip } from "@/components/dashboard/status-chip";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  LayoutDashboard,
  Sparkles,
  Users,
} from "lucide-react";
import type { SlotMetadata } from "./slot-detail-data";
import type { BalanceMode, WalletStatus } from "./use-slot-booking";

export interface SlotSummaryItem {
  id: string;
  title: string;
  rate: string;
  dateLabel: string;
  timeRange: string;
  status: string;
  demand: string;
  isNextAvailable?: boolean;
}

export interface SlotHeaderSectionProps {
  slotId: string;
  slot: SlotSummaryItem;
  details: SlotMetadata;
  simWallet: WalletStatus;
  simBalance: BalanceMode;
  onSimWalletChange: (wallet: WalletStatus) => void;
  onSimBalanceChange: (balance: BalanceMode) => void;
}

function mapTone(status: SlotSummaryItem["status"]) {
  if (status === "Healthy") return "positive" as const;
  if (status === "Tight") return "warning" as const;
  return "critical" as const;
}

export function SlotHeaderTopBar({
  slotId,
  simWallet,
  simBalance,
  onSimWalletChange,
  onSimBalanceChange,
}: Pick<
  SlotHeaderSectionProps,
  "slotId" | "simWallet" | "simBalance" | "onSimWalletChange" | "onSimBalanceChange"
>) {
  return (
    <>
      {/* Breadcrumb Navigation & Back Button */}
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
            { label: "Slots", href: "/dashboard/slots" },
            { label: "Booking", href: `/dashboard/slots/${slotId}` },
            { label: "Details" },
          ]}
        />
      </div>

      {/* Scenario Simulator */}
      <section
        className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 shadow-[0_0_20px_rgba(34,211,238,0.06)]"
        aria-labelledby="simulator-title"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="simulator-title"
              className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Scenario Simulator
            </h2>
            <p className="helper-text helper-text--muted mt-1">
              Toggle simulated states below to review edge case UX flows dynamically.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-400 font-medium uppercase">
                Stellar Wallet Status
              </span>
              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-white/10">
                {(["connected", "disconnected", "error"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onSimWalletChange(mode)}
                    className={`rounded px-2.5 py-1 font-semibold uppercase tracking-wider transition ${
                      simWallet === mode
                        ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-400 font-medium uppercase">
                Simulated Balance
              </span>
              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-white/10">
                {(["sufficient", "insufficient"] as const).map((bal) => (
                  <button
                    key={bal}
                    type="button"
                    onClick={() => onSimBalanceChange(bal)}
                    className={`rounded px-2.5 py-1 font-semibold uppercase tracking-wider transition ${
                      simBalance === bal
                        ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {bal === "sufficient" ? "1,500 XLM" : "50 XLM"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function SlotHeaderSection({
  slot,
  details,
}: Pick<SlotHeaderSectionProps, "slot" | "details">) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Slot Core Overview */}
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8 space-y-5 border border-white/10 bg-slate-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusChip tone={mapTone(slot.status)}>{slot.status}</StatusChip>
            {slot.isNextAvailable && (
              <span className="inline-flex items-center rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-cyan-200 border border-cyan-400/20">
                ⚡ NEXT AVAILABLE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            {slot.demand}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {slot.title}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-white/8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-cyan-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Date Scheduled
              </p>
              <p className="text-sm font-semibold text-white">{slot.dateLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-cyan-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Time (Duration)
              </p>
              <p className="text-sm font-semibold text-white">
                {slot.timeRange} ({details.durationHours} hrs)
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Slot Description
          </h2>
          <p className="text-sm leading-7 text-slate-300">{details.description}</p>
        </div>
      </article>

      {/* Seller profile block */}
      <article className="glass-panel rounded-[2rem] p-6 sm:p-8 space-y-6 border border-white/10 bg-slate-950/20">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Seller Information
        </h2>

        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr ${details.seller.avatarGradient} text-xl font-bold tracking-wider text-white shadow-lg`}
            aria-hidden={true}
          >
            {details.seller.avatarInitials}
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {details.seller.name}
                <span className="inline-flex rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase border border-emerald-400/20">
                  Verified Seller
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{details.seller.role}</p>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{details.seller.bio}</p>
          </div>
        </div>

        {/* Seller metrics grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-white/8 pt-5">
          {details.seller.stats.map((stat, i) => (
            <div key={i} className="text-center sm:text-start">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-lg font-bold text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Availability, reviews, and policies are maintained on the supplier profile.
          </p>
          <Link
            href={`/dashboard/suppliers/${details.seller.id}`}
            aria-label={`View ${details.seller.name}'s profile with availability, reviews, and policies`}
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            View supplier profile
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </article>
    </div>
  );
}
