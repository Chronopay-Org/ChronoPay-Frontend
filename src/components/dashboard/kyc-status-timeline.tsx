"use client";

import { useId } from "react";
import type { KycStage, KycTimelineEntry, KycPromptPanel } from "./timeline-types";
import { kycStageToneMap } from "./timeline-types";
import { StatusChip } from "@/app/components/ui/status-chip";
import { ButtonLink } from "@/app/components/ui/button-link";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";
import {
  AlertTriangle,
  Upload,
  CheckCircle2,
  Clock,
  FileSearch,
  XCircle,
} from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

interface KycStatusTimelineProps {
  /** Ordered list of KYC timeline entries (submitted → reviewing → … → verified). */
  entries: KycTimelineEntry[];
  /** Prompt panel shown when the active stage is `needs_info`. Omit when no action is needed. */
  promptPanel?: KycPromptPanel;
  /** Optional className for the outermost wrapper. */
  className?: string;
}

// ─── Stage icon mapping ───────────────────────────────────────────────────────

const stageIcons: Record<
  KycStage,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  submitted: Clock,
  reviewing: FileSearch,
  needs_info: AlertTriangle,
  rejected: XCircle,
  verified: CheckCircle2,
};

const stageIconColors: Record<KycStage, string> = {
  submitted: "text-slate-400",
  reviewing: "text-cyan-400",
  needs_info: "text-amber-400",
  rejected: "text-rose-400",
  verified: "text-emerald-400",
};

const stageDotBg: Record<KycStage, string> = {
  submitted: "bg-slate-500",
  reviewing: "bg-cyan-500",
  needs_info: "bg-amber-500",
  rejected: "bg-rose-500",
  verified: "bg-emerald-500",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStageLabel(stage: KycStage): string {
  const labels: Record<KycStage, string> = {
    submitted: "Submitted",
    reviewing: "Reviewing",
    needs_info: "Needs Info",
    rejected: "Rejected",
    verified: "Verified",
  };
  return labels[stage];
}

/** Derive the overall status chip tone from entries. */
function deriveOverallTone(
  entries: KycTimelineEntry[],
): "info" | "warning" | "success" | "danger" {
  const hasRejected = entries.some((e) => e.stage === "rejected" && e.isCurrent);
  if (hasRejected) return "danger";

  const hasNeedsInfo = entries.some((e) => e.stage === "needs_info" && e.isCurrent);
  if (hasNeedsInfo) return "warning";

  const lastStage = entries[entries.length - 1]?.stage;
  if (lastStage === "verified") return "success";

  return "info";
}

function deriveOverallLabel(entries: KycTimelineEntry[]): string {
  const hasRejected = entries.some((e) => e.stage === "rejected" && e.isCurrent);
  if (hasRejected) return "Rejected";

  const hasNeedsInfo = entries.some((e) => e.stage === "needs_info" && e.isCurrent);
  if (hasNeedsInfo) return "Action Required";

  const lastStage = entries[entries.length - 1]?.stage;
  if (lastStage === "verified") return "Verified";

  return "In Progress";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KycStatusTimeline({
  entries,
  promptPanel,
  className = "",
}: KycStatusTimelineProps) {
  const timelineId = useId();
  const titleId = `${timelineId}-title`;

  const hasActionNeeded = entries.some(
    (e) => e.stage === "needs_info" && e.isCurrent,
  );
  const isRejected = entries.some(
    (e) => e.stage === "rejected" && e.isCurrent,
  );

  // Find the index of the current entry for determining which stages come before it
  const currentIndex = entries.findIndex((e) => e.isCurrent);

  return (
    <section
      aria-labelledby={titleId}
      className={`rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6 ${className}`}
    >
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            Identity
          </p>
          <div>
            <h2
              id={titleId}
              className="flex items-center gap-2 text-xl font-semibold text-white"
            >
              KYC Status
              <HelpPopover
                term={glossary.kyc}
                triggerLabel="Help: what is KYC verification?"
              />
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
              Track your identity verification progress. Verified accounts can list
              time slots and receive payouts.
            </p>
          </div>
        </div>
        {/* Overall status chip */}
        <StatusChip tone={deriveOverallTone(entries)}>
          {deriveOverallLabel(entries)}
        </StatusChip>
      </div>

      {/* ── Timeline ── */}
      <div className="pt-5">
        <ol
          role="list"
          className="relative border-s border-white/10 ms-3"
          aria-label="KYC verification timeline"
        >
          {entries.map((entry, index) => {
            const isLast = index === entries.length - 1;

            // A stage is "past" if it comes before the current entry index.
            // If there is no current entry (isCurrent not set on any), nothing is past.
            const isPast =
              currentIndex !== -1 ? index < currentIndex : false;

            // A stage is "completed" if past OR the final verified stage.
            const isCompleted = isPast || entry.stage === "verified";

            const iconColor = stageIconColors[entry.stage];
            const Icon = stageIcons[entry.stage];

            return (
              <li
                key={entry.id}
                className={`mb-10 ms-6 ${isLast ? "mb-0" : ""}`}
              >
                {/* Dot / icon */}
                <span
                  className={`absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-slate-950 ${
                    isCompleted
                      ? "bg-emerald-500"
                      : entry.isCurrent
                        ? stageDotBg[entry.stage]
                        : "bg-slate-700"
                  }`}
                  aria-hidden="true"
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isCompleted
                        ? "text-white"
                        : entry.isCurrent
                          ? "text-white"
                          : iconColor
                    }`}
                    aria-hidden
                  />
                </span>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-sm font-semibold text-white"
                      aria-current={entry.isCurrent ? "step" : undefined}
                    >
                      {entry.title}
                    </h3>
                    <StatusChip tone={kycStageToneMap[entry.stage]}>
                      {formatStageLabel(entry.stage)}
                    </StatusChip>
                  </div>
                  <p className="text-sm text-slate-400">{entry.timestamp}</p>

                  {entry.actor && (
                    <p className="text-xs text-slate-500">By: {entry.actor}</p>
                  )}

                  {entry.details && (
                    <p className="mt-1 rounded bg-white/5 p-3 text-sm text-slate-300">
                      {entry.details}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Prompt Panel (needs_info – action required) ── */}
      {hasActionNeeded && promptPanel && (
        <div
          className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-950/30 p-4 sm:p-5"
          role="region"
          aria-label="KYC re-submission required"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              <AlertTriangle
                className="h-5 w-5 text-amber-400"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-amber-100">
                  {promptPanel.title}
                  <HelpPopover
                    term={glossary.kycResubmission}
                    triggerLabel="Help: what does KYC re-submission mean?"
                  />
                </h3>
                <p className="mt-1 text-sm leading-6 text-amber-200/80">
                  {promptPanel.description}
                </p>
              </div>

              {/* Guidance bullets */}
              {promptPanel.guidance.length > 0 && (
                <ul className="space-y-2" aria-label="Re-submission guidance">
                  {promptPanel.guidance.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-amber-200/70"
                    >
                      <span
                        className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400/60"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Upload CTA */}
              <div className="pt-1">
                <ButtonLink
                  href={promptPanel.uploadHref}
                  variant="primary"
                  size="md"
                  className="inline-flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload documents
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejected state banner ── */}
      {isRejected && (
        <div
          className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-950/30 p-4 sm:p-5"
          role="alert"
          aria-label="KYC verification rejected"
        >
          <div className="flex items-start gap-3">
            <XCircle
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-400"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-rose-100">
                Your KYC verification was not approved
              </p>
              <p className="mt-1 text-sm text-rose-200/70">
                The compliance team was unable to verify your identity with the
                documents provided. Please contact support for assistance with the
                appeals process.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Verified state: subtle confirmation ── */}
      {entries[entries.length - 1]?.stage === "verified" && !isRejected && (
        <div
          className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-950/25 p-4 sm:p-5"
          role="status"
          aria-label="KYC verification complete"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-emerald-100">
                Your identity has been verified
              </p>
              <p className="mt-1 text-sm text-emerald-200/70">
                You can now list time slots, receive bookings, and withdraw
                payouts.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
