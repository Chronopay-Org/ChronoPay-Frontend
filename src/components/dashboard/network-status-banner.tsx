"use client";

/**
 * NetworkStatusBanner
 *
 * Polls the Stellar Horizon fee_stats endpoint every 30 s to derive a
 * human-readable network health signal and surface it as a slim banner
 * at the top of the dashboard.
 *
 * Health thresholds (base-fee in stroops, 1 XLM = 10,000,000 stroops):
 *   ≤ 100   → Healthy   (normal ~0.00001 XLM)
 *   101–999 → Elevated  (moderate congestion)
 *   ≥ 1000  → Congested (high demand, fees rising)
 *   error   → Unreachable
 *
 * Accessibility:
 *   - role="status" + aria-live="polite" so status changes are announced
 *     without interrupting the user.
 *   - The banner is not shown at all when network is healthy to reduce noise.
 *   - Dismiss button is keyboard-focusable with a visible focus ring.
 *   - Icon is aria-hidden; tone is always conveyed by text too (WCAG 1.4.1).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Wifi, WifiOff, AlertTriangle, X, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { HORIZON_URL } from "@/lib/stellar/config";

// ─── Types ────────────────────────────────────────────────────────────────────

type NetworkHealth = "healthy" | "elevated" | "congested" | "unreachable" | "loading";

interface NetworkStatus {
  health: NetworkHealth;
  /** p50 base fee in stroops */
  baseFee: number | null;
  /** Human-readable fee string, e.g. "0.00001 XLM" */
  feeDisplay: string | null;
  lastChecked: Date | null;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyHealth(fee: number): NetworkHealth {
  if (fee <= 100) return "healthy";
  if (fee < 1000) return "elevated";
  return "congested";
}

function stroopsToXlm(stroops: number): string {
  return `${(stroops / 10_000_000).toFixed(5)} XLM`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Visual config ────────────────────────────────────────────────────────────

const healthConfig: Record<
  Exclude<NetworkHealth, "healthy" | "loading">,
  {
    icon: React.ElementType;
    bannerClass: string;
    iconClass: string;
    textClass: string;
    label: string;
  }
> = {
  elevated: {
    icon: AlertTriangle,
    bannerClass: "border-amber-400/20 bg-amber-950/60",
    iconClass: "text-amber-400",
    textClass: "text-amber-100",
    label: "Elevated fees",
  },
  congested: {
    icon: AlertTriangle,
    bannerClass: "border-rose-400/20 bg-rose-950/60",
    iconClass: "text-rose-400",
    textClass: "text-rose-100",
    label: "Network congested",
  },
  unreachable: {
    icon: WifiOff,
    bannerClass: "border-slate-600/40 bg-slate-900/80",
    iconClass: "text-slate-400",
    textClass: "text-slate-300",
    label: "Network unreachable",
  },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000;

function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    health: "loading",
    baseFee: null,
    feeDisplay: null,
    lastChecked: null,
    error: null,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${HORIZON_URL}/fee_stats`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { fee_charged: { p50: string } };
      const fee = parseInt(data.fee_charged.p50, 10);
      setStatus({
        health: classifyHealth(fee),
        baseFee: fee,
        feeDisplay: stroopsToXlm(fee),
        lastChecked: new Date(),
        error: null,
      });
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        health: "unreachable",
        lastChecked: new Date(),
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  useEffect(() => {
    check();
    timerRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [check]);

  return { status, refresh: check };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NetworkStatusBanner() {
  const { status, refresh } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  // Re-show banner if health worsens after dismissal
  const prevHealth = useRef<NetworkHealth>(status.health);
  useEffect(() => {
    if (
      prevHealth.current !== status.health &&
      status.health !== "healthy" &&
      status.health !== "loading"
    ) {
      setDismissed(false);
    }
    prevHealth.current = status.health;
  }, [status.health]);

  // Nothing to show while loading or healthy or dismissed
  if (
    status.health === "loading" ||
    status.health === "healthy" ||
    dismissed
  ) {
    return null;
  }

  const cfg = healthConfig[status.health];
  const Icon = cfg.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={clsx(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm",
        cfg.bannerClass,
      )}
    >
      <Icon
        className={clsx("h-4 w-4 shrink-0", cfg.iconClass)}
        aria-hidden="true"
      />

      <div className={clsx("min-w-0 flex-1", cfg.textClass)}>
        <span className="font-semibold">{cfg.label}.</span>{" "}
        {status.health === "unreachable" ? (
          <span className="text-slate-400">
            Could not reach Stellar Horizon.{" "}
            {status.lastChecked && `Last checked ${formatTime(status.lastChecked)}.`}
          </span>
        ) : (
          <span className="text-slate-300">
            Current base fee:{" "}
            <span className="font-mono">{status.feeDisplay}</span>.{" "}
            Transactions may cost more than usual.
          </span>
        )}
      </div>

      {/* Refresh */}
      <button
        type="button"
        onClick={() => refresh()}
        aria-label="Refresh Stellar network status"
        className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss network status banner"
        className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Compact indicator (for header / nav bar) ─────────────────────────────────

/**
 * NetworkStatusDot — a 8px dot that can be embedded anywhere space is tight.
 * Green = healthy/loading, amber = elevated, red = congested/unreachable.
 */
export function NetworkStatusDot({ className }: { className?: string }) {
  const { status } = useNetworkStatus();

  const dotColour =
    status.health === "healthy" || status.health === "loading"
      ? "bg-emerald-400"
      : status.health === "elevated"
        ? "bg-amber-400"
        : "bg-rose-400";

  const label =
    status.health === "loading"
      ? "Checking Stellar network…"
      : status.health === "healthy"
        ? "Stellar network healthy"
        : status.health === "elevated"
          ? "Stellar network: elevated fees"
          : status.health === "congested"
            ? "Stellar network: congested"
            : "Stellar network unreachable";

  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={clsx(
        "inline-block h-2 w-2 rounded-full",
        dotColour,
        status.health === "healthy" && "animate-pulse",
        className,
      )}
    />
  );
}
