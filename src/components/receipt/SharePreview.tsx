"use client";

/**
 * SharePreview — accessible share section that shows a live preview card
 * with an editable subtitle before copying the link or sharing to a channel.
 *
 * Features:
 *  - Editable subtitle with character counter (max 120, warning at 100)
 *  - Live preview card reflecting the subtitle
 *  - Social share buttons (Twitter/X, LinkedIn, WhatsApp)
 *  - Copy link with confirmation
 *  - Persists subtitle per receipt in localStorage
 */

import { useState, useId, useEffect } from "react";
import {
  X,
  Globe,
  MessageCircle,
  Check,
  Copy,
} from "lucide-react";
import { LiveRegion } from "@/components/common/LiveRegion";
import type { ReceiptData } from "./types";
import { buildShareLink, truncateHash } from "./masking";

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_SUBTITLE_LENGTH = 120;
const WARNING_THRESHOLD = 20; // warn when ≤ 20 chars remain
const STORAGE_PREFIX = "chronopay-share-subtitle-";

// ── Subtitle persistence helpers ───────────────────────────────────────────

function loadSubtitle(receiptId: string): string {
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${receiptId}`) ?? "";
  } catch {
    return "";
  }
}

function saveSubtitle(receiptId: string, text: string) {
  try {
    if (text) {
      window.localStorage.setItem(`${STORAGE_PREFIX}${receiptId}`, text);
    } else {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${receiptId}`);
    }
  } catch {
    // localStorage may be unavailable
  }
}

// ── Props ──────────────────────────────────────────────────────────────────

type SharePreviewProps = {
  receipt: ReceiptData;
};

// ── Component ──────────────────────────────────────────────────────────────

export function SharePreview({ receipt }: SharePreviewProps) {
  const sectionTitleId = useId();
  const subtitleInputId = useId();
  const subtitleHintId = useId();
  const subtitleCounterId = useId();

  const [subtitle, setSubtitle] = useState(() => loadSubtitle(receipt.id));
  const [copied, setCopied] = useState(false);

  // Persist subtitle changes
  useEffect(() => {
    saveSubtitle(receipt.id, subtitle);
  }, [subtitle, receipt.id]);

  const displaySubtitle = subtitle.trim() || receipt.title;
  const remaining = MAX_SUBTITLE_LENGTH - subtitle.length;
  const isWarning = remaining <= WARNING_THRESHOLD;
  const isOverLimit = remaining < 0;

  // ── Build share data ───────────────────────────────────────────────────

  const getShareLink = () =>
    buildShareLink(receipt, window.location.origin);

  const shareText = subtitle.trim() || receipt.title;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCopyLink = async () => {
    const link = getShareLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleTwitterShare = () => {
    const link = getShareLink();
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(link)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleLinkedInShare = () => {
    const link = getShareLink();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleWhatsAppShare = () => {
    const link = getShareLink();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${link}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <section
      aria-labelledby={sectionTitleId}
      className="receipt-no-print mb-6 rounded-3xl border border-white/10 bg-slate-950/80 p-4 sm:p-5"
    >
      {/* Header */}
      <div className="mb-4">
        <h3
          id={sectionTitleId}
          className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300"
        >
          Share this receipt
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Customise the subtitle and share with your network or copy a masked
          link.
        </p>
      </div>

      {/* Live preview card */}
      <div
        className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
        aria-label="Share card preview"
      >
        {/* Preview header bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Preview
          </span>
        </div>

        {/* Preview content */}
        <div className="p-4 sm:p-5">
          {/* Brand line */}
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
            ChronoPay
          </p>

          {/* Title (always visible) */}
          <p className="mt-1 text-base font-bold leading-snug text-white">
            {receipt.title}
          </p>

          {/* Subtitle preview (reflects edits live) */}
          <p
            className={`mt-1 text-sm leading-relaxed ${
              displaySubtitle && displaySubtitle !== receipt.title
                ? "text-slate-200"
                : "text-slate-500 italic"
            }`}
          >
            {displaySubtitle && displaySubtitle !== receipt.title
              ? displaySubtitle
              : "Add a custom subtitle above…"}
          </p>

          {/* Quick metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span>
              <span className="font-semibold text-slate-400">Total</span>{" "}
              {receipt.total}
            </span>
            <span>
              <span className="font-semibold text-slate-400">Tx</span>{" "}
              {truncateHash(receipt.txHash, 4, 4)}
            </span>
            <span>
              <span className="font-semibold text-slate-400">Settled</span>{" "}
              {receipt.settledAt}
            </span>
          </div>
        </div>
      </div>

      {/* Editable subtitle input */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor={subtitleInputId}
            className="text-sm font-semibold text-white"
          >
            Subtitle
          </label>
          <span
            id={subtitleCounterId}
            aria-live="polite"
            className={`text-xs font-mono tabular-nums ${
              isOverLimit
                ? "text-rose-400"
                : isWarning
                  ? "text-amber-400"
                  : "text-slate-500"
            }`}
          >
            {remaining}
            {isOverLimit && (
              <span className="ml-1 font-semibold">over limit</span>
            )}
          </span>
        </div>

        <input
          id={subtitleInputId}
          aria-describedby={`${subtitleHintId} ${subtitleCounterId}`}
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={MAX_SUBTITLE_LENGTH + 20} // allow overshoot for UX
          placeholder={receipt.title}
          className={`w-full rounded-2xl border bg-slate-950/90 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300 ${
            isOverLimit
              ? "border-rose-400/50 focus:border-rose-400"
              : "border-white/10"
          }`}
        />

        <p
          id={subtitleHintId}
          className="text-xs text-slate-500"
        >
          This appears as the subtitle when sharing. {MAX_SUBTITLE_LENGTH}{" "}
          characters max.
        </p>

        {isOverLimit && (
          <p
            role="alert"
            className="text-xs font-medium text-rose-400"
          >
            The subtitle is too long. Trim to {MAX_SUBTITLE_LENGTH} characters
            for best results.
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Copy link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-300/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          {copied ? (
            <>
              <Check
                className="h-3.5 w-3.5 text-emerald-300"
                aria-hidden="true"
              />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy link
            </>
          )}
        </button>

        <span
          aria-hidden="true"
          className="mx-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600"
        >
          or share via
        </span>

        {/* Twitter / X */}
        <button
          type="button"
          onClick={handleTwitterShare}
          aria-label="Share on X (Twitter)"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          onClick={handleLinkedInShare}
          aria-label="Share on LinkedIn"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-blue-400/40 hover:bg-blue-400/10 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* WhatsApp */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          aria-label="Share on WhatsApp"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Live region for screen-reader announcements */}
      <LiveRegion>
        {copied ? "Masked share link copied to clipboard." : ""}
      </LiveRegion>
    </section>
  );
}
