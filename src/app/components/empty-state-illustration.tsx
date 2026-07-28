"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, WifiOff } from "lucide-react";

export type EmptyStateVariant = "default" | "no-results" | "tight-filters" | "offline";

type EmptyStateIllustrationProps = {
  accentLabel: string;
  /**
   * Visual variant for the illustration. Defaults to "default" for backward
   * compatibility with existing EmptyStateCard usage.
   *   - no-results:    search magnifier with empty container
   *   - tight-filters: restrictive filter sliders
   *   - offline:       disconnected network state
   */
  variant?: EmptyStateVariant;
};

const VARIANT_COLORS: Record<EmptyStateVariant, { glow: string; accent: string }> = {
  default: {
    glow: "rgba(110,231,249,0.18)",
    accent: "cyan",
  },
  "no-results": {
    glow: "rgba(251,146,60,0.15)",
    accent: "amber",
  },
  "tight-filters": {
    glow: "rgba(167,139,250,0.15)",
    accent: "violet",
  },
  offline: {
    glow: "rgba(248,113,113,0.15)",
    accent: "red",
  },
};

/**
 * EmptyStateIllustration
 *
 * Renders a decorative, aria-hidden illustration with subtle looping animations.
 * Supports multiple visual variants for different empty-state scenarios.
 *
 * Accessibility / motion:
 *   - All animations are wrapped in `prefers-reduced-motion: no-preference` via
 *     the CSS classes in globals.css, so they are a no-op for reduced-motion users.
 *   - An IntersectionObserver adds `.es-paused` when the element leaves the
 *     viewport, freezing animations and saving GPU resources.
 *   - The element keeps `aria-hidden="true"` — it is purely decorative.
 */
export function EmptyStateIllustration({
  accentLabel,
  variant = "default",
}: EmptyStateIllustrationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const colors = VARIANT_COLORS[variant];

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

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      /* decorative */
      className={[
        "relative h-36 w-full overflow-hidden rounded-[1.75rem] border border-white/10",
        "bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(6,12,23,0.98))]",
        paused ? "es-paused" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Radial glow — pulses softly */}
      <div
        className="es-glow-pulse pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at top, ${colors.glow}, transparent 45%)`,
        }}
      />

      {/* Accent label */}
      <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/70">
        {accentLabel}
      </div>

      {/* Inner card panel */}
      <div className="absolute inset-x-6 bottom-6 top-14 rounded-[1.5rem] border border-white/10 bg-white/4 p-4">
        {variant === "default" && <DefaultVariant variant={variant} />}
        {variant === "no-results" && <NoResultsVariant variant={variant} />}
        {variant === "tight-filters" && <TightFiltersVariant variant={variant} />}
        {variant === "offline" && <OfflineVariant variant={variant} />}
      </div>
    </div>
  );
}

/* ── Default variant (original decorative panels) ── */
function DefaultVariant({} /* unused */: { variant: EmptyStateVariant }) {
  return (
    <div className="grid h-full grid-cols-[1.35fr,0.8fr] gap-3">
      <div className="es-drift-slow rounded-[1.25rem] border border-dashed border-cyan-200/20 bg-slate-950/40 p-3">
        <div className="flex h-full flex-col justify-between rounded-[1rem] border border-white/6 bg-white/4 p-3">
          <div className="h-2.5 w-20 rounded-full bg-cyan-200/25" />
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-white/10" />
            <div className="h-2 w-4/5 rounded-full bg-white/8" />
          </div>
        </div>
      </div>
      <div className="es-drift-fast flex flex-col gap-3">
        <div className="rounded-[1.1rem] border border-amber-200/15 bg-amber-300/8 p-3">
          <div className="h-10 rounded-full border border-dashed border-amber-200/20" />
        </div>
        <div className="flex-1 rounded-[1.1rem] border border-white/8 bg-slate-900/70 p-3">
          <div className="space-y-2">
            <div className="h-2 w-14 rounded-full bg-white/12" />
            <div className="h-2 rounded-full bg-cyan-200/18" />
            <div className="h-2 w-3/4 rounded-full bg-white/8" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── No results variant ── */
function NoResultsVariant({} /* unused */: { variant: EmptyStateVariant }) {
  return (
    <div className="flex h-full items-center justify-center gap-4">
      <div className="es-drift-slow flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-amber-200/20 bg-slate-950/40">
        <Search className="h-8 w-8" style={{ color: "rgba(251,146,60,0.4)" }} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-2 w-16 rounded-full bg-amber-200/20" />
        <div className="h-2 w-12 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

/* ── Tight filters variant ── */
function TightFiltersVariant({} /* unused */: { variant: EmptyStateVariant }) {
  return (
    <div className="flex h-full items-center justify-center gap-3">
      <div className="es-drift-slow flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-violet-200/20 bg-slate-950/40">
        <SlidersHorizontal className="h-6 w-6" style={{ color: "rgba(167,139,250,0.4)" }} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 w-20 rounded-full bg-violet-200/15" />
        <div className="h-1.5 w-14 rounded-full bg-white/8" />
        <div className="h-1.5 w-10 rounded-full bg-violet-200/10" />
      </div>
    </div>
  );
}

/* ── Offline variant ── */
function OfflineVariant({} /* unused */: { variant: EmptyStateVariant }) {
  return (
    <div className="flex h-full items-center justify-center gap-3">
      <div className="es-drift-slow flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-red-200/20 bg-slate-950/40">
        <WifiOff className="h-6 w-6" style={{ color: "rgba(248,113,113,0.4)" }} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 w-16 rounded-full bg-red-200/15" />
        <div className="h-1.5 w-10 rounded-full bg-white/8" />
      </div>
    </div>
  );
}
