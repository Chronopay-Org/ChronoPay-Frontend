"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import type { AutosaveStatus } from "./types";

export type { AutosaveStatus };

export interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt?: Date;
  onRetry?: () => void;
}

const toneByStatus: Record<AutosaveStatus, string> = {
  saving: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  saved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  offline: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  error: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

const labelByStatus: Record<AutosaveStatus, string> = {
  saving: "Saving…",
  saved: "Saved",
  offline: "Offline — changes queued",
  error: "Couldn't save",
};

function formatExactTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return "1 hr ago";
  if (diffHr < 24) return `${diffHr} hrs ago`;
  const diffDay = Math.floor(diffHr / 24);
  return diffDay === 1 ? "1 day ago" : `${diffDay} days ago`;
}

function SpinnerIcon({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <svg
      className={`h-3 w-3 shrink-0 ${reducedMotion ? "" : "animate-spin"}`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8l3 3 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5.5 5.5l5 5M10.5 5.5l-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatusIcon({ status }: { status: AutosaveStatus }) {
  switch (status) {
    case "saving":
      return null;
    case "saved":
      return <CheckIcon />;
    case "offline":
      return <OfflineIcon />;
    case "error":
      return <ErrorIcon />;
  }
}

export function AutosaveIndicator({
  status,
  lastSavedAt,
  onRetry,
}: AutosaveIndicatorProps) {
  const badgeId = "autosave-indicator-badge";
  const tooltipId = "autosave-indicator-tooltip";
  const liveId = "autosave-indicator-live";

  const [relativeLabel, setRelativeLabel] = useState<string>(() => {
    if (status !== "saved" || !lastSavedAt) return "";
    return formatRelativeTime(lastSavedAt);
  });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [liveText, setLiveText] = useState("");

  const prevStatusRef = useRef<AutosaveStatus | null>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  /* ── Relative-time auto-update (interval only — initial value set above) ── */
  useEffect(() => {
    if (status !== "saved" || !lastSavedAt) return;
    const id = setInterval(
      () => setRelativeLabel(formatRelativeTime(lastSavedAt)),
      30_000,
    );
    return () => clearInterval(id);
  }, [status, lastSavedAt]);

  /* ── prefers-reduced-motion listener (initial value set above) ──────────── */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ── Live-region announcement (status-change only) ────────────── */
  const currentLabel = labelByStatus[status];

  useEffect(() => {
    if (prevStatusRef.current === status) return;
    prevStatusRef.current = status;

    setLiveText("");
    const raf = requestAnimationFrame(() => {
      setLiveText(currentLabel);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  /* ── Tooltip visibility ───────────────────────────────────────── */
  const showTooltip = useCallback(() => {
    if (status === "saved") setTooltipVisible(true);
  }, [status]);

  const hideTooltip = useCallback(() => setTooltipVisible(false), []);

  const handleBadgeFocus = useCallback(() => {
    if (status === "saved") setTooltipVisible(true);
  }, [status]);

  const handleBadgeBlur = useCallback(
    (e: React.FocusEvent) => {
      if (
        e.relatedTarget instanceof Node &&
        containerRef.current?.contains(e.relatedTarget)
      ) {
        return;
      }
      setTooltipVisible(false);
    },
    [],
  );

  const handleBadgeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setTooltipVisible(false);
        badgeRef.current?.focus();
      }
    },
    [],
  );

  const isSaved = status === "saved";

  let suffix: ReactNode = null;
  if (status === "saved" && relativeLabel) {
    suffix = <span className="opacity-70">· {relativeLabel}</span>;
  }

  let retryButton: ReactNode = null;
  if (status === "error" && onRetry) {
    retryButton = (
      <button
        type="button"
        aria-label="Retry saving your booking progress"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onRetry();
        }}
        onFocus={(e) => e.stopPropagation()}
        className="ms-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-200 transition-colors hover:bg-rose-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        Retry
      </button>
    );
  }

  return (
    <span ref={containerRef} className="relative inline-flex items-center">
      {/* ── Live region (sr-only) ──────────────────────────────── */}
      <span
        id={liveId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveText}
      </span>

      {/* ── Badge ──────────────────────────────────────────────── */}
      <span
        ref={badgeRef}
        id={badgeId}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${toneByStatus[status]} ${
          tooltipVisible ? "ring-2 ring-cyan-400/60" : ""
        }`}
        tabIndex={isSaved ? 0 : undefined}
        role={isSaved ? "button" : undefined}
        aria-describedby={tooltipVisible ? tooltipId : undefined}
        aria-label={
          isSaved && lastSavedAt
            ? `Saved — last saved ${formatExactTimestamp(lastSavedAt)}`
            : labelByStatus[status]
        }
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={handleBadgeFocus}
        onBlur={handleBadgeBlur}
        onKeyDown={handleBadgeKeyDown}
      >
        {status === "saving" ? (
          <SpinnerIcon reducedMotion={reducedMotion} />
        ) : (
          <StatusIcon status={status} />
        )}

        <span>{labelByStatus[status]}</span>
        {suffix}
        {retryButton}
      </span>

      {/* ── Tooltip (exact timestamp) ──────────────────────────── */}
      {tooltipVisible && isSaved && lastSavedAt && (
        <span
          id={tooltipId}
          role="tooltip"
          tabIndex={-1}
          className="elevation-2 absolute z-50 max-w-xs rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white"
          style={{
            top: "100%",
            marginTop: "6px",
            insetInlineStart: "50%",
            translate: "-50% 0",
          }}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          Last saved: {formatExactTimestamp(lastSavedAt)}
          <span
            className="absolute -top-1 start-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-zinc-600 bg-zinc-800"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}