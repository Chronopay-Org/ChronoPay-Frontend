"use client";

import { useEffect, useRef, useState } from "react";

type EmptyStateIllustrationProps = {
  accentLabel: string;
  variant?: "default" | "error" | "offline" | "blocked";
  alt?: string;
};

/**
 * EmptyStateIllustration
 *
 * Renders an illustration with subtle looping animations.
 * Added support for multiple variants (default, error, offline, blocked),
 * light/dark modes, and screen-reader accessibility via role="img" and aria-label.
 */
export function EmptyStateIllustration({
  accentLabel,
  variant = "default",
  alt,
}: EmptyStateIllustrationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPaused(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Theme configuration based on variant
  const themes = {
    default: {
      bg: "bg-slate-50 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(6,12,23,0.98))]",
      glow: "bg-[radial-gradient(circle_at_top,rgba(110,231,249,0.15),transparent_45%)]",
      badgeText: "text-cyan-700 dark:text-cyan-100",
      badgeBg: "bg-cyan-100/50 dark:bg-cyan-300/12",
      badgeBorder: "border-cyan-200/50 dark:border-cyan-200/20",
      cardBg: "bg-white/60 dark:bg-white/4",
      cardBorder: "border-slate-200 dark:border-white/10",
      box1Bg: "bg-slate-100/50 dark:bg-slate-950/40",
      box1Border: "border-cyan-200/50 dark:border-cyan-200/20",
      box2Bg: "bg-amber-50 dark:bg-amber-300/8",
      box2Border: "border-amber-200/50 dark:border-amber-200/15",
      box3Bg: "bg-white dark:bg-slate-900/70",
      accent1: "bg-cyan-400/30 dark:bg-cyan-200/25",
      accent2: "bg-cyan-400/20 dark:bg-cyan-200/18",
    },
    error: {
      bg: "bg-rose-50 dark:bg-[linear-gradient(180deg,rgba(39,20,24,0.98),rgba(18,9,12,0.98))]",
      glow: "bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.15),transparent_45%)]",
      badgeText: "text-rose-700 dark:text-rose-100",
      badgeBg: "bg-rose-100/50 dark:bg-rose-400/12",
      badgeBorder: "border-rose-200/50 dark:border-rose-300/20",
      cardBg: "bg-white/60 dark:bg-white/4",
      cardBorder: "border-rose-200 dark:border-rose-500/10",
      box1Bg: "bg-rose-100/30 dark:bg-rose-950/40",
      box1Border: "border-rose-200/50 dark:border-rose-300/20",
      box2Bg: "bg-red-50 dark:bg-red-500/8",
      box2Border: "border-red-200/50 dark:border-red-400/15",
      box3Bg: "bg-white dark:bg-rose-900/40",
      accent1: "bg-rose-400/30 dark:bg-rose-300/25",
      accent2: "bg-rose-400/20 dark:bg-rose-300/18",
    },
    offline: {
      bg: "bg-gray-50 dark:bg-[linear-gradient(180deg,rgba(31,41,55,0.98),rgba(17,24,39,0.98))]",
      glow: "bg-[radial-gradient(circle_at_top,rgba(156,163,175,0.15),transparent_45%)]",
      badgeText: "text-gray-700 dark:text-gray-200",
      badgeBg: "bg-gray-200/50 dark:bg-gray-500/12",
      badgeBorder: "border-gray-300/50 dark:border-gray-400/20",
      cardBg: "bg-white/60 dark:bg-white/4",
      cardBorder: "border-gray-200 dark:border-gray-500/10",
      box1Bg: "bg-gray-100/50 dark:bg-gray-900/40",
      box1Border: "border-gray-300/50 dark:border-gray-400/20",
      box2Bg: "bg-slate-100 dark:bg-slate-700/20",
      box2Border: "border-slate-300/50 dark:border-slate-500/15",
      box3Bg: "bg-white dark:bg-gray-800/70",
      accent1: "bg-gray-400/30 dark:bg-gray-400/25",
      accent2: "bg-gray-400/20 dark:bg-gray-400/18",
    },
    blocked: {
      bg: "bg-orange-50 dark:bg-[linear-gradient(180deg,rgba(43,26,11,0.98),rgba(24,14,5,0.98))]",
      glow: "bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.15),transparent_45%)]",
      badgeText: "text-orange-700 dark:text-orange-100",
      badgeBg: "bg-orange-100/50 dark:bg-orange-400/12",
      badgeBorder: "border-orange-200/50 dark:border-orange-300/20",
      cardBg: "bg-white/60 dark:bg-white/4",
      cardBorder: "border-orange-200 dark:border-orange-500/10",
      box1Bg: "bg-orange-100/30 dark:bg-orange-950/40",
      box1Border: "border-orange-200/50 dark:border-orange-300/20",
      box2Bg: "bg-amber-50 dark:bg-amber-500/8",
      box2Border: "border-amber-200/50 dark:border-amber-400/15",
      box3Bg: "bg-white dark:bg-orange-900/40",
      accent1: "bg-orange-400/30 dark:bg-orange-300/25",
      accent2: "bg-orange-400/20 dark:bg-orange-300/18",
    }
  };

  const theme = themes[variant];

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={alt || accentLabel || `${variant} state illustration`}
      className={[
        "relative h-36 w-full overflow-hidden rounded-[1.75rem] border border-black/5 dark:border-white/10",
        theme.bg,
        paused ? "es-paused" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Radial glow — pulses softly */}
      <div
        className={`es-glow-pulse pointer-events-none absolute inset-0 rounded-[inherit] ${theme.glow}`}
      />

      {/* Accent label */}
      <div className={`absolute left-5 top-5 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${theme.badgeText} ${theme.badgeBg} ${theme.badgeBorder}`}>
        {accentLabel}
      </div>

      {/* Inner card panel */}
      <div className={`absolute inset-x-6 bottom-6 top-14 rounded-[1.5rem] border p-4 ${theme.cardBg} ${theme.cardBorder}`}>
        <div className="grid h-full grid-cols-[1.35fr,0.8fr] gap-3">
          {/* Left column — drifts slowly */}
          <div className={`es-drift-slow rounded-[1.25rem] border border-dashed p-3 ${theme.box1Bg} ${theme.box1Border}`}>
            <div className={`flex h-full flex-col justify-between rounded-[1rem] border border-black/5 dark:border-white/6 bg-white/50 dark:bg-white/4 p-3`}>
              <div className={`h-2.5 w-20 rounded-full ${theme.accent1}`} />
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10" />
                <div className="h-2 w-4/5 rounded-full bg-slate-200 dark:bg-white/8" />
              </div>
            </div>
          </div>

          {/* Right column — drifts at a different phase */}
          <div className="es-drift-fast flex flex-col gap-3">
            <div className={`rounded-[1.1rem] border p-3 ${theme.box2Bg} ${theme.box2Border}`}>
              <div className={`h-10 rounded-full border border-dashed ${theme.box2Border}`} />
            </div>
            <div className={`flex-1 rounded-[1.1rem] border border-black/5 dark:border-white/8 p-3 ${theme.box3Bg}`}>
              <div className="space-y-2">
                <div className="h-2 w-14 rounded-full bg-slate-200 dark:bg-white/12" />
                <div className={`h-2 rounded-full ${theme.accent2}`} />
                <div className="h-2 w-3/4 rounded-full bg-slate-200 dark:bg-white/8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

