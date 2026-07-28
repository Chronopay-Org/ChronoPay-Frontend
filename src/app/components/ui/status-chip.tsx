/**
 * StatusChip — unified tone-chip for the entire ChronoPay design system.
 *
 * Accepts two overlapping tone scales so both feature areas (dashboard
 * components and UI primitives) can use one implementation:
 *
 *   Dashboard scale  →  UI scale alias
 *   ─────────────────────────────────
 *   positive         →  success
 *   critical         →  danger
 *   warning          →  warning   (same)
 *   neutral          →  neutral   (same)
 *   —                →  info      (cyan, new)
 *
 * Both scales are valid props — there is no deprecation. Components that
 * already use "positive" / "critical" keep working without changes.
 */

import type { HTMLAttributes, ReactNode } from "react";

// ─── Tone type ────────────────────────────────────────────────────────────────

/**
 * Full tone union accepted by StatusChip.
 * The dashboard `Tone` type (`positive | warning | critical | neutral`) is a
 * strict subset of this union, so StatusChip is directly compatible with both.
 */
export type StatusChipTone =
  | "positive"   // emerald  – dashboard scale
  | "success"    // emerald  – UI scale alias for positive
  | "warning"    // amber    – shared
  | "critical"   // rose     – dashboard scale
  | "danger"     // rose     – UI scale alias for critical
  | "info"       // cyan     – UI scale only
  | "neutral";   // slate    – shared

// ─── Tone classes ─────────────────────────────────────────────────────────────

const toneClasses: Record<StatusChipTone, string> = {
  positive: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  success:  "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  warning:  "border-amber-400/30  bg-amber-400/10  text-amber-100",
  critical: "border-rose-400/30   bg-rose-400/10   text-rose-100",
  danger:   "border-rose-400/30   bg-rose-400/10   text-rose-100",
  info:     "border-cyan-400/30   bg-cyan-400/10   text-cyan-100",
  neutral:  "border-white/10      bg-white/6       text-slate-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

export type StatusChipProps = {
  tone?: StatusChipTone;
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className">;

export function StatusChip({
  tone = "neutral",
  children,
  className = "",
  ...props
}: StatusChipProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
