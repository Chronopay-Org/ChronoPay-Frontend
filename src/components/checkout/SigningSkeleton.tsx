"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SigningSkeletonProps {
  /** Name of the wallet being connected to (e.g. "Freighter") */
  walletName?: string;
  /** Callback fired when the user cancels the signing request */
  onCancel?: () => void;
  /** Optional help href opened when the user clicks the help link */
  helpHref?: string;
}

// Wallet icon paths for supported wallets
const WALLET_ICONS: Record<string, React.ReactNode> = {
  freighter: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <rect width="48" height="48" rx="12" fill="currentColor" className="text-cyan-500/20" />
      <path
        d="M16 18c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4v2H16v-2Z"
        fill="currentColor"
        className="text-cyan-400"
      />
      <rect x="14" y="20" width="20" height="16" rx="3" fill="currentColor" className="text-cyan-500/30" />
      <rect x="22" y="26" width="4" height="4" rx="1" fill="currentColor" className="text-cyan-300" />
      <circle cx="24" cy="28" r="2" fill="currentColor" className="text-cyan-200" />
    </svg>
  ),
  albedo: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <rect width="48" height="48" rx="12" fill="currentColor" className="text-violet-500/20" />
      <circle cx="24" cy="24" r="10" fill="currentColor" className="text-violet-400/30" />
      <path
        d="M24 16a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8Z"
        fill="currentColor"
        className="text-violet-300/50"
      />
      <circle cx="24" cy="24" r="4" fill="currentColor" className="text-violet-200" />
    </svg>
  ),
  default: (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-10 w-10"
    >
      <rect width="48" height="48" rx="12" fill="currentColor" className="text-slate-500/20" />
      <rect x="14" y="18" width="20" height="16" rx="3" fill="currentColor" className="text-slate-500/30" />
      <rect x="22" y="26" width="4" height="4" rx="1" fill="currentColor" className="text-slate-400" />
      <path
        d="M16 18c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4v2H16v-2Z"
        fill="currentColor"
        className="text-slate-400/50"
      />
    </svg>
  ),
};

function getWalletIcon(walletName?: string): React.ReactNode {
  if (!walletName) return WALLET_ICONS.default;
  const key = walletName.toLowerCase();
  return WALLET_ICONS[key] || WALLET_ICONS.default;
}

/**
 * ElapsedTimeBadge
 *
 * Displays the elapsed time since signing began. Only becomes visible after
 * 10 seconds have passed, to avoid distracting the user during quick signings.
 */
function ElapsedTimeBadge({ seconds }: { seconds: number }) {
  if (seconds < 10) return null;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label =
    minutes > 0
      ? `${minutes}m ${secs}s`
      : `${secs}s`;

  return (
    <span
      role="timer"
      aria-live="polite"
      aria-label={`Waiting for signature. Elapsed time: ${minutes} minute${minutes !== 1 ? "s" : ""} ${secs} second${secs !== 1 ? "s" : ""}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="h-3.5 w-3.5 motion-reduce:hidden"
      >
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" className="opacity-30" />
        <path
          d="M8 2a6 6 0 0 1 6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-spin motion-reduce:animate-none"
          style={{ animationDuration: "1s", transformOrigin: "8px 8px" }}
        />
      </svg>
      <span className="motion-reduce:ml-0">Elapsed&nbsp;{label}</span>
    </span>
  );
}

/**
 * WalletIllustration
 *
 * An animated skeleton illustration of a wallet signing in progress.
 * Under reduced motion, the animation is replaced by a static tint.
 */
function WalletIllustration({ walletName }: { walletName?: string }) {
  const icon = getWalletIcon(walletName);

  return (
    <div
      className="relative flex items-center justify-center"
      aria-hidden="true"
    >
      {/* Outer glow ring */}
      <div className="absolute h-24 w-24 rounded-full bg-cyan-400/10 blur-xl motion-reduce:hidden" />

      {/* Pulse ring */}
      <div className="absolute h-20 w-20 rounded-full border-2 border-cyan-400/20 motion-safe:animate-ping motion-reduce:border-cyan-400/10" style={{ animationDuration: "2.5s" }} />

      {/* Inner illustration */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200/20 bg-slate-900/80 backdrop-blur-sm motion-safe:animate-pulse motion-reduce:bg-slate-900/90" style={{ animationDuration: "2s" }}>
        {icon}
      </div>

      {/* Connecting dots */}
      <div className="absolute -bottom-1.5 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 motion-safe:animate-bounce motion-reduce:bg-cyan-400/30"
            style={{ animationDelay: `${i * 0.3}s`, animationDuration: "1.2s" }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SigningSkeleton
 *
 * An illustrated skeleton screen shown during wallet signing to reassure
 * users about what is happening. Replaces the generic spinner with a
 * wallet-specific visual, elapsed-time badge (after 10s), cancel button,
 * and a help affordance.
 *
 * WCAG 2.1 AA compliant: uses semantic roles, aria-live regions, proper
 * color contrast, and reduced-motion fallbacks.
 *
 * @example
 * <SigningSkeleton
 *   walletName="Freighter"
 *   onCancel={() => setStatus("idle")}
 *   helpHref="https://docs.chronopay.dev/wallet-signing"
 * />
 */
export function SigningSkeleton({
  walletName,
  onCancel,
  helpHref = "https://docs.chronopay.dev/wallet-signing",
}: SigningSkeletonProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Prevent memory leak if it runs too long
  useEffect(() => {
    if (elapsed >= 300) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [elapsed]);

  const displayName = walletName || "wallet";
  const liveMessage = `Waiting for signature in ${displayName}. Please check your wallet extension to approve the transaction.`;

  return (
    <div
      className="mt-6 flex flex-col items-center gap-5 py-10"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-atomic="true"
      aria-label={liveMessage}
    >
      {/* Visually hidden live region for screen readers */}
      <span className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
        {elapsed < 10
          ? liveMessage
          : `${liveMessage} It has been ${elapsed} seconds since this request began.`}
      </span>

      {/* Wallet illustration skeleton */}
      <WalletIllustration walletName={walletName} />

      {/* Status text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-slate-200 dark:text-slate-100">
          Waiting for signature in&nbsp;
          <span className="font-semibold text-cyan-300">{displayName}</span>
          …
        </p>
        <p className="helper-text helper-text--muted text-xs">
          A signature request has been sent to your wallet. Approve it to continue.
        </p>
      </div>

      {/* Elapsed time badge */}
      <ElapsedTimeBadge seconds={elapsed} />

      {/* Action buttons */}
      <div className="mt-2 flex items-center gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Cancel
          </button>
        )}

        <a
          href={helpHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-slate-400 underline decoration-slate-500/30 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="mr-1.5 h-3.5 w-3.5"
          >
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6.5 6.5a1.5 1.5 0 1 1 2.17 1.34c-.4.22-.67.6-.67 1.02" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.5" fill="currentColor" />
          </svg>
          Help with signing
        </a>
      </div>
    </div>
  );
}
