"use client";

import { Beaker } from "lucide-react";
import { Tooltip } from "@/app/components/ui/tooltip";
import { SAMPLE_TOOLTIP } from "./dashboard-data";

export type SampleBadgeProps = {
  /** Override the default sample explanation. */
  tooltip?: string;
  className?: string;
};

/**
 * Visible "Sample" chip for onboarding demo rows.
 * Pairs a high-contrast badge with the shared Tooltip pattern
 * so keyboard, mouse, and touch users can read the explanation.
 */
export function SampleBadge({
  tooltip = SAMPLE_TOOLTIP,
  className = "",
}: SampleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100 ${className}`}
      aria-label={`Sample: ${tooltip}`}
      data-sample-badge=""
    >
      <Beaker className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>Sample</span>
      <Tooltip content={tooltip} />
    </span>
  );
}
