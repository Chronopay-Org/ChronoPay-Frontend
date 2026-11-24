/**
 * Unit tests for review-thread-types.ts.
 *
 * ReviewReply and Review are pure type aliases with no runtime logic, so
 * "behavior" here is the data contract itself:
 *  - Valid fixtures for every state the single-level thread supports: no
 *    reply yet, a live reply, and a deleted reply (whose id/timestamp/author
 *    survive deletion per the file's own design note, so a placeholder can
 *    be rendered without losing the thread's shape).
 *  - Representative invalid shapes are rejected at compile time via
 *    `@ts-expect-error`: missing required fields and wrong field types for
 *    both ReviewReply and Review.
 *  - `reply` stays a single optional object, never an array — enforcing the
 *    single-level-threading constraint (#262) at the type level.
 */

import { describe, it, expect } from "vitest";
import type { Review, ReviewReply } from "./review-thread-types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const LIVE_REPLY: ReviewReply = {
  id: "reply-1",
  authorName: "Amaka O.",
  body: "Thanks so much for the kind words!",
  timestamp: "2026-06-30 09:15 AM",
};

const DELETED_REPLY: ReviewReply = {
  id: "reply-2",
  authorName: "Kwame T.",
  body: "",
  timestamp: "2026-06-29 04:02 PM",
  deleted: true,
};

const BASE_REVIEW: Review = {
  id: "review-1",
  authorName: "Priya S.",
  rating: 4,
  body: "Great session, very punctual.",
  timestamp: "2026-06-30 08:00 AM",
};

// ── ReviewReply ──────────────────────────────────────────────────────────────

describe("ReviewReply", () => {
  it("accepts a live reply with deleted omitted", () => {
    const reply: ReviewReply = LIVE_REPLY;
    expect(reply.deleted).toBeUndefined();
    expect(reply.body.length).toBeGreaterThan(0);
  });

  it("accepts a deleted reply that still carries id/timestamp/author", () => {
    const reply: ReviewReply = DELETED_REPLY;
    expect(reply.deleted).toBe(true);
    expect(reply.id).toBe("reply-2");
    expect(reply.authorName).toBe("Kwame T.");
    expect(reply.timestamp).toBe("2026-06-29 04:02 PM");
  });

  it("rejects a reply missing a required field", () => {
    // @ts-expect-error — `body` is required
    const invalid: ReviewReply = {
      id: "reply-3",
      authorName: "Missing Body",
      timestamp: "2026-06-30 09:15 AM",
    };
    expect(invalid).toBeDefined();
  });

  it("rejects a reply with the wrong field type", () => {
    // @ts-expect-error — `deleted` must be a boolean, not a string
    const invalid: ReviewReply = {
      id: "reply-4",
      authorName: "Wrong Type",
      body: "text",
      timestamp: "2026-06-30 09:15 AM",
      deleted: "yes",
    };
    expect(invalid).toBeDefined();
  });
});

// ── Review ───────────────────────────────────────────────────────────────────

describe("Review", () => {
  it("accepts a review with no reply yet (initial state)", () => {
    const review: Review = BASE_REVIEW;
    expect(review.reply).toBeUndefined();
  });

  it("accepts a review whose reply is live (not deleted)", () => {
    const review: Review = { ...BASE_REVIEW, reply: LIVE_REPLY };
    expect(review.reply).toBeDefined();
    expect(review.reply?.deleted).toBeUndefined();
  });

  it("accepts a review whose reply has transitioned to deleted", () => {
    const review: Review = { ...BASE_REVIEW, reply: DELETED_REPLY };
    expect(review.reply?.deleted).toBe(true);
  });

  it("rejects an array of replies — the field is a single reply, not a thread", () => {
    // @ts-expect-error — `reply` must be a single ReviewReply, not an array;
    // enforces the single-level-thread design constraint (#262).
    const invalid: Review = { ...BASE_REVIEW, reply: [LIVE_REPLY] };
    expect(invalid).toBeDefined();
  });

  it("rejects a rating of the wrong type", () => {
    // @ts-expect-error — `rating` must be a number
    const invalid: Review = { ...BASE_REVIEW, rating: "4" };
    expect(invalid).toBeDefined();
  });

  it("rejects a review missing a required field", () => {
    // @ts-expect-error — `body` is required
    const invalid: Review = {
      id: "review-2",
      authorName: "Missing Body",
      rating: 3,
      timestamp: "2026-06-30 08:00 AM",
    };
    expect(invalid).toBeDefined();
  });
});
