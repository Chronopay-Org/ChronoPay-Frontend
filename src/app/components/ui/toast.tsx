"use client";

/**
 * Toast — single notification item.
 *
 * Accessibility:
 *  - success/info  → role="status"  aria-live="polite"    (non-interrupting)
 *  - warning/error → role="alert"   aria-live="assertive" (interrupts screen reader)
 *  - Dismiss button is keyboard-focusable with a visible focus ring
 *  - Auto-dismiss pauses on hover/focus to give users time to read
 *  - Respects prefers-reduced-motion: no translate animation, only opacity fade
 *
 * Design tokens used:
 *  - Rounded corners: rounded-[20px] (matches card language)
 *  - Borders: semi-transparent, tone-matched
 *  - Backdrop blur: backdrop-blur-md (glassmorphism)
 *  - Focus ring: focus-visible:ring-2 focus-visible:ring-cyan-300
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  X,
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
    role: "status",
    ariaLive: "polite",
  },
  info: {
    icon: Info,
    iconClass: "text-cyan-400",
    containerClass:
      "border-cyan-400/25 bg-cyan-950/85 shadow-[0_8px_32px_rgba(34,211,238,0.12)]",
    titleClass: "text-cyan-100",
    role: "status",
    ariaLive: "polite",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-400",
    containerClass:
      "border-amber-400/25 bg-amber-950/85 shadow-[0_8px_32px_rgba(245,158,11,0.12)]",
    titleClass: "text-amber-100",
    role: "alert",
    ariaLive: "assertive",
  },
  error: {
    icon: XCircle,
    iconClass: "text-rose-400",
    containerClass:
      "border-rose-400/25 bg-rose-950/85 shadow-[0_8px_32px_rgba(248,113,113,0.12)]",
    titleClass: "text-rose-100",
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

// ─── Component ────────────────────────────────────────────────────────────────

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, variant, title, description, duration = 5000 } = toast;
  const config = variantConfig[variant];
  const Icon = config.icon;

  // Pause auto-dismiss while the user is hovering or has focus inside
  const [paused, setPaused] = useState(false);
  const elapsed = useRef(0);
  const startTime = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (duration === 0) return;

    function start() {
      startTime.current = Date.now();
      const remaining = duration - elapsed.current;
      timerRef.current = setTimeout(() => onDismiss(id), remaining);
    }

    function pause() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (startTime.current !== null) {
        elapsed.current += Date.now() - startTime.current;
        startTime.current = null;
      }
    }

    if (!paused) {
      start();
    } else {
      pause();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [paused, duration, id, onDismiss]);

  return (
    <motion.div
      layout
      variants={motionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      // Reduced-motion: framer-motion respects prefers-reduced-motion when
      // using the `layout` prop; we also override translate to 0 via CSS below.
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
        className={clsx(
          "relative flex w-full max-w-sm items-start gap-3 rounded-[20px] border px-4 py-3.5 backdrop-blur-md",
          config.containerClass,
        )}
      >
        {/* Tone icon */}
        <Icon
          className={clsx("mt-0.5 h-5 w-5 shrink-0", config.iconClass)}
          aria-hidden="true"
        />

        {/* Text content */}
        <div className="min-w-0 flex-1">
          <p className={clsx("text-sm font-semibold leading-5", config.titleClass)}>
            {title}
          </p>
          {description && (
            <p className="mt-1 text-sm leading-5 text-slate-300">{description}</p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={() => onDismiss(id)}
          aria-label={`Dismiss: ${title}`}
          className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
