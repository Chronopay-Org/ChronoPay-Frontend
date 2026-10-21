import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { MoreVertical, ThumbsUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StarRating } from "./star-rating";

export interface ReviewCardProps {
  id: string;
  authorName: string;
  isVerified?: boolean;
  rating: number;
  date: string;
  content: string;
  helpfulCount?: number;
  isHelpful?: boolean;
  onHelpfulToggle?: (id: string) => void;
  onReport?: (id: string, reason: string) => void;
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
  onHelpfulToggle,
  onReport,
  className = "",
}: ReviewCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
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
        setIsReportModalOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onReport && reportReason.trim()) {
      onReport(id, reportReason);
      setIsReportModalOpen(false);
      setIsMenuOpen(false);
      setReportReason("");
    }
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
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
          >
            <div className="flex items-center gap-3 mb-4 text-rose-400">
              <AlertTriangle size={24} />
              <h2 id="report-dialog-title" className="text-xl font-bold text-white">
                Report Review
              </h2>
            </div>
            
            <form onSubmit={handleReportSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <label htmlFor="report-reason" className="text-sm font-medium text-slate-300">
                  Why are you reporting this review?
                </label>
                <textarea
                  id="report-reason"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 min-h-[100px] resize-y"
                  placeholder="Please provide details..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reportReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
