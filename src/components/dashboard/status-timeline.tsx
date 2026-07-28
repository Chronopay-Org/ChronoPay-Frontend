"use client";

import { useState, useRef, useId } from "react";
import { Filter } from "lucide-react";
import { TimelineItem, statusToneMap } from "./timeline-types";
import { StatusChip } from "./status-chip";
import { KycDocUpload } from "./kyc-doc-upload";
import { KycLivenessCapture } from "./kyc-liveness-capture";

interface StatusTimelineProps {
  items: TimelineItem[];
}

export function StatusTimeline({ items }: StatusTimelineProps) {
  const [milestonesOnly, setMilestonesOnly] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const scrollTopRef = useRef(0);

  const displayedItems = milestonesOnly
    ? items.filter((item) => item.isMilestone)
    : items;

  const hasMilestones = items.some((item) => item.isMilestone);
  const latestMediatorItem = [...items]
    .reverse()
    .find((item) => item.variant === "mediator_assigned" && item.mediator);
  const mediatorAnnouncement = latestMediatorItem?.mediator
    ? `Mediator ${latestMediatorItem.mediator.name} assigned.${
        latestMediatorItem.mediator.responseSlaLabel
          ? ` Response SLA ${latestMediatorItem.mediator.responseSlaLabel}.`
          : ""
      }`
    : "";

  function handleToggle() {
    if (listRef.current) {
      scrollTopRef.current = listRef.current.scrollTop;
    }

    const next = !milestonesOnly;
    setMilestonesOnly(next);
    setAnnouncement(
      next ? "Showing milestones only" : "Showing all timeline events",
    );

    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = scrollTopRef.current;
      }
    });
  }

  return (
    <section className="space-y-4" aria-label="Status timeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Timeline
          </span>
        </div>

        {hasMilestones ? (
          <button
            type="button"
            role="switch"
            aria-checked={milestonesOnly}
            aria-label={
              milestonesOnly
                ? "Show all timeline events"
                : "Show milestones only"
            }
            onClick={handleToggle}
            className={[
              "group relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              milestonesOnly ? "bg-cyan-500" : "bg-white/10 hover:bg-white/20",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200",
                milestonesOnly ? "translate-x-[22px]" : "translate-x-[2px]",
              ].join(" ")}
            />
          </button>
        ) : null}
      </div>

      {milestonesOnly && displayedItems.length > 0 ? (
        <p className="text-xs text-cyan-300" aria-live="polite">
          {displayedItems.length} milestone
          {displayedItems.length === 1 ? "" : "s"} shown
        </p>
      ) : null}

      <ol
        ref={listRef}
        aria-label="Timeline events"
        className="relative ml-3 max-h-[600px] border-s border-white/10 overflow-y-auto"
      >
        {displayedItems.map((item, index) => (
          <TimelineEntry
            key={`${item.id}-${index}`}
            item={item}
            isLast={index === displayedItems.length - 1}
          />
        ))}
      </ol>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement || mediatorAnnouncement}
      </div>
    </section>
  );
}

function TimelineEntry({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = Boolean(item.details || item.actor);

  return (
    <li className={`ms-6 ${isLast ? "" : "mb-10"}`}>
      <span
        className={`absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-slate-950 ${
          item.status === "completed" ? "bg-emerald-500" : "bg-slate-700"
        }`}
        aria-hidden="true"
      >
        {item.isMilestone ? (
          <span className="h-2 w-2 rounded-full bg-white/80" />
        ) : null}
      </span>

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <h3
              className="text-sm font-semibold text-white"
              aria-current={item.isCurrent ? "step" : undefined}
            >
              {item.title}
              {item.isMilestone ? (
                <span className="ms-2 inline-flex items-center rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-300">
                  Milestone
                </span>
              ) : null}
            </h3>
            <p className="text-sm text-slate-400">{item.timestamp}</p>
          </div>
          <StatusChip tone={statusToneMap[item.status]}>{item.status}</StatusChip>
        </div>

        {item.variant === "mediator_assigned" && item.mediator ? (
          <MediatorAssignmentCard item={item} />
        ) : null}

        {hasDetails ? (
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-controls={`details-${item.id}`}
            className="rounded text-left text-sm text-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {isExpanded ? "Hide details" : "Show details"}
          </button>
        ) : null}
      </div>

      {isExpanded && hasDetails ? (
        <div
          id={`details-${item.id}`}
          role="region"
          aria-label={`Details for ${item.title}`}
          className="mt-3 rounded-2xl bg-white/5 p-4 text-sm text-slate-300"
        >
          {item.actor ? <p>Actor: {item.actor}</p> : null}
          {item.details ? <p className={item.actor ? "mt-1" : ""}>{item.details}</p> : null}
          {item.id === "kyc-liveness" && item.status === "pending" ? (
            <div className="mt-4">
              <KycLivenessCapture onCaptureComplete={() => {}} />
            </div>
          ) : null}
          {item.id === "kyc-doc-upload" && item.status === "pending" ? (
            <div className="mt-4">
              <KycDocUpload onCaptureComplete={() => {}} />
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function MediatorAssignmentCard({ item }: { item: TimelineItem }) {
  const mediator = item.mediator!;
  const meterValue = typeof mediator.slaProgress === "number"
    ? Math.min(100, Math.max(0, mediator.slaProgress))
    : null;

  return (
    <section
      className="rounded-3xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(15,23,42,0.92))] p-4 shadow-[0_20px_60px_-30px_rgba(34,211,238,0.35)]"
      aria-label={`Mediator assignment for ${mediator.name}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-200">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Mediator assigned
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{mediator.name}</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-200">
              Neutral review has started. Keep all dispute updates in one thread
              so both parties and the mediator can track the latest context.
            </p>
          </div>
        </div>

        {mediator.directMessageHref ? (
          <a
            href={mediator.directMessageHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {mediator.directMessageLabel ?? "Message mediator"}
          </a>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Response SLA
          </dt>
          <dd className="mt-2 text-sm font-medium text-white">
            {mediator.responseSlaLabel ?? "Pending confirmation"}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Due by
          </dt>
          <dd className="mt-2 text-sm font-medium text-white">
            {mediator.responseDueLabel ?? "No deadline set"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            SLA window
          </p>
          <p className="text-xs text-slate-400">
            {meterValue === null ? "Not available" : `${meterValue}% elapsed`}
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label={`Mediator SLA progress for ${mediator.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={meterValue ?? undefined}
          aria-valuetext={
            meterValue === null
              ? "SLA progress not available"
              : `${meterValue}% of the response window elapsed`
          }
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300"
            style={{ width: `${meterValue ?? 0}%` }}
          />
        </div>
      </div>
    </section>
  );
}
