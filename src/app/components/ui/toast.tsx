"use client";

/**
 * Toast — single notification item, with optional grouped-stack rendering.
 *
 * Accessibility:
 *  - success/info  → role="status"  aria-live="polite"
 *  - warning/error → role="alert"   aria-live="assertive"
 *  - Grouped toast announces "{count} {category} notifications" politely
 *  - Expand/collapse button has aria-expanded + aria-controls
 *  - Auto-dismiss pauses on hover/focus
 *  - Respects prefers-reduced-motion (opacity-only when reduced)
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  X,
  ChevronDown,
  ChevronUp,
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

// ─── Component ────────────────────────────────────────────────────────────────

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, variant, title, description, duration = 5000, count, messages, category } = toast;
  const config = variantConfig[variant];
  const Icon = config.icon;
  const isGrouped = count > 1;
  const panelId = `toast-panel-${id}`;

  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const elapsed = useRef(0);
  const startTime = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-dismiss (pauses on hover / focus, pauses when expanded) ──────────
  useEffect(() => {
    if (duration === 0) return;
    // Don't auto-dismiss a group that's been expanded — user is reading it
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

  return (
    <motion.div
      layout
      variants={motionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="motion-reduce:translate-y-0 motion-reduce:scale-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
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
        <div className="flex items-start gap-3 px-4 py-3.5">
          {/* Tone icon */}
          <Icon
            className={clsx("mt-0.5 h-5 w-5 shrink-0", config.iconClass)}
            aria-hidden="true"
          />

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={clsx("text-sm font-semibold leading-5", config.titleClass)}>
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
              <p className="mt-1 text-sm leading-5 text-slate-300">{description}</p>
            )}
          </div>

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

        {/* ── Expandable panel ──────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={panelId}
              key="panel"
              variants={panelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <ul
                role="list"
                aria-label="All notifications in group"
                className="flex flex-col gap-1 border-t border-white/10 px-4 pb-3 pt-2"
              >
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    className="flex flex-col gap-0.5 rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-200">{msg.title}</span>
                    {msg.description && (
                      <span className="text-slate-400">{msg.description}</span>
                    )}
                    <span className="text-xs text-slate-500">{relativeTime(msg.timestamp)}</span>
                  </li>
                ))}
              </ul>

              {/* Dismiss-all shortcut inside expanded panel */}
              <div className="flex justify-end border-t border-white/10 px-4 pb-3 pt-2">
                <button
                  type="button"
                  onClick={() => onDismiss(id)}
                  className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300"
                >
                  Dismiss all
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
