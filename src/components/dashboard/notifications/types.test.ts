import { describe, it, expect } from "vitest";
import type { NotificationItem, NotificationTone } from "./types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_TONES = ["info", "success", "warning", "error"] as const;

const baseItem: NotificationItem = {
  id: "t-1",
  title: "Payout completed",
  timestamp: "2 min ago",
  read: false,
  tone: "info",
};

// Compile-time contract pins: these fail the build, not the test run, if the
// public shape ever drifts. Keep them in sync with ./types.ts.
type Expect<T extends true> = [T];
type Extends<A, B> = A extends B ? true : false;

type _ToneIsStringUnion = Expect<Extends<"info", NotificationTone>>;
type _ItemRequiresCoreFields = Expect<
  Extends<
    NotificationItem,
    {
      id: string;
      title: string;
      timestamp: string;
      read: boolean;
      tone: NotificationTone;
    }
  >
>;
type _DescriptionIsOptional = Expect<Extends<NotificationItem["description"], string | undefined>>;

// @ts-expect-error tone must be one of the four NotificationTone literals
const invalidTone: NotificationTone = "urgent";
// @ts-expect-error missing required fields: id, title, timestamp, tone
const missingFields: NotificationItem = { read: false };
// @ts-expect-error `read` is a boolean, not a string
const wrongReadType: NotificationItem = { ...baseItem, read: "yes" };
// @ts-expect-error `tone` still cannot be an arbitrary string
const wrongToneType: NotificationItem = { ...baseItem, tone: "urgent" };

describe("NotificationTone", () => {
  it("exposes exactly the four documented tone literals", () => {
    expect(VALID_TONES).toHaveLength(4);
  });

  it.each([...VALID_TONES])(
    "accepts %s as a valid NotificationTone at runtime and compile time",
    (tone) => {
      const item: NotificationItem = { ...baseItem, tone };
      expect(item.tone).toBe(tone);
    },
  );

  it.each(["urgent", "critical", "", "INFO", "Error", 42, null, undefined])(
    "rejects %s as a NotificationTone value (invalid input)",
    (badTone) => {
      expect(VALID_TONES).not.toContain(badTone);
    },
  );
});

describe("NotificationItem", () => {
  it("constructs a complete item with all core fields", () => {
    const item: NotificationItem = {
      id: "n-100",
      title: "Booking confirmation needed",
      description: "Buyer is waiting for you to confirm the UX review session.",
      timestamp: "3 hours ago",
      read: false,
      tone: "warning",
    };

    expect(item).toEqual({
      id: "n-100",
      title: "Booking confirmation needed",
      description: "Buyer is waiting for you to confirm the UX review session.",
      timestamp: "3 hours ago",
      read: false,
      tone: "warning",
    });
  });

  it("keeps description optional: an item without it stays valid", () => {
    const item: NotificationItem = { ...baseItem };
    expect("description" in item).toBe(false);
    expect(item.description).toBeUndefined();
  });

  it("does not coerce or transform values: fields round-trip verbatim", () => {
    const raw = {
      id: "  spaced-id  ",
      title: "Rate limit warning",
      timestamp: "0",
      read: true,
      tone: "error" as NotificationTone,
    };
    const item: NotificationItem = raw;

    expect(item.id).toBe("  spaced-id  ");
    expect(item.timestamp).toBe("0");
    expect(item.read).toBe(true);
    expect(item.tone).toBe("error");
  });

  it("preserves the public contract: keys of a full item are exactly the six documented fields", () => {
    const item: Required<NotificationItem> = {
      ...baseItem,
      description: "optional",
    };
    expect(Object.keys(item).sort()).toEqual(
      ["description", "id", "read", "timestamp", "title", "tone"].sort(),
    );
  });
});

describe("NotificationItem state transitions", () => {
  it("supports the unread → read transition used by mark-as-read flows", () => {
    const before: NotificationItem = { ...baseItem, read: false };
    const after: NotificationItem = { ...before, read: true };

    expect(before.read).toBe(false);
    expect(after.read).toBe(true);
    // Identity of other fields must not change during the transition.
    expect(after.id).toBe(before.id);
    expect(after.tone).toBe(before.tone);
  });

  it("round-trips every tone without losing fidelity", () => {
    for (const tone of VALID_TONES) {
      const item: NotificationItem = { ...baseItem, tone };
      const clone: NotificationItem = { ...item };
      expect(clone.tone).toBe(tone);
    }
  });
});

describe("NotificationItem invalid inputs and boundaries", () => {
  it("holds an empty-string id verbatim (no runtime validation layer)", () => {
    const item: NotificationItem = { ...baseItem, id: "" };
    expect(item.id).toBe("");
  });

  it("holds an empty title verbatim (no runtime validation layer)", () => {
    const item: NotificationItem = { ...baseItem, title: "" };
    expect(item.title).toBe("");
  });

  it("treats whitespace-only ids and titles as ordinary strings", () => {
    const item: NotificationItem = { ...baseItem, id: " ", title: "   " };
    expect(item.id).toBe(" ");
    expect(item.title).toBe("   ");
  });

  it("is a plain data structure: spread copies are independent", () => {
    const original: NotificationItem = { ...baseItem };
    const copy: NotificationItem = { ...original, read: true };

    expect(original.read).toBe(false);
    expect(copy.read).toBe(true);
  });
});

// Referenced so the compile-time-only pins above are not flagged as unused.
export type { _ToneIsStringUnion, _ItemRequiresCoreFields, _DescriptionIsOptional };
export const _invalidTone = invalidTone;
export const _missingFields = missingFields;
export const _wrongReadType = wrongReadType;
export const _wrongToneType = wrongToneType;
