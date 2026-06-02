"use client";

/**
 * AsyncButton — button with built-in pending / confirmed / error inline feedback.
 *
 * Covers the inline-feedback pattern for time-token actions:
 *   connect wallet · mint · buy · escrow release
 *
 * States:
 *   idle      → normal label, clickable
 *   pending   → spinner + "pending label", disabled, aria-busy="true"
 *   confirmed → check icon + "confirmed label", briefly shown then resets
 *   error     → error icon + "error label", stays until next click
 *
 * Accessibility:
 *   - aria-busy="true" during pending (screen readers announce loading)
 *   - aria-disabled="true" during pending (prevents double-submit)
 *   - aria-live="polite" on the status span for inline state changes
 *   - Focus ring matches the rest of the design system
 *
 * Usage:
 *   <AsyncButton
 *     onAction={async () => { await connectWallet(); }}
 *     labels={{ idle: "Connect wallet", pending: "Connecting…", confirmed: "Connected", error: "Retry" }}
 *     variant="primary"
 *   />
 */

import { useState, useId } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import clsx from "clsx";

export type AsyncButtonState = "idle" | "pending" | "confirmed" | "error";

export interface AsyncButtonLabels {
  idle: string;
  pending: string;
  confirmed: string;
  error: string;
}

interface AsyncButtonProps {
  /** Async function to run on click. Throw to trigger error state. */
  onAction: () => Promise<void>;
  labels: AsyncButtonLabels;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  /** How long (ms) to show the confirmed state before resetting. Default 2000. */
  confirmedDuration?: number;
  className?: string;
  /** Optional extra aria-describedby id */
  describedBy?: string;
  /** Called when onAction throws, after state is set to "error". */
  onError?: (err: unknown) => void;
}

const variantClasses: Record<"primary" | "secondary", string> = {
  primary:
    "bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-[0_16px_34px_rgba(34,211,238,0.22)] disabled:opacity-60 disabled:shadow-none",
  secondary:
    "border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-200/30 hover:bg-white/10 disabled:opacity-60",
};

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function AsyncButton({
  onAction,
  labels,
  variant = "secondary",
  size = "md",
  confirmedDuration = 2000,
  className = "",
  describedBy,
  onError,
}: AsyncButtonProps) {
  const [state, setState] = useState<AsyncButtonState>("idle");
  const statusId = useId();

  async function handleClick() {
    if (state === "pending") return;
    setState("pending");
    try {
      await onAction();
      setState("confirmed");
      setTimeout(() => setState("idle"), confirmedDuration);
    } catch (err) {
      setState("error");
      onError?.(err);
    }
  }

  const isPending = state === "pending";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      aria-disabled={isPending}
      aria-describedby={
        [describedBy, statusId].filter(Boolean).join(" ") || undefined
      }
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    >
      {/* Icon slot */}
      {state === "pending" && (
        <Loader2
          className="h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      )}
      {state === "confirmed" && (
        <CheckCircle2
          className="h-4 w-4 text-emerald-400"
          aria-hidden="true"
        />
      )}
      {state === "error" && (
        <AlertCircle
          className="h-4 w-4 text-rose-400"
          aria-hidden="true"
        />
      )}

      {/* Label */}
      <span>{labels[state]}</span>

      {/* Hidden live region for screen readers */}
      <span
        id={statusId}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state === "pending" ? labels.pending : ""}
        {state === "confirmed" ? labels.confirmed : ""}
        {state === "error" ? labels.error : ""}
      </span>
    </button>
  );
}
