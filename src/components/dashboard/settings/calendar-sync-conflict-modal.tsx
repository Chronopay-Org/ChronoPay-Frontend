"use client";

import { useState, useCallback, useId, useMemo } from "react";
import { clsx } from "clsx";
import { X, AlertTriangle, GitBranch, GitMerge } from "lucide-react";
import { FocusTrap } from "@/components/common/FocusTrap";
import { LiveRegion } from "@/components/common/LiveRegion";
import type { SyncConflict, ResolutionStrategy, ConflictResolution } from "../types";

interface CalendarSyncConflictModalProps {
  conflicts: SyncConflict[];
  onResolve: (resolutions: ConflictResolution[]) => void;
  onClose: () => void;
  className?: string;
}

const strategyLabels: Record<ResolutionStrategy, string> = {
  useLocal: "Use local",
  useRemote: "Use remote",
  merge: "Merge",
};

const strategyDescriptions: Record<ResolutionStrategy, string> = {
  useLocal: "Keep the local version of the event.",
  useRemote: "Accept the remote version of the event.",
  merge: "Combine changes from both sides.",
};

function StrategyRadioGroup({
  value,
  onChange,
  name,
}: {
  value: ResolutionStrategy;
  onChange: (value: ResolutionStrategy) => void;
  name: string;
}) {
  const strategies = Object.entries(strategyLabels) as [ResolutionStrategy, string][];

  return (
    <div role="radiogroup" aria-label={`Resolution for ${name}`} className="flex flex-wrap gap-2">
      {strategies.map(([strategy, label]) => {
        const checked = value === strategy;
        return (
          <label
            key={strategy}
            className={clsx(
              "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors",
              checked
                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                : "border-white/6 bg-white/4 text-slate-300 hover:border-white/16",
            )}
          >
            <input
              type="radio"
              name={name}
              value={strategy}
              checked={checked}
              onChange={() => onChange(strategy)}
              className="sr-only"
            />
            {strategy === "useLocal" && <GitBranch aria-hidden="true" className="h-3.5 w-3.5" />}
            {strategy === "useRemote" && <ArrowRightIcon aria-hidden="true" />}
            {strategy === "merge" && <GitMerge aria-hidden="true" className="h-3.5 w-3.5" />}
            <span className="sr-only">{strategyDescriptions[strategy]}</span>
            <span>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ConflictRow({
  conflict,
  resolution,
  onResolutionChange,
}: {
  conflict: SyncConflict;
  resolution: ResolutionStrategy;
  onResolutionChange: (strategy: ResolutionStrategy) => void;
}) {
  const rowId = useId();
  const allChanges = conflict.localChanges.map((lc) => {
    const rc = conflict.remoteChanges.find((r) => r.field === lc.field);
    return {
      field: lc.field,
      localValue: lc.localValue,
      remoteValue: rc?.remoteValue ?? lc.remoteValue,
    };
  });

  return (
    <div
      className="rounded-xl border border-white/6 bg-white/4 p-4 space-y-4"
      role="group"
      aria-label={`Conflict: ${conflict.eventTitle}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle aria-hidden="true" className="h-4 w-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{conflict.eventTitle}</h4>
            <p className="text-xs text-slate-400 mt-0.5">{conflict.dateTime}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" aria-label={`Field changes for ${conflict.eventTitle}`}>
          <thead>
            <tr className="border-b border-white/6">
              <th className="text-left py-2 pr-3 font-medium text-slate-400 w-[30%]">Field</th>
              <th className="text-left py-2 px-3 font-medium text-cyan-300 w-[35%]">Local</th>
              <th className="text-left py-2 pl-3 font-medium text-amber-300 w-[35%]">Remote</th>
            </tr>
          </thead>
          <tbody>
            {allChanges.map((change) => (
              <tr key={change.field} className="border-b border-white/4">
                <td className="py-2 pr-3 align-top text-slate-300 truncate max-w-[120px]">
                  {change.field}
                </td>
                <td className="py-2 px-3 align-top text-slate-100 break-words max-w-[160px]">
                  {change.localValue}
                </td>
                <td className="py-2 pl-3 align-top text-slate-100 break-words max-w-[160px]">
                  {change.remoteValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StrategyRadioGroup
        value={resolution}
        onChange={onResolutionChange}
        name={`resolution-${conflict.id}`}
      />
    </div>
  );
}

export function CalendarSyncConflictModal({
  conflicts,
  onResolve,
  onClose,
  className,
}: CalendarSyncConflictModalProps) {
  const [resolutions, setResolutions] = useState<Record<string, ResolutionStrategy>>(() => {
    const initial: Record<string, ResolutionStrategy> = {};
    conflicts.forEach((c) => {
      initial[c.id] = "merge";
    });
    return initial;
  });
  const titleId = useId();
  const announcementId = useId();

  const handleResolutionChange = useCallback(
    (conflictId: string, strategy: ResolutionStrategy) => {
      setResolutions((prev) => ({ ...prev, [conflictId]: strategy }));
    },
    [],
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const allResolved =
    conflicts.length > 0 && conflicts.every((c) => resolutions[c.id] != null);

  const handleResolveAll = useCallback(() => {
    if (!allResolved) return;
    const result: ConflictResolution[] = conflicts.map((c) => ({
      conflictId: c.id,
      strategy: resolutions[c.id],
    }));
    onResolve(result);
  }, [allResolved, conflicts, resolutions, onResolve]);

  if (conflicts.length === 0) return null;

  const unresolvedCount = conflicts.filter(
    (c) => resolutions[c.id] == null,
  ).length;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6",
        "bg-slate-950/80 backdrop-blur-sm",
        "[&:has([dir=\"rtl\"])]:[direction:rtl]",
        className,
      )}
      role="presentation"
    >
      <FocusTrap>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={announcementId}
          className={clsx(
            "relative w-full max-w-2xl max-h-[85vh] flex flex-col",
            "rounded-[28px] border border-white/10",
            "bg-slate-950 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)]",
            "backdrop-blur",
          )}
        >
          <LiveRegion id={announcementId}>
            {unresolvedCount === 0
              ? `All ${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} resolved. Press Resolve to apply.`
              : `${unresolvedCount} of ${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} remaining.`}
          </LiveRegion>

          <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-white/6">
            <div className="space-y-1 min-w-0">
              <h2
                id={titleId}
                className="text-lg font-semibold text-white flex items-center gap-2"
              >
                <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-400 shrink-0" />
                Sync conflicts
              </h2>
              <p className="text-sm text-slate-400">
                {conflicts.length === 1
                  ? "One event has conflicting changes."
                  : `${conflicts.length} events have conflicting changes between local and remote calendars.`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close conflict resolution dialog"
              className="shrink-0 inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 p-2 text-slate-300 hover:border-white/20 hover:text-white focus-ring-cyan"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
            {conflicts.map((conflict) => (
              <ConflictRow
                key={conflict.id}
                conflict={conflict}
                resolution={resolutions[conflict.id] ?? "merge"}
                onResolutionChange={(strategy) =>
                  handleResolutionChange(conflict.id, strategy)
                }
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 p-5 sm:p-6 border-t border-white/6 bg-white/4 rounded-b-[28px]">
            <span className="text-xs text-slate-400" role="status" aria-live="polite">
              {allResolved
                ? "All conflicts have a resolution selected."
                : `${unresolvedCount} conflict${unresolvedCount === 1 ? "" : "s"} need resolution.`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/20 focus-ring-cyan"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveAll}
                disabled={!allResolved}
                className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-200 shadow-[0_16px_34px_rgba(34,211,238,0.22)] focus-ring-cyan disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
