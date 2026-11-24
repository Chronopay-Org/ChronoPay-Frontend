/**
 * Unit tests for admin-user-data.ts sort utilities.
 *
 * Coverage targets:
 *  - sortUsers: empty array, single sort asc/desc, multi-column sort,
 *               "none" sorts ignored, numbers, booleans, strings
 *  - toggleSort: exclusive click cycles none→asc→desc→none,
 *                shift-click adds/updates/removes column from stack
 */

import { describe, it, expect } from "vitest";
import {
  filterUsers,
  paginateUsers,
  parseSortsParam,
  serializeSortsParam,
  sortUsers,
  toggleSort,
} from "@/components/dashboard/admin-user-data";
import type { AdminUser, SortSpec } from "@/components/dashboard/admin-user-types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BASE: AdminUser = {
  id: "x",
  name: "Base",
  email: "base@example.com",
  role: "buyer",
  status: "active",
  joinedAt: "2023-01-01",
  lastSeen: "2024-01-01",
  payouts: 0,
  bookings: 0,
  verified: false,
};

function user(overrides: Partial<AdminUser>): AdminUser {
  return { ...BASE, ...overrides };
}

const ALICE = user({ id: "a", name: "Alice",   payouts: 10, bookings: 5, verified: true,  role: "admin",    status: "active" });
const BOB   = user({ id: "b", name: "Bob",     payouts: 30, bookings: 2, verified: false, role: "buyer",    status: "suspended" });
const CAROL = user({ id: "c", name: "Carol",   payouts: 20, bookings: 9, verified: true,  role: "supplier", status: "pending" });
const DAVE  = user({ id: "d", name: "Zach",    payouts: 10, bookings: 9, verified: false, role: "admin",    status: "active" });

const USERS = [ALICE, BOB, CAROL, DAVE];

// ── sortUsers ─────────────────────────────────────────────────────────────────

describe("sortUsers", () => {
  it("returns a copy when no sorts are active", () => {
    const result = sortUsers(USERS, []);
    expect(result).toEqual(USERS);
    expect(result).not.toBe(USERS); // must be a new array
  });

  it("handles an empty user array", () => {
    expect(sortUsers([], [{ key: "name", dir: "asc" }])).toEqual([]);
  });

  it("ignores specs with dir = none", () => {
    const result = sortUsers(USERS, [{ key: "name", dir: "none" }]);
    expect(result).toEqual(USERS);
  });

  it("sorts by string column ascending", () => {
    const result = sortUsers(USERS, [{ key: "name", dir: "asc" }]);
    expect(result.map((u) => u.name)).toEqual(["Alice", "Bob", "Carol", "Zach"]);
  });

  it("sorts by string column descending", () => {
    const result = sortUsers(USERS, [{ key: "name", dir: "desc" }]);
    expect(result.map((u) => u.name)).toEqual(["Zach", "Carol", "Bob", "Alice"]);
  });

  it("sorts by numeric column ascending", () => {
    const result = sortUsers(USERS, [{ key: "payouts", dir: "asc" }]);
    // Alice=10, Dave=10, Carol=20, Bob=30 — stable within equal group
    expect(result.map((u) => u.payouts)).toEqual([10, 10, 20, 30]);
  });

  it("sorts by numeric column descending", () => {
    const result = sortUsers(USERS, [{ key: "payouts", dir: "desc" }]);
    expect(result.map((u) => u.payouts)).toEqual([30, 20, 10, 10]);
  });

  it("sorts by boolean column ascending (false before true)", () => {
    const result = sortUsers(USERS, [{ key: "verified", dir: "asc" }]);
    expect(result.map((u) => u.verified)).toEqual([false, false, true, true]);
  });

  it("sorts by boolean column descending", () => {
    const result = sortUsers(USERS, [{ key: "verified", dir: "desc" }]);
    expect(result.map((u) => u.verified)).toEqual([true, true, false, false]);
  });

  it("applies multi-column sort — primary: payouts asc, secondary: name asc", () => {
    const sorts: SortSpec[] = [
      { key: "payouts", dir: "asc" },
      { key: "name",    dir: "asc" },
    ];
    const result = sortUsers(USERS, sorts);
    // payouts=10 (Alice, Zach sorted by name), then 20 (Carol), then 30 (Bob)
    expect(result.map((u) => u.id)).toEqual(["a", "d", "c", "b"]);
  });

  it("does not mutate the original array", () => {
    const original = [...USERS];
    sortUsers(USERS, [{ key: "name", dir: "desc" }]);
    expect(USERS).toEqual(original);
  });
});

// ── toggleSort ────────────────────────────────────────────────────────────────

describe("toggleSort — exclusive (click without Shift)", () => {
  it("adds asc spec when column not in stack", () => {
    const result = toggleSort([], "name", true);
    expect(result).toEqual([{ key: "name", dir: "asc" }]);
  });

  it("cycles asc → desc on second click", () => {
    const current: SortSpec[] = [{ key: "name", dir: "asc" }];
    const result = toggleSort(current, "name", true);
    expect(result).toEqual([{ key: "name", dir: "desc" }]);
  });

  it("removes column on third click (desc → none)", () => {
    const current: SortSpec[] = [{ key: "name", dir: "desc" }];
    const result = toggleSort(current, "name", true);
    expect(result).toEqual([]);
  });

  it("replaces existing multi-column stack with single column", () => {
    const current: SortSpec[] = [
      { key: "payouts", dir: "asc" },
      { key: "name",    dir: "desc" },
    ];
    const result = toggleSort(current, "bookings", true);
    expect(result).toEqual([{ key: "bookings", dir: "asc" }]);
  });
});

describe("toggleSort — additive (Shift+click)", () => {
  it("appends a new column as asc", () => {
    const current: SortSpec[] = [{ key: "name", dir: "asc" }];
    const result = toggleSort(current, "payouts", false);
    expect(result).toEqual([
      { key: "name",    dir: "asc" },
      { key: "payouts", dir: "asc" },
    ]);
  });

  it("cycles existing column from asc → desc without changing stack order", () => {
    const current: SortSpec[] = [
      { key: "name",    dir: "asc" },
      { key: "payouts", dir: "asc" },
    ];
    const result = toggleSort(current, "payouts", false);
    // payouts should be updated in place (appended without name)
    expect(result).toEqual([
      { key: "name",    dir: "asc" },
      { key: "payouts", dir: "desc" },
    ]);
  });

  it("removes column from stack when cycled past desc", () => {
    const current: SortSpec[] = [
      { key: "name",    dir: "asc" },
      { key: "payouts", dir: "desc" },
    ];
    const result = toggleSort(current, "payouts", false);
    expect(result).toEqual([{ key: "name", dir: "asc" }]);
  });

  it("handles toggling the only column in additive mode", () => {
    const current: SortSpec[] = [{ key: "name", dir: "desc" }];
    const result = toggleSort(current, "name", false);
    expect(result).toEqual([]);
  });
});

// ── filterUsers ───────────────────────────────────────────────────────────────

describe("filterUsers", () => {
  it("returns all users when no filters are provided", () => {
    expect(filterUsers(USERS)).toEqual(USERS);
    expect(filterUsers(USERS, { query: "", role: "all", status: "all" })).toEqual(USERS);
  });

  it("filters by query matching name or email case-insensitively", () => {
    expect(filterUsers(USERS, { query: "alice" }).map((u) => u.id)).toEqual(["a"]);
    expect(filterUsers(USERS, { query: "ZACH" }).map((u) => u.id)).toEqual(["d"]);
  });

  it("filters by role and status", () => {
    expect(filterUsers(USERS, { role: "admin" }).map((u) => u.id)).toEqual(["a", "d"]);
    expect(filterUsers(USERS, { status: "suspended" }).map((u) => u.id)).toEqual(["b"]);
    expect(
      filterUsers(USERS, { role: "admin", status: "active", query: "zach" }).map((u) => u.id),
    ).toEqual(["d"]);
  });
});

// ── paginateUsers ─────────────────────────────────────────────────────────────

describe("paginateUsers", () => {
  it("slices users into pages and reports totalPages", () => {
    const page1 = paginateUsers(USERS, 1, 2);
    expect(page1.items.map((u) => u.id)).toEqual(["a", "b"]);
    expect(page1.page).toBe(1);
    expect(page1.totalPages).toBe(2);
    expect(page1.totalItems).toBe(4);

    const page2 = paginateUsers(USERS, 2, 2);
    expect(page2.items.map((u) => u.id)).toEqual(["c", "d"]);
    expect(page2.page).toBe(2);
  });

  it("clamps out-of-range page numbers safely", () => {
    const tooLow = paginateUsers(USERS, 0, 2);
    expect(tooLow.page).toBe(1);
    expect(tooLow.items.map((u) => u.id)).toEqual(["a", "b"]);

    const tooHigh = paginateUsers(USERS, 99, 2);
    expect(tooHigh.page).toBe(2);
    expect(tooHigh.items.map((u) => u.id)).toEqual(["c", "d"]);
  });

  it("handles an empty list gracefully", () => {
    const empty = paginateUsers([], 1, 10);
    expect(empty.items).toEqual([]);
    expect(empty.page).toBe(1);
    expect(empty.totalPages).toBe(1);
    expect(empty.totalItems).toBe(0);
  });
});

// ── serializeSortsParam / parseSortsParam ─────────────────────────────────────

describe("serializeSortsParam and parseSortsParam", () => {
  it("round-trips multi-column sort specs", () => {
    const specs: SortSpec[] = [
      { key: "name", dir: "asc" },
      { key: "payouts", dir: "desc" },
    ];
    const encoded = serializeSortsParam(specs);
    expect(encoded).toBe("name:asc,payouts:desc");
    expect(parseSortsParam(encoded)).toEqual(specs);
  });

  it("ignores invalid keys, invalid directions, and duplicate columns", () => {
    expect(parseSortsParam(null)).toEqual([]);
    expect(parseSortsParam("")).toEqual([]);
    expect(parseSortsParam("unknown:asc,name:invalid,name:asc,name:desc")).toEqual([
      { key: "name", dir: "asc" },
    ]);
  });
});

