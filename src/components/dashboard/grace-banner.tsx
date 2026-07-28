"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

export interface GraceBannerProps {
  /** Unix timestamp (ms) when the grace window expires */
  graceExpiresAt: number;
  /** Called when user clicks "Notify supplier" */
  onNotifySupplier?: () => void;
  /** Called when grace window has fully expired */
  onExpired?: () => void;
  /** Optional extra classes on the wrapper element */
  className?: string;
  /**
   * Inject a clock source (ms since epoch) for testing.
   * Defaults to `Date.now`.
   */
  now?: () => number;
}

/** Format remaining seconds as "M:SS". */
function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * GraceBanner
 *
 * Shown during a redemption flow when the buyer has arrived past the
 * scheduled time but is still within the supplier's grace window. Displays
 * a live countdown and a quick-action button to notify the supplier.
 *
 * Accessibility
 * - `role="alert"` so screen readers announce it on mount.
 * - Countdown region uses `aria-live="off"` to suppress per-second noise;
 *   a separate visually-hidden polite region announces updates once per
 *   minute so AT users stay informed without being overwhelmed.
 * - When the window expires the banner announces expiry and calls `onExpired`.
 * - Focus is not stolen — the banner is non-modal.
 * - Meets WCAG 2.1 AA: amber palette passes 4.5 : 1 on the dark surface.
 */
export function GraceBanner({
  graceExpiresAt,
  onNotifySupplier,
  onExpired,
  className = "",
  now = Date.now,
}: GraceBannerProps) {
  const getRemainingSeconds = () =>
    Math.max(0, Math.round((graceExpiresAt - now()) / 1000));

  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    getRemainingSeconds
  );
  const [notified, setNotified] = useState(false);
  const [expired, setExpired] = useState(remainingSeconds === 0);

  // Track last announced minute for the AT polite region
  const lastAnnouncedMinuteRef = useRef<number | null>(null);
  const [minuteAnnouncement, setMinuteAnnouncement] = useState("");

  const onExpiredRef = useRef(onExpired);
  useEffect(() => {
    onExpiredRef.current = onExpired;
  });

  useEffect(() => {
    if (remainingSeconds === 0) return;

    const id = setInterval(() => {
      const secs = getRemainingSeconds();
      setRemainingSeconds(secs);

      const currentMinute = Math.ceil(secs / 60);

      // Announce once per minute change
      if (currentMinute !== lastAnnouncedMinuteRef.current) {
        lastAnnouncedMinuteRef.current = currentMinute;
        if (secs > 0) {
          setMinuteAnnouncement(
            `Grace window: ${currentMinute} minute${currentMinute !== 1 ? "s" : ""} remaining.`
          );
        }
      }

      if (secs === 0) {
        clearInterval(id);
        setExpired(true);
        setMinuteAnnouncement("Grace window has expired.");
        onExpiredRef.current?.();
      }
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graceExpiresAt]);

  function handleNotify() {
    setNotified(true);
    onNotifySupplier?.();
  }

  if (expired) {
    return (
      <>
        {/* Polite region persists so the expiry announcement remains accessible */}
        <span
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {minuteAnnouncement}
        </span>
        <div
          role="alert"
          aria-live="assertive"
          className={`flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-rose-100 ${className}`}
        >
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
          <p className="text-sm font-medium">
            Grace window has expired. Please contact the supplier directly to resolve your
            late arrival.
          </p>
        </div>
      </>
    );
  }

  const countdownLabel = formatCountdown(remainingSeconds);

  return (
    <>
      {/* Per-minute polite announcement for screen readers */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {minuteAnnouncement}
      </span>

      <div
        role="alert"
        aria-label={`Late arrival grace window: ${countdownLabel} remaining`}
        className={`flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        {/* Left: icon + text */}
        <div className="flex items-start gap-3 sm:items-center">
          <Clock
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-300 sm:mt-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-amber-100">
              Late arrival — grace window active
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              You have{" "}
              <span
                aria-hidden="true"
                data-testid="grace-countdown"
                className="font-mono tabular-nums font-bold text-amber-100"
              >
                {countdownLabel}
              </span>{" "}
              remaining to complete your redemption.
            </p>
          </div>
        </div>

        {/* Right: action */}
        <button
          type="button"
          onClick={handleNotify}
          disabled={notified}
          aria-label={
            notified ? "Supplier notified" : "Notify supplier about late arrival"
          }
          className={`inline-flex shrink-0 items-center justify-center rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
            notified
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 pointer-events-none"
              : "border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20 hover:border-amber-300/50 active:bg-amber-400/30"
          }`}
        >
          {notified ? "✓ Notified" : "Notify supplier"}
        </button>
      </div>
    </>
  );
}
