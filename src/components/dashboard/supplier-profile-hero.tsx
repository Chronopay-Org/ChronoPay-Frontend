"use client";

import { useId, useState, useCallback } from "react";
import {
  BadgeCheck,
  Clock,
  Calendar,
  Share2,
  Heart,
  HeartOff,
} from "lucide-react";
import { LiveRegion } from "@/components/common/LiveRegion";

export interface SupplierProfileHeroProps {
  name: string;
  title: string;
  coverImage?: string;
  avatar?: string;
  yearsActive: number;
  responseTime: string;
  badgeLabels?: string[];
  isVerified?: boolean;
  initialFollowing?: boolean;
  onFollowToggle?: (following: boolean) => Promise<void> | void;
  onShare?: () => void;
  className?: string;
}

export function SupplierProfileHero({
  name,
  title,
  coverImage,
  avatar,
  yearsActive,
  responseTime,
  badgeLabels = [],
  isVerified = false,
  initialFollowing = false,
  onFollowToggle,
  onShare,
  className = "",
}: SupplierProfileHeroProps) {
  const titleId = useId();
  const [following, setFollowing] = useState(initialFollowing);
  const [announcement, setAnnouncement] = useState("");
  const [followBusy, setFollowBusy] = useState(false);

  const handleFollowToggle = useCallback(async () => {
    if (followBusy) return;
    setFollowBusy(true);
    const next = !following;
    try {
      await onFollowToggle?.(next);
      setFollowing(next);
      setAnnouncement(
        next
          ? `Now following ${name}`
          : `Unfollowed ${name}`,
      );
    } catch {
      setAnnouncement(`Failed to ${next ? "follow" : "unfollow"} ${name}. Please try again.`);
    } finally {
      setFollowBusy(false);
    }
  }, [following, followBusy, name, onFollowToggle]);

  const handleShare = useCallback(() => {
    onShare?.();
    setAnnouncement(`Share dialog opened for ${name}`);
  }, [name, onShare]);

  return (
    <section
      aria-labelledby={titleId}
      className={`w-full ${className}`}
      dir="auto"
    >
      {/* ── Cover Image ─────────────────────────────────────────────── */}
      <div className="relative h-48 overflow-hidden rounded-2xl sm:h-64">
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            role="presentation"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sky-800/40 via-slate-800 to-indigo-900/40" />
        )}

        {/* Top gradient safe zone */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/80 to-transparent" />

        {/* Bottom gradient safe zone */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

        {/* Share button — top right */}
        <button
          type="button"
          onClick={handleShare}
          aria-label={`Share ${name} profile`}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-slate-200 backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <Share2 className="h-4 w-4" aria-hidden={true} />
        </button>

        {/* Avatar + identity overlay — bottom left */}
        <div className="absolute bottom-3 left-3 z-10 flex items-end gap-3 sm:bottom-4 sm:left-4 sm:gap-4">
          {avatar ? (
            <img
              src={avatar}
              alt={`${name} avatar`}
              className="h-12 w-12 rounded-full border-2 border-white/20 object-cover sm:h-16 sm:w-16"
              loading="lazy"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 bg-sky-600 sm:h-16 sm:w-16">
              <span className="text-lg font-bold text-white sm:text-2xl">
                {name.charAt(0).toUpperCase()}
              </span>
            </span>
          )}
          <div className="min-w-0">
            <h1
              id={titleId}
              className="truncate text-lg font-bold text-white drop-shadow-lg sm:text-2xl"
              title={name}
            >
              {name}
            </h1>
            <p
              className="truncate text-sm text-slate-200 drop-shadow-md sm:text-base"
              title={title}
            >
              {title}
            </p>
          </div>
        </div>
      </div>

      {/* ── Credentials Strip + Actions ─────────────────────────────── */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Credential chips */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="list"
          aria-label="Supplier credentials"
        >
          {isVerified ? (
            <span
              role="listitem"
              className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-100"
            >
              <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden={true} />
              <span>Verified</span>
            </span>
          ) : null}

          <span
            role="listitem"
            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100"
          >
            <Calendar className="h-3 w-3 shrink-0" aria-hidden={true} />
            <span>{yearsActive} {yearsActive === 1 ? "year" : "years"} active</span>
          </span>

          <span
            role="listitem"
            className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100"
          >
            <Clock className="h-3 w-3 shrink-0" aria-hidden={true} />
            <span>Response: {responseTime}</span>
          </span>

          {badgeLabels.map((label) => (
            <span
              key={label}
              role="listitem"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            aria-pressed={following}
            aria-busy={followBusy}
            disabled={followBusy}
            onClick={handleFollowToggle}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2",
              "text-sm font-semibold uppercase tracking-[0.14em] transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              "disabled:cursor-wait disabled:opacity-70",
              following
                ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            {following ? (
              <HeartOff className="h-4 w-4 shrink-0" aria-hidden={true} />
            ) : (
              <Heart className="h-4 w-4 shrink-0" aria-hidden={true} />
            )}
            {following ? "Following" : "Follow"}
            <span className="sr-only"> {name}</span>
          </button>

          {/* Desktop share is in the cover, but add a text alternative for clarity */}
          <span className="text-xs text-slate-500">Share</span>
        </div>
      </div>

      {/* ── Mobile Sticky CTA ────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-40 mt-4 border-t border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-sm sm:hidden">
        <button
          type="button"
          aria-pressed={following}
          aria-busy={followBusy}
          disabled={followBusy}
          onClick={handleFollowToggle}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3",
            "text-sm font-semibold uppercase tracking-[0.14em] transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
            "disabled:cursor-wait disabled:opacity-70",
            following
              ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]"
              : "border-white/20 bg-white/10 text-white hover:bg-white/20",
          ].join(" ")}
        >
          {following ? (
            <HeartOff className="h-5 w-5 shrink-0" aria-hidden={true} />
          ) : (
            <Heart className="h-5 w-5 shrink-0" aria-hidden={true} />
          )}
          {following ? "Following" : "Follow"}
          <span className="sr-only"> {name}</span>
        </button>
      </div>

      <LiveRegion ariaLive="polite">{announcement}</LiveRegion>
    </section>
  );
}
