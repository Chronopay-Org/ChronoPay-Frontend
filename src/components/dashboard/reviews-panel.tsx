"use client";

/**
 * ReviewsPanel
 *
 * Wraps PanelShell with the SentimentChipFilter injected into the `action`
 * slot, and renders a filtered list of reviews below.
 *
 * Connects to the shared `useReviews` store (either via props from a parent
 * page such as the supplier profile, or via an internal default instance when
 * rendered standalone) for optimistic voting, supplier replies, and moderation
 * flagging.
 */

import { useState, Suspense } from "react";
import { Flag } from "lucide-react";
import { PanelShell } from "./panel-shell";
import { SentimentChipFilter } from "./sentiment-chip-filter";
import { ReviewVoteButtons } from "./review-vote-buttons";
import type { VoteType } from "./review-vote-buttons";
import { ReviewReplyThread } from "./review-reply-thread";
import {
  ReviewModerationFlagModal,
  type ReviewModerationReason,
} from "./review-moderation-flag-modal";
import { reviewSentimentCounts, reviewSentimentTrend } from "./dashboard-data";
import type { SentimentBucket } from "./types";
import { useReviews, type ReviewItem } from "@/hooks/use-reviews";

// ─── Bucket colour helpers ────────────────────────────────────────────────────

const bucketBorderClass: Record<Exclude<SentimentBucket, "all">, string> = {
  positive: "border-emerald-400/20",
  mixed: "border-amber-400/20",
  critical: "border-rose-400/20",
};

const bucketDotClass: Record<Exclude<SentimentBucket, "all">, string> = {
  positive: "bg-emerald-400",
  mixed: "bg-amber-400",
  critical: "bg-rose-400",
};

const bucketLabel: Record<Exclude<SentimentBucket, "all">, string> = {
  positive: "Positive",
  mixed: "Mixed",
  critical: "Critical",
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface ReviewsPanelProps {
  className?: string;
  reviews?: ReviewItem[];
  pendingVotes?: Record<string, boolean>;
  isOffline?: boolean;
  canReply?: boolean;
  onVote?: (reviewId: string, nextVote: VoteType) => Promise<void> | void;
  onReply?: (reviewId: string, body: string) => Promise<void> | void;
  onFlag?: (
    reviewId: string,
    reason: ReviewModerationReason,
    context?: string
  ) => Promise<void> | void;
}

export function ReviewsPanel({
  className = "",
  reviews: controlledReviews,
  pendingVotes: controlledPendingVotes,
  isOffline: controlledIsOffline,
  canReply = false,
  onVote: controlledOnVote,
  onReply: controlledOnReply,
  onFlag: controlledOnFlag,
}: ReviewsPanelProps) {
  const internalStore = useReviews();
  const reviews = controlledReviews ?? internalStore.reviews;
  const pendingVotes = controlledPendingVotes ?? internalStore.pendingVotes;
  const isOffline = controlledIsOffline ?? internalStore.isOffline;
  const handleVote = controlledOnVote ?? internalStore.voteReview;
  const handleReply = controlledOnReply ?? internalStore.replyToReview;
  const handleFlag = controlledOnFlag ?? internalStore.flagReview;

  const [activeBucket, setActiveBucket] = useState<SentimentBucket>("all");
  const [flaggingReviewId, setFlaggingReviewId] = useState<string | null>(null);

  const filtered =
    activeBucket === "all"
      ? reviews
      : reviews.filter((r) => r.bucket === activeBucket);

  const activeFlagReview = flaggingReviewId
    ? reviews.find((r) => r.id === flaggingReviewId) ?? null
    : null;

  return (
    <PanelShell
      id="reviews"
      eyebrow="Buyer feedback"
      title="Reviews"
      description="Filter by sentiment to triage feedback or celebrate wins."
      action={
        // Wrap in Suspense — SentimentChipFilter calls useSearchParams which
        // requires a Suspense boundary in the Next.js App Router.
        <Suspense fallback={null}>
          <SentimentChipFilter
            counts={reviewSentimentCounts}
            trendData={reviewSentimentTrend}
            onChange={setActiveBucket}
            className={className}
          />
        </Suspense>
      }
    >
      {filtered.length === 0 ? (
        <p
          className="py-8 text-center text-sm text-slate-400"
          data-testid="reviews-empty"
        >
          No reviews match this filter yet.
        </p>
      ) : (
        <ul
          className="divide-y divide-white/5"
          aria-label={`${activeBucket === "all" ? "All" : bucketLabel[activeBucket as Exclude<SentimentBucket, "all">]} reviews`}
        >
          {filtered.map((review) => (
            <li
              key={review.id}
              className={`flex flex-col gap-1 py-4 first:pt-0 last:pb-0 border-l-2 pl-3 ${bucketBorderClass[review.bucket]}`}
            >
              {canReply || review.reply ? (
                <div className="pl-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${bucketDotClass[review.bucket]}`}
                      aria-hidden="true"
                    />
                    {review.isFlagged && (
                      <span
                        data-testid="review-flagged-badge"
                        className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300"
                      >
                        <Flag className="h-3 w-3" aria-hidden="true" />
                        Flagged
                      </span>
                    )}
                  </div>
                  <ReviewReplyThread
                    review={{
                      id: review.id,
                      authorName: review.author,
                      rating: review.rating,
                      body: review.excerpt,
                      timestamp: review.date,
                      reply: review.reply,
                    }}
                    canReply={canReply}
                    onSubmitReply={(body) => {
                      void handleReply(review.id, body);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${bucketDotClass[review.bucket]}`}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-white">
                      {review.author}
                    </span>
                    {review.isFlagged && (
                      <span
                        data-testid="review-flagged-badge"
                        className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300"
                      >
                        <Flag className="h-3 w-3" aria-hidden="true" />
                        Flagged
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-500">
                      {review.date}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300 pl-4">
                    {review.excerpt}
                  </p>
                </>
              )}

              {/* Helpful / Unhelpful voting & moderation flag */}
              <div className="flex flex-wrap items-center gap-1.5 pl-4 pt-1">
                <span className="text-xs text-slate-500 me-1">
                  Was this helpful?
                </span>
                <ReviewVoteButtons
                  reviewId={review.id}
                  initialHelpfulCount={review.helpfulCount}
                  initialUnhelpfulCount={review.unhelpfulCount}
                  initialUserVote={review.userVote}
                  disabled={Boolean(pendingVotes[review.id])}
                  onVote={(newVote) => handleVote(review.id, newVote)}
                />
                <button
                  type="button"
                  onClick={() => setFlaggingReviewId(review.id)}
                  disabled={Boolean(review.isFlagged)}
                  aria-label={
                    review.isFlagged
                      ? `Review by ${review.author} already flagged`
                      : `Flag review by ${review.author}`
                  }
                  className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-amber-400/30 hover:text-amber-200 focus-ring-cyan disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Flag className="h-3 w-3" aria-hidden="true" />
                  {review.isFlagged ? "Flagged" : "Flag"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReviewModerationFlagModal
        isOpen={Boolean(activeFlagReview)}
        onClose={() => setFlaggingReviewId(null)}
        reviewId={activeFlagReview?.id}
        isAlreadyFlagged={Boolean(activeFlagReview?.isFlagged)}
        isOffline={isOffline}
        onSubmit={(reason, context) => {
          if (activeFlagReview) {
            return handleFlag(activeFlagReview.id, reason, context);
          }
        }}
      />
    </PanelShell>
  );
}
