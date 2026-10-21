"use client";

/**
 * ReviewVoteButtons
 *
 * A WCAG 2.1 AA accessible, responsive voting control for customer reviews.
 * Renders helpful and unhelpful vote buttons with optimistic state updates,
 * `aria-pressed` toggle indicators, toast notification with undo affordance,
 * and automatic rollback on server error.
 */

import { useState, useId, useRef } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { LiveRegion } from "@/components/common/LiveRegion";
import { useToast } from "@/hooks/use-toast";

export type VoteType = "helpful" | "unhelpful" | null;

export interface ReviewVoteButtonsProps {
  /** Unique identifier for the review being voted on */
  reviewId: string;
  /** Initial count of helpful votes */
  initialHelpfulCount?: number;
  /** Initial count of unhelpful votes */
  initialUnhelpfulCount?: number;
  /** Initial vote state of the current user */
  initialUserVote?: VoteType;
  /** Callback fired when a vote action occurs. Can return a Promise for async operations. */
  onVote?: (
    newVote: VoteType,
    previousVote: VoteType
  ) => Promise<void> | void;
  /** Whether to trigger a feedback toast notification with undo affordance. Default: true */
  showToastOnVote?: boolean;
  /** Whether the vote controls are disabled */
  disabled?: boolean;
  /** Extra Tailwind classes for styling the container */
  className?: string;
}

export function ReviewVoteButtons({
  reviewId,
  initialHelpfulCount = 0,
  initialUnhelpfulCount = 0,
  initialUserVote = null,
  onVote,
  showToastOnVote = true,
  disabled = false,
  className = "",
}: ReviewVoteButtonsProps) {
  const [userVote, setUserVote] = useState<VoteType>(initialUserVote);
  const [helpfulCount, setHelpfulCount] = useState<number>(
    Math.max(0, initialHelpfulCount)
  );
  const [unhelpfulCount, setUnhelpfulCount] = useState<number>(
    Math.max(0, initialUnhelpfulCount)
  );
  const [isPending, setIsPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const groupId = useId();

  // Safely attempt to consume ToastContext without crashing if Provider is absent
  let toastFn: ReturnType<typeof useToast>["toast"] | undefined;
  try {
    const toastContext = useToast();
    toastFn = toastContext.toast;
  } catch {
    toastFn = undefined;
  }

  const handleVote = async (targetVote: "helpful" | "unhelpful") => {
    if (disabled || isPending) return;

    const prevVote = userVote;
    const prevHelpful = helpfulCount;
    const prevUnhelpful = unhelpfulCount;

    let newVote: VoteType = null;
    let newHelpful = prevHelpful;
    let newUnhelpful = prevUnhelpful;
    let actionMessage = "";

    if (targetVote === "helpful") {
      if (prevVote === "helpful") {
        // Toggle off helpful
        newVote = null;
        newHelpful = Math.max(0, prevHelpful - 1);
        actionMessage = "Helpful vote removed.";
      } else if (prevVote === "unhelpful") {
        // Switch from unhelpful to helpful
        newVote = "helpful";
        newHelpful = prevHelpful + 1;
        newUnhelpful = Math.max(0, prevUnhelpful - 1);
        actionMessage = "Switched vote to helpful.";
      } else {
        // New helpful vote
        newVote = "helpful";
        newHelpful = prevHelpful + 1;
        actionMessage = "Marked review as helpful.";
      }
    } else {
      if (prevVote === "unhelpful") {
        // Toggle off unhelpful
        newVote = null;
        newUnhelpful = Math.max(0, prevUnhelpful - 1);
        actionMessage = "Unhelpful vote removed.";
      } else if (prevVote === "helpful") {
        // Switch from helpful to unhelpful
        newVote = "unhelpful";
        newHelpful = Math.max(0, prevHelpful - 1);
        newUnhelpful = prevUnhelpful + 1;
        actionMessage = "Switched vote to unhelpful.";
      } else {
        // New unhelpful vote
        newVote = "unhelpful";
        newUnhelpful = prevUnhelpful + 1;
        actionMessage = "Marked review as unhelpful.";
      }
    }

    // Apply Optimistic State
    setUserVote(newVote);
    setHelpfulCount(newHelpful);
    setUnhelpfulCount(newUnhelpful);
    setAnnouncement(
      `${actionMessage} (${newHelpful} helpful, ${newUnhelpful} unhelpful)`
    );

    // Rollback helper function for Undo & Async Failure
    const rollback = () => {
      setUserVote(prevVote);
      setHelpfulCount(prevHelpful);
      setUnhelpfulCount(prevUnhelpful);
      setAnnouncement("Vote restored to previous state.");
    };

    // Trigger Toast with Undo Affordance
    if (showToastOnVote && toastFn) {
      toastFn({
        variant: "success",
        title: actionMessage,
        description: "Click Undo to revert your vote.",
        duration: 5000,
        onUndo: rollback,
      });
    }

    // Invoke async onVote handler if supplied
    if (onVote) {
      try {
        setIsPending(true);
        await onVote(newVote, prevVote);
      } catch (error) {
        // Server error rollback
        rollback();
        if (toastFn) {
          toastFn({
            variant: "error",
            title: "Failed to record vote",
            description: "Your vote could not be saved. Changes rolled back.",
          });
        }
      } finally {
        setIsPending(false);
      }
    }
  };

  const isHelpfulPressed = userVote === "helpful";
  const isUnhelpfulPressed = userVote === "unhelpful";

  return (
    <div
      role="group"
      aria-label="Review voting controls"
      id={`review-vote-group-${reviewId}-${groupId}`}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {/* Helpful Vote Button */}
      <button
        type="button"
        aria-pressed={isHelpfulPressed}
        aria-label={`${
          isHelpfulPressed ? "Remove helpful vote" : "Mark review as helpful"
        } (${helpfulCount} helpful ${helpfulCount === 1 ? "vote" : "votes"})`}
        disabled={disabled || isPending}
        onClick={() => handleVote("helpful")}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-out focus-ring-cyan disabled:cursor-not-allowed disabled:opacity-50 ${
          isHelpfulPressed
            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            : "border border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/20 hover:bg-slate-800/80 hover:text-slate-200"
        }`}
      >
        <ThumbsUp
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
            isHelpfulPressed ? "scale-110 text-emerald-400" : ""
          }`}
          aria-hidden="true"
        />
        <span>{helpfulCount}</span>
      </button>

      {/* Unhelpful Vote Button */}
      <button
        type="button"
        aria-pressed={isUnhelpfulPressed}
        aria-label={`${
          isUnhelpfulPressed
            ? "Remove unhelpful vote"
            : "Mark review as unhelpful"
        } (${unhelpfulCount} unhelpful ${
          unhelpfulCount === 1 ? "vote" : "votes"
        })`}
        disabled={disabled || isPending}
        onClick={() => handleVote("unhelpful")}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-out focus-ring-cyan disabled:cursor-not-allowed disabled:opacity-50 ${
          isUnhelpfulPressed
            ? "border border-rose-500/40 bg-rose-500/15 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
            : "border border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/20 hover:bg-slate-800/80 hover:text-slate-200"
        }`}
      >
        <ThumbsDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
            isUnhelpfulPressed ? "scale-110 text-rose-400" : ""
          }`}
          aria-hidden="true"
        />
        <span>{unhelpfulCount}</span>
      </button>

      {/* Polite Live Region for Screen Readers */}
      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
}
