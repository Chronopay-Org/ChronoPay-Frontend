"use client";

import { Eraser } from "lucide-react";
import clsx from "clsx";

export type ClearSamplesBannerProps = {
  onClear: () => void;
  className?: string;
  /** Visible when sample rows remain after the tour was skipped or finished without clearing. */
  visible?: boolean;
};

/**
 * Persistent affordance to remove onboarding sample data.
 * Placed near the dashboard title; also acts as the final tour target.
 */
export function ClearSamplesBanner({
  onClear,
  className = "",
  visible = true,
}: ClearSamplesBannerProps) {
  if (!visible) return null;

  return (
    <div
      data-tour-target="clear-samples"
      className={clsx(
        "flex flex-col gap-3 rounded-[1.5rem] border border-amber-400/25 bg-amber-400/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        className,
      )}
      role="region"
      aria-label="Sample data controls"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-amber-50">
          You are viewing sample dashboard data
        </p>
        <p className="text-sm leading-6 text-amber-100/80">
          Rows marked Sample are for onboarding only. Clear them anytime to start
          with an empty workspace.
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className={clsx(
          "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950",
          "transition-colors hover:bg-cyan-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        )}
      >
        <Eraser className="h-4 w-4" aria-hidden="true" />
        Clear samples
      </button>
    </div>
  );
}
