"use client";

/**
 * ReviewsPanel
 *
 * Wraps PanelShell with the SentimentChipFilter injected into the `action`
 * slot, and renders a filtered list of review stubs below.
 *
 * This component is the primary integration point for the sentiment chip
 * filter feature — it demonstrates how to wire counts, trend data, and the
 * onChange callback together.
 */

import { useState, Suspense } from "react";
import { PanelShell } from "./panel-shell";
import { SentimentChipFilter } from "./sentiment-chip-filter";
import { reviewSentimentCounts, reviewSentimentTrend } from "./dashboard-data";
import type { SentimentBucket } from "./types";

// ─── Sample review stubs ──────────────────────────────────────────────────────

interface ReviewStub {
  id: string;
  author: string;
  excerpt: string;
  bucket: Exclude<SentimentBucket, "all">;
  date: string;
}

const REVIEW_STUBS: ReviewStub[] = [
  {
    id: "r1",
    author: "Priya M.",
    excerpt: "Incredibly responsive and delivered exactly what was scoped. Will book again.",
    bucket: "positive",
    date: "Jul 22, 2026",
  },
  {
    id: "r2",
    author: "Tom B.",
    excerpt: "Good depth of knowledge but ran a few minutes over the agreed slot.",
    bucket: "mixed",
    date: "Jul 20, 2026",
  },
  {
    id: "r3",
    author: "Anya K.",
    excerpt: "Session was rescheduled twice with no notice. Communication needs improvement.",
    bucket: "critical",
    date: "Jul 18, 2026",
  },
  {
    id: "r4",
    author: "Carlos D.",
    excerpt: "Walked me through the full Stellar onboarding flow — exactly what I needed.",
    bucket: "positive",
    date: "Jul 16, 2026",
  },
  {
    id: "r5",
    author: "Lee H.",
    excerpt: "Solid advice but some recommendations felt generic rather than tailored.",
    bucket: "mixed",
    date: "Jul 14, 2026",
  },
  {
    id: "r6",
    author: "Sara N.",
    excerpt: "Did not address my questions and ended early without explanation.",
    bucket: "critical",
    date: "Jul 12, 2026",
  },
  {
    id: "r7",
    author: "Mei W.",
    excerpt: "Top-tier expertise and a pleasure to work with. Highly recommend.",
    bucket: "positive",
    date: "Jul 10, 2026",
  },
];

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

export function ReviewsPanel({ className = "" }: { className?: string }) {
  const [activeBucket, setActiveBucket] = useState<SentimentBucket>("all");

  const filtered =
    activeBucket === "all"
      ? REVIEW_STUBS
      : REVIEW_STUBS.filter((r) => r.bucket === activeBucket);

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
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${bucketDotClass[review.bucket]}`}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-white">
                  {review.author}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  {review.date}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-300 pl-4">
                {review.excerpt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
