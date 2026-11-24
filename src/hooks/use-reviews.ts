"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { SentimentBucket } from "@/components/dashboard/types";
import type { VoteType } from "@/components/dashboard/review-vote-buttons";
import type { ReviewSubmissionData } from "@/components/dashboard/review-composer";
import type { ReviewReply } from "@/components/dashboard/review-thread-types";
import type { ReviewModerationReason } from "@/components/dashboard/review-moderation-flag-modal";
import { useToast } from "@/hooks/use-toast";

export interface ReviewItem {
  id: string;
  author: string;
  excerpt: string;
  rating: number;
  bucket: Exclude<SentimentBucket, "all">;
  date: string;
  helpfulCount: number;
  unhelpfulCount: number;
  userVote: VoteType;
  reply?: ReviewReply;
  isFlagged?: boolean;
  flagReason?: ReviewModerationReason;
  flagContext?: string;
}

export interface ReviewsAdapter {
  addReview?: (
    review: ReviewItem,
    submission: ReviewSubmissionData
  ) => Promise<ReviewItem | void>;
  voteReview?: (
    reviewId: string,
    newVote: VoteType,
    previousVote: VoteType
  ) => Promise<void>;
  replyToReview?: (
    reviewId: string,
    reply: ReviewReply
  ) => Promise<ReviewReply | void>;
  flagReview?: (
    reviewId: string,
    reason: ReviewModerationReason,
    context?: string
  ) => Promise<void>;
}

export interface ReviewsState {
  reviews: ReviewItem[];
  pendingVotes: Record<string, boolean>;
  pendingReplies: Record<string, boolean>;
  pendingFlags: Record<string, boolean>;
}

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "r1",
    author: "Priya M.",
    excerpt:
      "Incredibly responsive and delivered exactly what was scoped. Will book again.",
    rating: 5,
    bucket: "positive",
    date: "Jul 22, 2026",
    helpfulCount: 12,
    unhelpfulCount: 1,
    userVote: null,
  },
  {
    id: "r2",
    author: "Tom B.",
    excerpt:
      "Good depth of knowledge but ran a few minutes over the agreed slot.",
    rating: 3,
    bucket: "mixed",
    date: "Jul 20, 2026",
    helpfulCount: 5,
    unhelpfulCount: 2,
    userVote: null,
  },
  {
    id: "r3",
    author: "Anya K.",
    excerpt:
      "Session was rescheduled twice with no notice. Communication needs improvement.",
    rating: 2,
    bucket: "critical",
    date: "Jul 18, 2026",
    helpfulCount: 8,
    unhelpfulCount: 0,
    userVote: null,
  },
  {
    id: "r4",
    author: "Carlos D.",
    excerpt:
      "Walked me through the full Stellar onboarding flow — exactly what I needed.",
    rating: 5,
    bucket: "positive",
    date: "Jul 16, 2026",
    helpfulCount: 20,
    unhelpfulCount: 0,
    userVote: null,
  },
  {
    id: "r5",
    author: "Lee H.",
    excerpt:
      "Solid advice but some recommendations felt generic rather than tailored.",
    rating: 3,
    bucket: "mixed",
    date: "Jul 14, 2026",
    helpfulCount: 3,
    unhelpfulCount: 4,
    userVote: null,
  },
  {
    id: "r6",
    author: "Sara N.",
    excerpt: "Did not address my questions and ended early without explanation.",
    rating: 1,
    bucket: "critical",
    date: "Jul 12, 2026",
    helpfulCount: 7,
    unhelpfulCount: 1,
    userVote: null,
  },
  {
    id: "r7",
    author: "Mei W.",
    excerpt: "Top-tier expertise and a pleasure to work with. Highly recommend.",
    rating: 5,
    bucket: "positive",
    date: "Jul 10, 2026",
    helpfulCount: 15,
    unhelpfulCount: 0,
    userVote: null,
  },
];

export function deriveBucketFromRating(
  rating: number
): Exclude<SentimentBucket, "all"> {
  if (rating >= 4) return "positive";
  if (rating >= 3) return "mixed";
  return "critical";
}

export function computeVoteCounts(
  helpfulCount: number,
  unhelpfulCount: number,
  previousVote: VoteType,
  nextVote: VoteType
): { helpfulCount: number; unhelpfulCount: number } {
  let nextHelpful = helpfulCount;
  let nextUnhelpful = unhelpfulCount;

  if (previousVote === "helpful") {
    nextHelpful = Math.max(0, nextHelpful - 1);
  } else if (previousVote === "unhelpful") {
    nextUnhelpful = Math.max(0, nextUnhelpful - 1);
  }

  if (nextVote === "helpful") {
    nextHelpful += 1;
  } else if (nextVote === "unhelpful") {
    nextUnhelpful += 1;
  }

  return { helpfulCount: nextHelpful, unhelpfulCount: nextUnhelpful };
}

export type ReviewsAction =
  | { type: "ADD_OPTIMISTIC"; review: ReviewItem }
  | { type: "ADD_COMMIT"; tempId: string; review?: ReviewItem }
  | { type: "ADD_ROLLBACK"; tempId: string }
  | {
      type: "VOTE_OPTIMISTIC";
      reviewId: string;
      nextVote: VoteType;
      helpfulCount: number;
      unhelpfulCount: number;
    }
  | { type: "VOTE_COMMIT"; reviewId: string }
  | {
      type: "VOTE_ROLLBACK";
      reviewId: string;
      previousVote: VoteType;
      previousHelpfulCount: number;
      previousUnhelpfulCount: number;
    }
  | { type: "REPLY_OPTIMISTIC"; reviewId: string; reply: ReviewReply }
  | { type: "REPLY_COMMIT"; reviewId: string; reply?: ReviewReply }
  | {
      type: "REPLY_ROLLBACK";
      reviewId: string;
      previousReply?: ReviewReply;
    }
  | {
      type: "FLAG_OPTIMISTIC";
      reviewId: string;
      reason: ReviewModerationReason;
      context?: string;
    }
  | { type: "FLAG_COMMIT"; reviewId: string }
  | {
      type: "FLAG_ROLLBACK";
      reviewId: string;
      previousFlagged: boolean;
      previousReason?: ReviewModerationReason;
      previousContext?: string;
    };

export function reviewsReducer(
  state: ReviewsState,
  action: ReviewsAction
): ReviewsState {
  switch (action.type) {
    case "ADD_OPTIMISTIC":
      return {
        ...state,
        reviews: [action.review, ...state.reviews],
      };

    case "ADD_COMMIT":
      if (!action.review) return state;
      return {
        ...state,
        reviews: state.reviews.map((r) =>
          r.id === action.tempId ? action.review! : r
        ),
      };

    case "ADD_ROLLBACK":
      return {
        ...state,
        reviews: state.reviews.filter((r) => r.id !== action.tempId),
      };

    case "VOTE_OPTIMISTIC":
      return {
        ...state,
        pendingVotes: { ...state.pendingVotes, [action.reviewId]: true },
        reviews: state.reviews.map((r) =>
          r.id === action.reviewId
            ? {
                ...r,
                userVote: action.nextVote,
                helpfulCount: action.helpfulCount,
                unhelpfulCount: action.unhelpfulCount,
              }
            : r
        ),
      };

    case "VOTE_COMMIT": {
      const nextPending = { ...state.pendingVotes };
      delete nextPending[action.reviewId];
      return { ...state, pendingVotes: nextPending };
    }

    case "VOTE_ROLLBACK": {
      const nextPending = { ...state.pendingVotes };
      delete nextPending[action.reviewId];
      return {
        ...state,
        pendingVotes: nextPending,
        reviews: state.reviews.map((r) =>
          r.id === action.reviewId
            ? {
                ...r,
                userVote: action.previousVote,
                helpfulCount: action.previousHelpfulCount,
                unhelpfulCount: action.previousUnhelpfulCount,
              }
            : r
        ),
      };
    }

    case "REPLY_OPTIMISTIC":
      return {
        ...state,
        pendingReplies: { ...state.pendingReplies, [action.reviewId]: true },
        reviews: state.reviews.map((r) =>
          r.id === action.reviewId ? { ...r, reply: action.reply } : r
        ),
      };

    case "REPLY_COMMIT": {
      const nextPending = { ...state.pendingReplies };
      delete nextPending[action.reviewId];
      return {
        ...state,
        pendingReplies: nextPending,
        reviews: action.reply
          ? state.reviews.map((r) =>
              r.id === action.reviewId ? { ...r, reply: action.reply } : r
            )
          : state.reviews,
      };
    }

    case "REPLY_ROLLBACK": {
      const nextPending = { ...state.pendingReplies };
      delete nextPending[action.reviewId];
      return {
        ...state,
        pendingReplies: nextPending,
        reviews: state.reviews.map((r) =>
          r.id === action.reviewId ? { ...r, reply: action.previousReply } : r
        ),
      };
    }

    case "FLAG_OPTIMISTIC":
      return {
        ...state,
        pendingFlags: { ...state.pendingFlags, [action.reviewId]: true },
        reviews: state.reviews.map((r) =>
          r.id === action.reviewId
            ? {
                ...r,
                isFlagged: true,
                flagReason: action.reason,
                flagContext: action.context,
              }
            : r
        ),
      };

    case "FLAG_COMMIT": {
      const nextPending = { ...state.pendingFlags };
      delete nextPending[action.reviewId];
      return { ...state, pendingFlags: nextPending };
    }

    case "FLAG_ROLLBACK": {
      const nextPending = { ...state.pendingFlags };
      delete nextPending[action.reviewId];
      return {
        ...state,
        pendingFlags: nextPending,
        reviews: state.reviews.map((r) =>
          r.id === action.reviewId
            ? {
                ...r,
                isFlagged: action.previousFlagged,
                flagReason: action.previousReason,
                flagContext: action.previousContext,
              }
            : r
        ),
      };
    }

    default:
      return state;
  }
}

export interface UseReviewsOptions {
  initialReviews?: ReviewItem[];
  adapter?: ReviewsAdapter;
  authorName?: string;
  supplierName?: string;
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function useReviews(options: UseReviewsOptions = {}) {
  const {
    initialReviews = INITIAL_REVIEWS,
    adapter,
    authorName = "You",
    supplierName = "Alex Rivera",
  } = options;

  const [state, dispatch] = useReducer(reviewsReducer, {
    reviews: initialReviews,
    pendingVotes: {},
    pendingReplies: {},
    pendingFlags: {},
  });

  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Safely consume ToastContext without crashing if Provider is absent
  let toastFn: ReturnType<typeof useToast>["toast"] | undefined;
  try {
    toastFn = useToast().toast;
  } catch {
    toastFn = undefined;
  }

  const stateRef = useRef(state);
  stateRef.current = state;

  const pendingVotesRef = useRef<Record<string, boolean>>({});
  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;

  const addReview = useCallback(
    async (submission: ReviewSubmissionData): Promise<ReviewItem | null> => {
      const ratingValues = Object.values(submission.ratings);
      const averageRating =
        ratingValues.length > 0
          ? Math.round(
              ratingValues.reduce((sum, val) => sum + val, 0) /
                ratingValues.length
            )
          : 5;

      const tempId = `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticReview: ReviewItem = {
        id: tempId,
        author: authorName,
        excerpt: submission.comment.trim(),
        rating: averageRating,
        bucket: deriveBucketFromRating(averageRating),
        date: formatToday(),
        helpfulCount: 0,
        unhelpfulCount: 0,
        userVote: null,
      };

      dispatch({ type: "ADD_OPTIMISTIC", review: optimisticReview });

      try {
        const persisted = await adapterRef.current?.addReview?.(
          optimisticReview,
          submission
        );
        dispatch({
          type: "ADD_COMMIT",
          tempId,
          review: persisted ?? undefined,
        });
        toastFn?.({
          variant: "success",
          title: "Review submitted",
          description: "Your review is now live.",
        });
        return persisted ?? optimisticReview;
      } catch (err) {
        dispatch({ type: "ADD_ROLLBACK", tempId });
        toastFn?.({
          variant: "error",
          title: "Failed to submit review",
          description: "Your review could not be saved. Please try again.",
        });
        throw err;
      }
    },
    [authorName, toastFn]
  );

  const voteReview = useCallback(
    async (reviewId: string, nextVote: VoteType): Promise<void> => {
      // Prevent concurrent / duplicate votes while a vote is in flight
      if (pendingVotesRef.current[reviewId]) {
        return;
      }

      const target = stateRef.current.reviews.find((r) => r.id === reviewId);
      if (!target) return;

      // Prevent duplicate identical vote
      if (target.userVote === nextVote) {
        return;
      }

      const previousVote = target.userVote;
      const previousHelpfulCount = target.helpfulCount;
      const previousUnhelpfulCount = target.unhelpfulCount;

      const { helpfulCount, unhelpfulCount } = computeVoteCounts(
        previousHelpfulCount,
        previousUnhelpfulCount,
        previousVote,
        nextVote
      );

      pendingVotesRef.current[reviewId] = true;
      dispatch({
        type: "VOTE_OPTIMISTIC",
        reviewId,
        nextVote,
        helpfulCount,
        unhelpfulCount,
      });

      try {
        await adapterRef.current?.voteReview?.(reviewId, nextVote, previousVote);
        dispatch({ type: "VOTE_COMMIT", reviewId });
      } catch (err) {
        dispatch({
          type: "VOTE_ROLLBACK",
          reviewId,
          previousVote,
          previousHelpfulCount,
          previousUnhelpfulCount,
        });
        toastFn?.({
          variant: "error",
          title: "Failed to record vote",
          description: "Your vote could not be saved. Changes rolled back.",
        });
        throw err;
      } finally {
        delete pendingVotesRef.current[reviewId];
      }
    },
    [toastFn]
  );

  const replyToReview = useCallback(
    async (reviewId: string, body: string): Promise<void> => {
      const trimmed = body.trim();
      if (!trimmed) return;

      const target = stateRef.current.reviews.find((r) => r.id === reviewId);
      if (!target) return;
      if (target.reply && !target.reply.deleted) return;

      const previousReply = target.reply;
      const optimisticReply: ReviewReply = {
        id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        authorName: supplierName,
        body: trimmed,
        timestamp: formatToday(),
      };

      dispatch({
        type: "REPLY_OPTIMISTIC",
        reviewId,
        reply: optimisticReply,
      });

      try {
        const persisted = await adapterRef.current?.replyToReview?.(
          reviewId,
          optimisticReply
        );
        dispatch({
          type: "REPLY_COMMIT",
          reviewId,
          reply: persisted ?? undefined,
        });
      } catch (err) {
        dispatch({
          type: "REPLY_ROLLBACK",
          reviewId,
          previousReply,
        });
        toastFn?.({
          variant: "error",
          title: "Failed to post reply",
          description: "Your reply could not be saved. Changes rolled back.",
        });
        throw err;
      }
    },
    [supplierName, toastFn]
  );

  const flagReview = useCallback(
    async (
      reviewId: string,
      reason: ReviewModerationReason,
      context?: string
    ): Promise<void> => {
      const target = stateRef.current.reviews.find((r) => r.id === reviewId);
      if (!target || target.isFlagged) return;

      const previousFlagged = Boolean(target.isFlagged);
      const previousReason = target.flagReason;
      const previousContext = target.flagContext;

      dispatch({
        type: "FLAG_OPTIMISTIC",
        reviewId,
        reason,
        context,
      });

      try {
        await adapterRef.current?.flagReview?.(reviewId, reason, context);
        dispatch({ type: "FLAG_COMMIT", reviewId });
      } catch (err) {
        dispatch({
          type: "FLAG_ROLLBACK",
          reviewId,
          previousFlagged,
          previousReason,
          previousContext,
        });
        toastFn?.({
          variant: "error",
          title: "Failed to flag review",
          description: "Your report could not be saved. Changes rolled back.",
        });
        throw err;
      }
    },
    [toastFn]
  );

  return {
    reviews: state.reviews,
    pendingVotes: state.pendingVotes,
    pendingReplies: state.pendingReplies,
    pendingFlags: state.pendingFlags,
    isOffline,
    addReview,
    voteReview,
    replyToReview,
    flagReview,
  };
}
