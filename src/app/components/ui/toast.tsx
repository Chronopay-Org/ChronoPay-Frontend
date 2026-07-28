"use client";

/**
 * Toast — single notification item, with optional grouped-stack rendering
 * and optional undo affordance (countdown ring + Ctrl+Z shortcut).
 *
 * Accessibility:
 *  - success/info  → role="status"  aria-live="polite"
 *  - warning/error → role="alert"   aria-live="assertive"
 *  - Grouped toast announces "{count} {category} notifications" politely
 *  - Expand/collapse button has aria-expanded + aria-controls
 *  - Auto-dismiss pauses on hover/focus (including keyboard focus anywhere
 *    inside the toast)
 *  - Undo button has aria-label with Ctrl+Z hint; Ctrl+Z fires undo while
 *    the toast is rendered (scoped — does not bleed to other toasts)
 *  - Countdown ring carries aria-label with remaining seconds and
 *    aria-hidden="true" on the SVG so screen readers don't announce the visual
 *  - A live-region announces "Undo available (Ctrl+Z)" on mount when onUndo
 *    is provided, and "Action undone" after a successful undo
 *  - Respects prefers-reduced-motion (opacity-only when reduced)
 *  - Countdown ring animation skipped when prefers-reduced-motion: reduce
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  X,
  ChevronDown,
  ChevronUp,
  Undo2,
} from "lucide-react";
import clsx from "clsx";
import type { ToastItem, ToastVariant } from "@/hooks/use-toast";

// ─── Variant config ───────────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ElementType;
    iconClass: string;
    containerClass: string;
    titleClass: string;
    badgeClass: string;
    undoClass: string;
    ringColor: string;
    role: "status" | "alert";
    ariaLive: "polite" | "assertive";
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    containerClass:
      "border-emerald-400/25 bg-emerald-950/85 shadow-[0_8px_32px_rgba(52,211,153,0.12)]",
    titleClass: "text-emerald-100",
    badgeClass: "bg-emerald-400/20 text-emerald-300",
    undoClass:
      "text-emerald-300 hover:bg-emerald-400/15 focus-visible:ring-emerald-300",
    ringColor: "#34d399", // emerald-400
    role: "status",
    ariaLive: "polite",
  },
  info: {
    icon: Info,
    iconClass: "text-cyan-400",
    containerClass:
      "border-cyan-400/25 bg-cyan-950/85 shadow-[0_8px_32px_rgba(34,211,238,0.12)]",
    titleClass: "text-cyan-100",
    badgeClass: "bg-cyan-400/20 text-cyan-300",
    undoClass:
      "text-cyan-300 hover:bg-cyan-400/15 focus-visible:ring-cyan-300",
    ringColor: "#22d3ee", // cyan-400
    role: "status",
    ariaLive: "polite",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-400",
    containerClass:
      "border-amber-400/25 bg-amber-950/85 shadow-[0_8px_32px_rgba(245,158,11,0.12)]",
    titleClass: "text-amber-100",
    badgeClass: "bg-amber-400/20 text-amber-300",
    undoClass:
      "text-amber-300 hover:bg-amber-400/15 focus-visible:ring-amber-300",
    ringColor: "#f59e0b", // amber-400
    role: "alert",
    ariaLive: "assertive",
  },
  error: {
    icon: XCircle,
    iconClass: "text-rose-400",
    containerClass:
      "border-rose-400/25 bg-rose-950/85 shadow-[0_8px_32px_rgba(248,113,113,0.12)]",
    titleClass: "text-rose-100",
    badgeClass: "bg-rose-400/20 text-rose-300",
    undoClass:
      "text-rose-300 hover:bg-rose-400/15 focus-visible:ring-rose-300",
    ringColor: "#fb7185", // rose-400
    role: "alert",
    ariaLive: "assertive",
  },
};

// ─── Motion variants ──────────────────────────────────────────────────────────

const motionVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.97 },
};

const panelVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─── SVG Countdown Ring ───────────────────────────────────────────────────────

/**
 * CountdownRing renders a circular SVG progress ring that drains clockwise
 * from full (duration) to empty (0). It uses a CSS animation keyed on the
 * `paused` state so the animation pauses smoothly on hover/focus.
 *
 * When `prefersReducedMotion` is true the ring is rendered statically at its
 * current progress value rather than animating.
 */
interface CountdownRingProps {
  /** Total duration in ms */
  duration: number;
  /** Elapsed ms at the moment the ring was last resumed */
  elapsedAtResume: number;
  /** Timestamp (Date.now()) when the current run started */
  resumeTimestamp: number;
  /**
   * Snapshot of Date.now() at render time, passed in from the parent so that
   * the ring calculation does not call Date.now() itself (satisfies the
   * react-hooks/purity rule about impure functions in render).
   */
  nowTimestamp: number;
  /** Whether the countdown is currently paused */
  paused: boolean;
  /** Stroke colour for the ring fill */
  color: string;
  /** Whether to suppress animation (prefers-reduced-motion) */
  reducedMotion?: boolean;
  /** Size of the SVG square in px (default 28) */
  size?: number;
}

function CountdownRing({
  duration,
  elapsedAtResume,
  resumeTimestamp,
  nowTimestamp,
  paused,
  color,
  reducedMotion = false,
  size = 28,
}: CountdownRingProps) {
  const radius = (size - 4) / 2; // 2px stroke on each side
  const circumference = 2 * Math.PI * radius;

  const { dashOffset, remainingMs } = useMemo(() => {
    const elapsedNow = paused
      ? elapsedAtResume
      : elapsedAtResume + (nowTimestamp - resumeTimestamp);
    const remaining = Math.max(0, duration - elapsedNow);
    const fraction = remaining / duration; // 1 = full, 0 = empty
    const offset = circumference * (1 - fraction);
    const animMs = reducedMotion || paused ? 0 : remaining;
    return { dashOffset: offset, remainingMs: animMs };
  }, [paused, elapsedAtResume, resumeTimestamp, nowTimestamp, duration, circumference, reducedMotion]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0 -rotate-90"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-white/10"
      />
      {/* Fill — drains as time passes */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={
          reducedMotion || paused
            ? {}
            : {
                transition: `stroke-dashoffset ${remainingMs}ms linear`,
              }
        }
      />
    </svg>
  );
}

// ─── useReducedMotion ─────────────────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const {
    id,
    variant,
    title,
    description,
    duration = 5000,
    count,
    messages,
    category,
    onUndo,
  } = toast;
  const config = variantConfig[variant];
  const Icon = config.icon;
  const isGrouped = count > 1;
  const panelId = `toast-panel-${id}`;
  const undoBtnRef = useRef<HTMLButtonElement>(null);
  const announcerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [undoDone, setUndoDone] = useState(false);

  // Track elapsed time so hover/focus pause works with the countdown ring
  const elapsed = useRef(0);
  const startTime = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Snapshot for the ring to know where it was when paused/resumed.
  // Stored in state so CountdownRing re-renders when it changes.
  // Lazy initializer runs once on mount (not re-render), so Date.now()
  // here is safe — it's equivalent to an effect with [] deps.
  const [ringMeta, setRingMeta] = useState<{
    elapsedAtResume: number;
    resumeTimestamp: number;
    nowTimestamp: number;
  }>(() => {
    const now = Date.now();
    return { elapsedAtResume: 0, resumeTimestamp: now, nowTimestamp: now };
  });

  // ── Auto-dismiss (pauses on hover / focus, pauses when expanded) ──────────
  useEffect(() => {
    if (duration === 0) return;
    if (paused || expanded) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (startTime.current !== null) {
        elapsed.current += Date.now() - startTime.current;
        startTime.current = null;
      }
      return;
    }

    startTime.current = Date.now();
    const remaining = duration - elapsed.current;
    timerRef.current = setTimeout(() => onDismiss(id), remaining);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [paused, expanded, duration, id, onDismiss]);

  // ── Update ring resume meta whenever pause state changes ─────────────────
  useEffect(() => {
    if (!paused && !expanded) {
      // Resuming — snapshot current elapsed and timestamp so ring re-anchors
      const meta = {
        elapsedAtResume: elapsed.current,
        resumeTimestamp: Date.now(),
        nowTimestamp: Date.now(),
      };
      setRingMeta(meta);
    }
  }, [paused, expanded]);

  // ── Undo handler — declared before the keyboard effect that uses it ───────
  const undoDoneRef = useRef(false);
  const handleUndo = useCallback(() => {
    if (!onUndo || undoDoneRef.current) return;
    undoDoneRef.current = true;
    onUndo();
    setUndoDone(true);
    // Announce success to screen readers
    if (announcerRef.current) {
      announcerRef.current.textContent = "Action undone.";
    }
    // Dismiss the toast after a brief moment so the announcement lands
    setTimeout(() => onDismiss(id), 300);
  }, [onUndo, onDismiss, id]);

  // ── Scoped Ctrl+Z keyboard shortcut ──────────────────────────────────────
  // Only fires while this toast is mounted and has an onUndo handler.
  useEffect(() => {
    if (!onUndo) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "z" &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // Only intercept if the focus is not inside a text input/textarea/
        // contenteditable where Ctrl+Z should remain native.
        const target = e.target instanceof HTMLElement ? e.target : null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable ||
            target.contentEditable === "true")
        ) {
          return;
        }
        e.preventDefault();
        handleUndo();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, handleUndo]);

  // ── Announce undo availability to screen readers on mount ─────────────────
  useEffect(() => {
    if (!onUndo) return;
    // Small delay ensures the toast's own aria-live announcement fires first
    const t = setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent =
          "Undo available. Press Ctrl+Z or activate the Undo button.";
      }
    }, 600);
    return () => clearTimeout(t);
  }, [onUndo]);

  const handleMouseEnter = useCallback(() => setPaused(true), []);
  const handleMouseLeave = useCallback(() => setPaused(false), []);
  const handleFocus = useCallback(() => setPaused(true), []);
  const handleBlur = useCallback(() => setPaused(false), []);

  return (
    <motion.div
      layout
      variants={motionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="motion-reduce:translate-y-0 motion-reduce:scale-100"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Hidden live region for undo announcements — separate from the toast's
          own aria-live so they don't clobber each other */}
      {onUndo && (
        <div
          ref={announcerRef}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      )}

      <div
        role={config.role}
        aria-live={config.ariaLive}
        aria-atomic="true"
        aria-label={
          isGrouped
            ? `${count} ${category ?? variant} notifications: ${title}`
            : undefined
        }
        className={clsx(
          "relative flex w-full max-w-sm flex-col rounded-[20px] border backdrop-blur-md",
          config.containerClass,
        )}
      >
        {/* ── Main row ─────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 px-4 py-3">
          {/* Tone icon */}
          <Icon
            className={clsx("mt-0.5 h-5 w-5 shrink-0", config.iconClass)}
            aria-hidden="true"
          />

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className={clsx(
                  "text-sm font-semibold leading-5",
                  config.titleClass,
                )}
              >
                {title}
              </p>
              {/* Count badge — only shown when grouped */}
              {isGrouped && (
                <span
                  aria-label={`${count} notifications in this group`}
                  className={clsx(
                    "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold leading-none",
                    config.badgeClass,
                  )}
                >
                  {count}
                </span>
              )}
            </div>
            {description && !expanded && (
              <p className="mt-1 text-sm leading-5 text-slate-300">
                {description}
              </p>
            )}
          </div>

          {/* ── Undo affordance (ring + button) ──────────────────────── */}
          {onUndo && !undoDone && (
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {/* Countdown ring — visual only, aria-hidden */}
              {duration > 0 && (
                <div
                  aria-label={`${Math.ceil(
                    Math.max(
                      0,
                      (duration - ringMeta.elapsedAtResume) / 1000,
                    ),
                  )} seconds remaining`}
                  role="img"
                >
                  <CountdownRing
                    duration={duration}
                    elapsedAtResume={ringMeta.elapsedAtResume}
                    resumeTimestamp={ringMeta.resumeTimestamp}
                    nowTimestamp={ringMeta.nowTimestamp}
                    paused={paused || expanded}
                    color={config.ringColor}
                    reducedMotion={reducedMotion}
                    size={28}
                  />
                </div>
              )}

              {/* Undo button */}
              <button
                ref={undoBtnRef}
                type="button"
                onClick={handleUndo}
                aria-label="Undo (Ctrl+Z)"
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
                  config.undoClass,
                )}
              >
                <Undo2 className="h-3 w-3" aria-hidden="true" />
                Undo
              </button>
            </div>
          )}

          {/* Expand toggle — only when grouped */}
          {isGrouped && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={expanded ? "Collapse notifications" : "Expand notifications"}
              onClick={() => setExpanded((v) => !v)}
              className="ml-0 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          )}

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => onDismiss(id)}
            aria-label={`Dismiss: ${title}`}
            className="ml-0 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* ── Expanded group panel ──────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {isGrouped && expanded && (
            <motion.div
              id={panelId}
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <ul
                role="list"
                aria-label={`${count} ${category ?? variant} notifications`}
                className="flex flex-col gap-0 px-4 pb-3"
              >
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    className="flex items-start justify-between gap-2 border-t border-white/5 py-2"
                  >
                    <p className="text-sm text-slate-200">{msg.title}</p>
                    <time
                      className="shrink-0 text-xs text-slate-500"
                      dateTime={new Date(msg.timestamp).toISOString()}
                    >
                      {relativeTime(msg.timestamp)}
                    </time>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
