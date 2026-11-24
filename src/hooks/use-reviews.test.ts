import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReviews, type ReviewsAdapter, type ReviewItem } from "./use-reviews";

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toasts: [],
    toast: mockToast,
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  }),
}));

const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: "r1",
    author: "Priya M.",
    excerpt: "Great session.",
    rating: 5,
    bucket: "positive",
    date: "Jul 22, 2026",
    helpfulCount: 10,
    unhelpfulCount: 1,
    userVote: null,
  },
];

describe("useReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a review optimistically and persists it in the store", async () => {
    const adapter: ReviewsAdapter = {
      addReview: vi.fn().mockResolvedValue(undefined),
    };
    const { result } = renderHook(() =>
      useReviews({ initialReviews: SAMPLE_REVIEWS, adapter, authorName: "Sam" })
    );

    await act(async () => {
      await result.current.addReview({
        ratings: { expertise: 5, communication: 5 },
        comment: "Outstanding work!",
        photos: [],
      });
    });

    expect(result.current.reviews).toHaveLength(2);
    expect(result.current.reviews[0].excerpt).toBe("Outstanding work!");
    expect(result.current.reviews[0].author).toBe("Sam");
    expect(result.current.reviews[0].bucket).toBe("positive");
    expect(adapter.addReview).toHaveBeenCalledTimes(1);
  });

  it("rolls back optimistic review and shows error toast on rejection", async () => {
    const adapter: ReviewsAdapter = {
      addReview: vi.fn().mockRejectedValue(new Error("Network error")),
    };
    const { result } = renderHook(() =>
      useReviews({ initialReviews: SAMPLE_REVIEWS, adapter })
    );

    await expect(
      act(async () => {
        await result.current.addReview({
          ratings: { expertise: 4 },
          comment: "Will fail",
          photos: [],
        });
      })
    ).rejects.toThrow("Network error");

    expect(result.current.reviews).toHaveLength(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error" })
    );
  });

  it("votes optimistically and rolls back with error toast on failure", async () => {
    const adapter: ReviewsAdapter = {
      voteReview: vi.fn().mockRejectedValue(new Error("Vote failed")),
    };
    const { result } = renderHook(() =>
      useReviews({ initialReviews: SAMPLE_REVIEWS, adapter })
    );

    await expect(
      act(async () => {
        await result.current.voteReview("r1", "helpful");
      })
    ).rejects.toThrow("Vote failed");

    expect(result.current.reviews[0].helpfulCount).toBe(10);
    expect(result.current.reviews[0].userVote).toBeNull();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "error",
        title: "Failed to record vote",
      })
    );
  });

  it("prevents duplicate concurrent votes while a vote is in flight", async () => {
    let resolveVote!: () => void;
    const votePromise = new Promise<void>((res) => {
      resolveVote = res;
    });
    const adapter: ReviewsAdapter = {
      voteReview: vi.fn(() => votePromise),
    };
    const { result } = renderHook(() =>
      useReviews({ initialReviews: SAMPLE_REVIEWS, adapter })
    );

    let p1!: Promise<void>;
    let p2!: Promise<void>;
    act(() => {
      p1 = result.current.voteReview("r1", "helpful");
      p2 = result.current.voteReview("r1", "helpful");
    });

    expect(result.current.reviews[0].helpfulCount).toBe(11);
    expect(adapter.voteReview).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveVote();
      await Promise.all([p1, p2]);
    });

    expect(result.current.reviews[0].helpfulCount).toBe(11);
    expect(result.current.reviews[0].userVote).toBe("helpful");
  });

  it("prevents duplicate identical vote after a vote has settled", async () => {
    const adapter: ReviewsAdapter = {
      voteReview: vi.fn().mockResolvedValue(undefined),
    };
    const { result } = renderHook(() =>
      useReviews({ initialReviews: SAMPLE_REVIEWS, adapter })
    );

    await act(async () => {
      await result.current.voteReview("r1", "helpful");
    });
    await act(async () => {
      await result.current.voteReview("r1", "helpful");
    });

    expect(adapter.voteReview).toHaveBeenCalledTimes(1);
    expect(result.current.reviews[0].helpfulCount).toBe(11);
  });

  it("posts a supplier reply optimistically and rolls back on failure", async () => {
    const adapter: ReviewsAdapter = {
      replyToReview: vi.fn().mockRejectedValue(new Error("Reply failed")),
    };
    const { result } = renderHook(() =>
      useReviews({ initialReviews: SAMPLE_REVIEWS, adapter })
    );

    await expect(
      act(async () => {
        await result.current.replyToReview("r1", "Thank you!");
      })
    ).rejects.toThrow("Reply failed");

    expect(result.current.reviews[0].reply).toBeUndefined();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error" })
    );
  });

  it("flags a review and prevents flagging the same review twice", async () => {
    const adapter: ReviewsAdapter = {
      flagReview: vi.fn().mockResolvedValue(undefined),
    };
    const { result } = renderHook(() =>
      useReviews({ initialReviews: SAMPLE_REVIEWS, adapter })
    );

    await act(async () => {
      await result.current.flagReview("r1", "spam", "Looks like spam");
    });

    expect(result.current.reviews[0].isFlagged).toBe(true);
    expect(result.current.reviews[0].flagReason).toBe("spam");

    await act(async () => {
      await result.current.flagReview("r1", "harassment", "Duplicate");
    });

    expect(adapter.flagReview).toHaveBeenCalledTimes(1);
  });

  it("rolls back flag state on adapter rejection", async () => {
    const adapter: ReviewsAdapter = {
      flagReview: vi.fn().mockRejectedValue(new Error("Flag failed")),
    };
    const { result } = renderHook(() =>
      useReviews({ initialReviews: SAMPLE_REVIEWS, adapter })
    );

    await expect(
      act(async () => {
        await result.current.flagReview("r1", "misleading");
      })
    ).rejects.toThrow("Flag failed");

    expect(Boolean(result.current.reviews[0].isFlagged)).toBe(false);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error" })
    );
  });
});
