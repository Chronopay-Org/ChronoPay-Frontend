import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { MoreVertical, ThumbsUp, Flag, CheckCircle2 } from "lucide-react";
import { StarRating } from "./star-rating";
import {
  ReviewModerationFlagModal,
  type ReviewModerationReason,
} from "./review-moderation-flag-modal";

export interface ReviewCardProps {
  id: string;
  authorName: string;
  isVerified?: boolean;
  rating: number;
  date: string;
  content: string;
  helpfulCount?: number;
  isHelpful?: boolean;
  isAlreadyFlagged?: boolean;
  isOffline?: boolean;
  onHelpfulToggle?: (id: string) => void;
  onReport?: (id: string, reason: string) => void;
  onFlag?: (
    id: string,
    reason: ReviewModerationReason,
    context: string
  ) => Promise<void> | void;
  className?: string;
}

/**
 * ReviewCard
 *
 * Displays an individual review with star rating, helpful count, and a report menu.
 */
export function ReviewCard({
  id,
  authorName,
  isVerified = false,
  rating,
  date,
  content,
  helpfulCount = 0,
  isHelpful = false,
  isAlreadyFlagged = false,
  isOffline = false,
  onHelpfulToggle,
  onReport,
  onFlag,
  className = "",
}: ReviewCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Handle escape to close menus
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleFlagSubmit = async (
    reason: ReviewModerationReason,
    context: string
  ) => {
    await onFlag?.(id, reason, context);
    onReport?.(id, context || reason);
  };

  return (
    <article
      className={clsx(
        "rounded-2xl border border-white/10 bg-slate-900/50 p-6 flex flex-col gap-4",
        className
      )}
      data-testid="review-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{authorName}</span>
            {isVerified && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full" title="Verified Buyer">
                <CheckCircle2 size={12} />
                Verified
              </span>
            )}
            {isAlreadyFlagged && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full" data-testid="review-flagged-badge">
                <Flag size={12} aria-hidden="true" />
                Flagged
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <StarRating rating={rating} size={14} />
            <time dateTime={new Date(date).toISOString()}>{date}</time>
          </div>
        </div>

        {/* Overflow Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="More options"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
          >
            <MoreVertical size={16} />
          </button>
          
          {isMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-white/10 bg-slate-800 shadow-xl z-10 py-1"
              role="menu"
            >
              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:bg-white/5"
                role="menuitem"
                onClick={() => {
                  setIsReportModalOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Report review
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
        {content}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center gap-4 mt-2">
        <button
          type="button"
          onClick={() => onHelpfulToggle?.(id)}
          className={clsx(
            "flex items-center gap-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md px-2 py-1 -ml-2",
            isHelpful
              ? "text-cyan-400 bg-cyan-400/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          )}
          aria-pressed={isHelpful}
        >
          <ThumbsUp size={14} className={isHelpful ? "fill-current" : ""} />
          Helpful ({helpfulCount})
        </button>
      </div>

      {/* Report Modal */}
      <ReviewModerationFlagModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reviewId={id}
        isAlreadyFlagged={isAlreadyFlagged}
        isOffline={isOffline}
        onSubmit={handleFlagSubmit}
      />
    </article>
  );
}
