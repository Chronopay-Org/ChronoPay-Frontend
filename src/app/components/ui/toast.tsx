"use client";

/** A live-region toast with optional, time-bound undo. */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Undo2,
  X,
  XCircle,
  AlertOctagon,
} from "lucide-react";
import clsx from "clsx";
import type { ToastItem, ToastVariant } from "@/hooks/use-toast";

const variantConfig: Record<ToastVariant, {
  icon: React.ElementType;
  iconClass: string;
  containerClass: string;
  titleClass: string;
  badgeClass: string;
  actionClass: string;
  closeClass: string;
  ringColor: string;
  role: "status" | "alert";
  ariaLive: "polite" | "assertive";
}> = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-400", containerClass: "border-emerald-400/25 bg-emerald-950/85 shadow-[0_8px_32px_rgba(52,211,153,0.12)]", titleClass: "text-emerald-100", badgeClass: "bg-emerald-400/20 text-emerald-300", actionClass: "text-emerald-200 hover:bg-emerald-400/15 focus-visible:ring-emerald-300", closeClass: "text-slate-400 hover:text-slate-300 focus-visible:ring-emerald-400", ringColor: "#34d399", role: "status", ariaLive: "polite" },
  info: { icon: Info, iconClass: "text-cyan-400", containerClass: "border-cyan-400/25 bg-cyan-950/85 shadow-[0_8px_32px_rgba(34,211,238,0.12)]", titleClass: "text-cyan-100", badgeClass: "bg-cyan-400/20 text-cyan-300", actionClass: "text-cyan-200 hover:bg-cyan-400/15 focus-visible:ring-cyan-300", closeClass: "text-slate-400 hover:text-slate-300 focus-visible:ring-cyan-400", ringColor: "#22d3ee", role: "status", ariaLive: "polite" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-400", containerClass: "border-amber-400/25 bg-amber-950/85 shadow-[0_8px_32px_rgba(245,158,11,0.12)]", titleClass: "text-amber-100", badgeClass: "bg-amber-400/20 text-amber-300", actionClass: "text-amber-200 hover:bg-amber-400/15 focus-visible:ring-amber-300", closeClass: "text-slate-400 hover:text-slate-300 focus-visible:ring-amber-400", ringColor: "#f59e0b", role: "alert", ariaLive: "assertive" },
  error: { icon: XCircle, iconClass: "text-rose-400", containerClass: "border-rose-400/25 bg-rose-950/85 shadow-[0_8px_32px_rgba(248,113,113,0.12)]", titleClass: "text-rose-100", badgeClass: "bg-rose-400/20 text-rose-300", actionClass: "text-rose-200 hover:bg-rose-400/15 focus-visible:ring-rose-300", closeClass: "text-slate-400 hover:text-slate-300 focus-visible:ring-rose-400", ringColor: "#fb7185", role: "alert", ariaLive: "assertive" },
  critical: { icon: AlertOctagon, iconClass: "text-red-500 animate-pulse", containerClass: "border-red-500/50 bg-red-950 shadow-[0_8px_32px_rgba(239,68,68,0.25)]", titleClass: "text-red-50 font-bold", badgeClass: "bg-red-500/30 text-red-200", actionClass: "text-red-200 hover:bg-red-500/20 focus-visible:ring-red-400", closeClass: "text-red-300 hover:text-red-200 focus-visible:ring-red-400", ringColor: "#ef4444", role: "alert", ariaLive: "assertive" },
};

const motionVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.97 },
};

function relativeTime(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;
}

function CountdownRing({ progress, color, reducedMotion }: { progress: number; color: string; reducedMotion: boolean | null }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  return (
    <svg aria-hidden="true" className="h-7 w-7 -rotate-90 shrink-0" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r={radius} fill="none" stroke="currentColor" strokeWidth="2" className="text-white/15" />
      <circle
        cx="14" cy="14" r={radius} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={reducedMotion ? undefined : { transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

interface ToastProps { toast: ToastItem; onDismiss: (id: string) => void; }

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, variant, title, description, count, messages, category, onUndo } = toast;
  const isCritical = variant === "critical";
  const duration = toast.duration ?? (isCritical ? 0 : 5000);
  const config = variantConfig[variant];
  const Icon = config.icon;
  const isGrouped = count > 1;
  const panelId = `toast-panel-${id}`;
  const reducedMotion = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number | null>(null);
  const elapsed = useRef(0);
  const undoUsed = useRef(false);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [undone, setUndone] = useState(false);
  const [remaining, setRemaining] = useState(duration);
  const [announcement, setAnnouncement] = useState("");

  const pause = paused || expanded;
  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    if (duration === 0 || undone) return;
    clearTimer();
    if (pause) {
      if (startedAt.current !== null) {
        elapsed.current += Date.now() - startedAt.current;
        startedAt.current = null;
        setRemaining(Math.max(0, duration - elapsed.current));
      }
      return;
    }
    const left = Math.max(0, duration - elapsed.current);
    startedAt.current = Date.now();
    setRemaining(left);
    timer.current = setTimeout(() => onDismiss(id), left);
    const ticker = setInterval(() => setRemaining(Math.max(0, duration - elapsed.current - (Date.now() - (startedAt.current ?? Date.now())))), 250);
    return () => { clearTimer(); clearInterval(ticker); };
  }, [clearTimer, duration, id, onDismiss, pause, undone]);

  useEffect(() => {
    if (!onUndo) return;
    const announceTimer = setTimeout(() => setAnnouncement("Undo available. Press Control or Command Z while the Undo button is focused."), 500);
    return () => clearTimeout(announceTimer);
  }, [onUndo]);

  const handleUndo = useCallback(() => {
    if (!onUndo || undoUsed.current) return;
    undoUsed.current = true;
    clearTimer();
    onUndo();
    setUndone(true);
    setAnnouncement("Action undone.");
    setTimeout(() => onDismiss(id), 300);
  }, [clearTimer, id, onDismiss, onUndo]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      handleUndo();
    }
  };
  const onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  };

  return (
    <motion.div layout variants={motionVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 }} className="motion-reduce:translate-y-0 motion-reduce:scale-100" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={onBlur} onKeyDown={onKeyDown}>
      {onUndo && <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>}
      <div role={config.role} aria-live={config.ariaLive} aria-atomic="true" aria-label={isGrouped ? `${count} ${category ?? variant} notifications: ${title}` : undefined} className={clsx("relative flex w-full max-w-sm flex-col rounded-[20px] border backdrop-blur-md", config.containerClass)}>
        <div className="flex items-start gap-3 px-4 py-3">
          <Icon className={clsx("mt-0.5 h-5 w-5 shrink-0", config.iconClass)} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><p className={clsx("text-sm font-semibold leading-5", config.titleClass)}>{title}</p>{isGrouped && <span aria-label={`${count} notifications in this group`} className={clsx("inline-flex rounded-full px-1.5 py-0.5 text-xs font-bold", config.badgeClass)}>{count}</span>}</div>
            {description && !expanded && <p className="mt-1 text-sm leading-5 text-slate-300">{description}</p>}
          </div>
          {onUndo && !undone && <div className="flex shrink-0 items-center gap-1.5">
            {duration > 0 && <span role="img" aria-label={`${Math.ceil(remaining / 1000)} seconds remaining`}><CountdownRing progress={Math.max(0, Math.min(1, remaining / duration))} color={config.ringColor} reducedMotion={reducedMotion} /></span>}
            <button type="button" onClick={handleUndo} aria-label="Undo (Ctrl+Z)" className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent", config.actionClass)}><Undo2 className="h-3 w-3" aria-hidden="true" />Undo</button>
          </div>}
          {isGrouped && <button type="button" aria-expanded={expanded} aria-controls={panelId} aria-label={expanded ? "Collapse notifications" : "Expand notifications"} onClick={() => setExpanded((value) => !value)} className={clsx("inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2", config.closeClass)}>{expanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}</button>}
          <button type="button" onClick={() => onDismiss(id)} aria-label={`Dismiss: ${title}`} className={clsx("inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2", config.closeClass)}><X className="h-3.5 w-3.5" aria-hidden="true" /></button>
        </div>
        <AnimatePresence initial={false}>{isGrouped && expanded && <motion.div id={panelId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><ul role="list" aria-label={`${count} ${category ?? variant} notifications`} className="px-4 pb-3">{messages.map((message) => <li key={message.id} className="flex justify-between gap-2 border-t border-white/5 py-2"><span className="text-sm text-slate-200">{message.title}</span><time className="shrink-0 text-xs text-slate-500" dateTime={new Date(message.timestamp).toISOString()}>{relativeTime(message.timestamp)}</time></li>)}</ul></motion.div>}</AnimatePresence>
      </div>
    </motion.div>
  );
}
