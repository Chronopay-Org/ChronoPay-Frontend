/**
 * Contract tests for the notifications barrel module.
 *
 * `index.ts` re-exports from sibling modules only — it has no logic of its
 * own. The "behavior" worth pinning down here is the public contract: which
 * names are exported, what kind of thing each one is, that each is the exact
 * same reference as its source module (so the barrel never silently forks
 * or wraps it), and that the re-exported mock data conforms to the
 * re-exported type. Component/hook internals are covered by their own
 * dedicated test files (e.g. notification-list.test.tsx).
 */

import { describe, it, expect, vi } from "vitest";

// NotificationList pulls in EmptyStateCard, which pulls in the unrelated
// "@/components/dashboard" barrel. This test only checks the notifications
// barrel's export surface (identity, shape, data), not NotificationList's
// rendering — that's already covered by notification-list.test.tsx — so the
// dependency is stubbed out to keep this file isolated from unrelated code.
vi.mock("@/app/components/empty-state-card", () => ({
  EmptyStateCard: () => null,
}));

import * as barrel from "./index";
import { NotificationList as DirectNotificationList } from "./notification-list";
import { NotificationItem as DirectNotificationItem } from "./notification-item";
import { BulkActionBar as DirectBulkActionBar } from "./bulk-action-bar";
import { useNotificationSelection as directUseNotificationSelection } from "./use-notification-selection";
import { notifications as directNotifications } from "./mock-data";
import type { NotificationItem as NotificationItemType, NotificationTone } from "./types";

describe("notifications barrel: exported surface", () => {
  it("exports exactly the expected named bindings, nothing more or less", () => {
    expect(Object.keys(barrel).sort()).toEqual(
      [
        "NotificationList",
        "NotificationItem",
        "BulkActionBar",
        "useNotificationSelection",
        "notifications",
      ].sort(),
    );
  });

  it("re-exports components/hook/data as the exact same reference as their source module (no wrapping)", () => {
    expect(barrel.NotificationList).toBe(DirectNotificationList);
    expect(barrel.NotificationItem).toBe(DirectNotificationItem);
    expect(barrel.BulkActionBar).toBe(DirectBulkActionBar);
    expect(barrel.useNotificationSelection).toBe(directUseNotificationSelection);
    expect(barrel.notifications).toBe(directNotifications);
  });

  it("exports components and the hook as callable functions", () => {
    for (const fn of [
      barrel.NotificationList,
      barrel.NotificationItem,
      barrel.BulkActionBar,
      barrel.useNotificationSelection,
    ]) {
      expect(typeof fn).toBe("function");
    }
  });

  it("exports notifications as a non-empty array", () => {
    expect(Array.isArray(barrel.notifications)).toBe(true);
    expect(barrel.notifications.length).toBeGreaterThan(0);
  });
});

describe("notifications barrel: re-exported data conforms to the re-exported type", () => {
  const VALID_TONES: NotificationTone[] = ["info", "success", "warning", "error"];

  it("every notification has the required shape and a valid tone", () => {
    for (const n of barrel.notifications) {
      const item: NotificationItemType = n; // type-level check: assignable to the barrel's own type
      expect(typeof item.id).toBe("string");
      expect(item.id.length).toBeGreaterThan(0);
      expect(typeof item.title).toBe("string");
      expect(item.title.length).toBeGreaterThan(0);
      expect(typeof item.timestamp).toBe("string");
      expect(typeof item.read).toBe("boolean");
      expect(VALID_TONES).toContain(item.tone);
      if (item.description !== undefined) {
        expect(typeof item.description).toBe("string");
      }
    }
  });

  it("has unique ids (no duplicate notifications)", () => {
    const ids = barrel.notifications.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes a representative mix of read and unread, and of every tone used", () => {
    const read = barrel.notifications.filter((n) => n.read);
    const unread = barrel.notifications.filter((n) => !n.read);
    expect(read.length).toBeGreaterThan(0);
    expect(unread.length).toBeGreaterThan(0);

    const tonesUsed = new Set(barrel.notifications.map((n) => n.tone));
    expect(tonesUsed.size).toBeGreaterThan(1);
    for (const tone of tonesUsed) {
      expect(VALID_TONES).toContain(tone);
    }
  });

  it("is deterministic: importing the module twice yields the same array reference and content", async () => {
    const reimported = await import("./index");
    expect(reimported.notifications).toBe(barrel.notifications);
    expect(reimported.notifications).toEqual(barrel.notifications);
  });
});
