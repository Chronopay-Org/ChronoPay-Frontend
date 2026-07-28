"use client";

/**
 * SupplierFollowControl
 *
 * A follow/subscribe toggle for a supplier's new-slot announcements, with a
 * lightweight popover for per-channel notification preferences (email, push,
 * in-app).
 *
 * Accessibility (WCAG 2.1 AA)
 * ───────────────────────────
 * - The follow toggle is a <button> with aria-pressed reflecting subscribe
 *   state, matching the toggle pattern used across the dashboard.
 * - The preferences popover uses role="dialog" with a label, traps Tab focus,
 *   and closes on Escape (returning focus to its trigger).
 * - Subscribe/unsubscribe outcomes — including failures — are announced via
 *   a polite LiveRegion so screen reader users aren't left guessing.
 * - Colour is never the sole differentiator; state is also conveyed by text
 *   and icon shape.
 *
 * Responsive / RTL
 * ────────────────
 * - `dir="auto"` on the wrapper honours RTL document direction.
 * - The popover clamps to the viewport width on narrow screens.
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Bell, BellRing, Settings2, X, AlertCircle } from "lucide-react";
import { LiveRegion } from "@/components/common/LiveRegion";

export interface FollowChannelPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export const DEFAULT_FOLLOW_PREFERENCES: FollowChannelPreferences = {
  email: true,
  push: false,
  inApp: true,
};

const CHANNEL_CONFIG: {
  key: keyof FollowChannelPreferences;
  label: string;
  description: string;
}[] = [
  { key: "email", label: "Email", description: "New-slot digests to your inbox" },
  { key: "push", label: "Push", description: "Instant alerts on this device" },
  { key: "inApp", label: "In-app", description: "Show in your notification centre" },
];

function channelSummary(preferences: FollowChannelPreferences): string {
  const active = CHANNEL_CONFIG.filter((c) => preferences[c.key]).map((c) => c.label);
  return active.length > 0 ? active.join(", ") : "no channels selected";
}

export interface SupplierFollowControlProps {
  /** Display name used in accessible labels and announcements. */
  supplierName: string;
  initialFollowing?: boolean;
  initialPreferences?: FollowChannelPreferences;
  /** Called when the buyer subscribes. Reject/throw to simulate a failure. */
  onSubscribe?: (preferences: FollowChannelPreferences) => Promise<void> | void;
  /** Called when the buyer unsubscribes. Reject/throw to simulate a failure. */
  onUnsubscribe?: () => Promise<void> | void;
  /** Called whenever channel preferences change while already following. */
  onPreferencesChange?: (preferences: FollowChannelPreferences) => Promise<void> | void;
  className?: string;
}

export function SupplierFollowControl({
  supplierName,
  initialFollowing = false,
  initialPreferences = DEFAULT_FOLLOW_PREFERENCES,
  onSubscribe,
  onUnsubscribe,
  onPreferencesChange,
  className = "",
}: SupplierFollowControlProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [announcement, setAnnouncement] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const followBtnRef = useRef<HTMLButtonElement>(null);
  const prefsBtnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const baseId = useId();
  const popoverId = `${baseId}-follow-popover`;
  const titleId = `${popoverId}-title`;

  const close = () => {
    setIsOpen(false);
    prefsBtnRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current?.contains(event.target as Node) ||
        prefsBtnRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      close();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handlePopoverKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      popoverRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleToggleFollow = async () => {
    setStatus("pending");
    setErrorMessage(null);
    const nextFollowing = !following;

    try {
      if (nextFollowing) {
        await onSubscribe?.(preferences);
      } else {
        await onUnsubscribe?.();
      }
      setFollowing(nextFollowing);
      setStatus("idle");
      setAnnouncement(
        nextFollowing
          ? `Following ${supplierName}. Notifications via ${channelSummary(preferences)}.`
          : `Unfollowed ${supplierName}.`,
      );
      if (nextFollowing) {
        setIsOpen(true);
      }
    } catch (error) {
      setStatus("error");
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
      setAnnouncement(
        `Couldn't ${nextFollowing ? "follow" : "unfollow"} ${supplierName}. ${message}`,
      );
    }
  };

  const handleChannelToggle = async (key: keyof FollowChannelPreferences) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    try {
      await onPreferencesChange?.(next);
      setAnnouncement(
        `Notification channels updated: ${channelSummary(next)}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't save your preference.";
      setErrorMessage(message);
      setAnnouncement(message);
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`} dir="auto">
      <button
        ref={followBtnRef}
        type="button"
        aria-pressed={following}
        aria-busy={status === "pending"}
        disabled={status === "pending"}
        onClick={handleToggleFollow}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5",
          "text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          "disabled:cursor-wait disabled:opacity-70",
          following
            ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]"
            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        {following ? (
          <BellRing className="h-3.5 w-3.5 shrink-0" aria-hidden={true} />
        ) : (
          <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden={true} />
        )}
        {following ? "Following" : "Follow"}
        <span className="sr-only"> {supplierName} for new-slot announcements</span>
      </button>

      {following && (
        <button
          ref={prefsBtnRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? popoverId : undefined}
          aria-label={`Notification preferences for ${supplierName}`}
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-cyan-300/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden={true} />
        </button>
      )}

      {isOpen && following && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={handlePopoverKeyDown}
          className={[
            "absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)]",
            "rounded-2xl border border-white/10 bg-slate-900 p-3 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.9)]",
            "animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none",
          ].join(" ")}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p id={titleId} className="text-sm font-semibold text-white">
              Notify me via
            </p>
            <button
              type="button"
              aria-label="Close notification preferences"
              onClick={close}
              className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <X className="h-3.5 w-3.5" aria-hidden={true} />
            </button>
          </div>

          <ul className="space-y-2">
            {CHANNEL_CONFIG.map(({ key, label, description }) => (
              <li key={key}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1 hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={() => handleChannelToggle(key)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">{label}</span>
                    <span className="block text-xs text-slate-400">{description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === "error" && errorMessage && (
        <p className="flex items-center gap-1 text-xs text-rose-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden={true} />
          {errorMessage}
        </p>
      )}

      <LiveRegion ariaLive="polite">{announcement}</LiveRegion>
    </div>
  );
}
