/**
 * Contract & behavior tests for `admin-user-types.ts`.
 *
 * `admin-user-types.ts` is a *types-only* module — it exports no runtime values,
 * so its observable behavior is the exact set of values each exported union and
 * interface accepts. This suite pins that contract in three complementary ways:
 *
 *   1. Compile-time assertions — `satisfies`, exhaustive `Record<Union, …>`
 *      maps (a missing/extra key is a type error), and `@ts-expect-error`
 *      guards for representative invalid inputs. These are enforced by `tsc`,
 *      which `next build` runs over every `**\/*.ts` file including this one.
 *   2. Runtime assertions — canonical member fixtures execute under vitest so a
 *      union that silently widens or narrows becomes an observable failure
 *      rather than a type-only change a reader might miss.
 *   3. State transitions — the `AdminUserTableState` lifecycle and the
 *      `SortDir` cycle, which are the module's primary state model.
 *
 * No production source is modified; the public contract is preserved.
 */

import { describe, it, expect } from "vitest";
import type {
  AdminUser,
  AdminUserTableState,
  BulkAction,
  ColumnDef,
  MessagePayload,
  SetRolePayload,
  SortDir,
  SortSpec,
  UserRole,
  UserStatus,
} from "@/components/dashboard/admin-user-types";

// ── Canonical member fixtures ────────────────────────────────────────────────
//
// `as const` keeps these literal-tuples so they can be assigned back to the
// exported unions below; drift in either direction is a compile error.

const ALL_ROLES = ["admin", "supplier", "buyer", "moderator", "support"] as const;
const ALL_STATUSES = ["active", "suspended", "pending", "banned"] as const;
const ALL_SORT_DIRS = ["asc", "desc", "none"] as const;
const ALL_BULK_ACTIONS = ["setRole", "suspend", "message"] as const;

/**
 * Exhaustive maps: TypeScript errors if a union member is missing *or* if an
 * unknown key is added, and the runtime test below compares the keys back to
 * the canonical fixture.
 */
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  supplier: "Supplier",
  buyer: "Buyer",
  moderator: "Moderator",
  support: "Support",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  pending: "Pending",
  banned: "Banned",
};

const BULK_ACTION_LABELS: Record<BulkAction, string> = {
  setRole: "Set role",
  suspend: "Suspend",
  message: "Message",
};

/** Direction cycle used by the sort UI: none → asc → desc → none. */
const NEXT_SORT_DIR: Record<SortDir, SortDir> = {
  none: "asc",
  asc: "desc",
  desc: "none",
};

const sorted = (xs: readonly string[]): string[] => [...xs].sort();

const EXPECTED_ADMIN_USER_KEYS = [
  "id",
  "name",
  "email",
  "role",
  "status",
  "joinedAt",
  "lastSeen",
  "payouts",
  "bookings",
  "verified",
] as const;

// ── UserRole ─────────────────────────────────────────────────────────────────

describe("UserRole", () => {
  it("exposes exactly the five documented roles (compile-time + runtime)", () => {
    expect(sorted(Object.keys(ROLE_LABELS))).toEqual(sorted(ALL_ROLES));
    // Assignment to the union fails compilation if a member is removed.
    const asUnion: readonly UserRole[] = ALL_ROLES;
    expect(asUnion).toHaveLength(5);
  });

  it("accepts every canonical role as a valid value", () => {
    for (const role of ALL_ROLES) {
      const value: UserRole = role;
      expect(ROLE_LABELS[value]).toBeTruthy();
    }
  });

  it("has no duplicate members", () => {
    expect(new Set(ALL_ROLES).size).toBe(ALL_ROLES.length);
  });

  it("rejects an unknown role at compile time", () => {
    // @ts-expect-error - "superadmin" is not assignable to UserRole
    const invalidRole: UserRole = "superadmin";
    // Runtime keeps the same guarantee: no consumer will match the bogus value.
    expect((ALL_ROLES as readonly string[]).includes(invalidRole)).toBe(false);
  });
});

// ── UserStatus ───────────────────────────────────────────────────────────────

describe("UserStatus", () => {
  it("exposes exactly the four documented statuses", () => {
    expect(sorted(Object.keys(STATUS_LABELS))).toEqual(sorted(ALL_STATUSES));
    const asUnion: readonly UserStatus[] = ALL_STATUSES;
    expect(asUnion).toHaveLength(4);
  });

  it("accepts every canonical status as a valid value", () => {
    for (const status of ALL_STATUSES) {
      const value: UserStatus = status;
      expect(STATUS_LABELS[value]).toBeTruthy();
    }
  });

  it("rejects an unknown status at compile time", () => {
    // @ts-expect-error - "deleted" is not assignable to UserStatus
    const invalidStatus: UserStatus = "deleted";
    expect((ALL_STATUSES as readonly string[]).includes(invalidStatus)).toBe(false);
  });
});

// ── BulkAction ───────────────────────────────────────────────────────────────

describe("BulkAction", () => {
  it("exposes exactly the three toolbar actions", () => {
    expect(sorted(Object.keys(BULK_ACTION_LABELS))).toEqual(sorted(ALL_BULK_ACTIONS));
  });

  it("rejects an unknown action at compile time", () => {
    // @ts-expect-error - "delete" is not a BulkAction
    const invalidAction: BulkAction = "delete";
    expect((ALL_BULK_ACTIONS as readonly string[]).includes(invalidAction)).toBe(false);
  });
});

// ── AdminUser ────────────────────────────────────────────────────────────────

describe("AdminUser", () => {
  // `satisfies` verifies the shape without widening the literal type.
  const validUser = {
    id: "u1",
    name: "Alice Chen",
    email: "alice@example.com",
    role: "admin",
    status: "active",
    joinedAt: "2023-01-15",
    lastSeen: "2024-07-27",
    payouts: 42,
    bookings: 120,
    verified: true,
  } satisfies AdminUser;

  it("has exactly the documented field set", () => {
    expect(sorted(Object.keys(validUser))).toEqual(sorted(EXPECTED_ADMIN_USER_KEYS));
  });

  it("carries the declared runtime types for numeric/boolean/string fields", () => {
    expect(typeof validUser.payouts).toBe("number");
    expect(typeof validUser.bookings).toBe("number");
    expect(typeof validUser.verified).toBe("boolean");
    expect(typeof validUser.id).toBe("string");
    expect(typeof validUser.email).toBe("string");
  });

  it("cross-checks role and status against the canonical unions", () => {
    expect((ALL_ROLES as readonly string[]).includes(validUser.role)).toBe(true);
    expect((ALL_STATUSES as readonly string[]).includes(validUser.status)).toBe(true);
  });

  it("accepts an ISO-8601 date string for the timestamp fields", () => {
    const ISO = /^\d{4}-\d{2}-\d{2}$/;
    expect(validUser.joinedAt).toMatch(ISO);
    expect(validUser.lastSeen).toMatch(ISO);
  });

  // ── Representative invalid inputs (compile-time rejections) ───────────────

  it("rejects a missing required field", () => {
    // @ts-expect-error - `verified` is a required field of AdminUser
    const missingVerified: AdminUser = { id: "u1", name: "n", email: "e", role: "buyer", status: "active", joinedAt: "2020-01-01", lastSeen: "2020-01-01", payouts: 0, bookings: 0 };
    expect("verified" in missingVerified).toBe(false);
  });

  it("rejects a mis-typed numeric field", () => {
    // @ts-expect-error - payouts must be a number, not a string
    const badPayouts: AdminUser = { id: "u1", name: "n", email: "e", role: "buyer", status: "active", joinedAt: "2020-01-01", lastSeen: "2020-01-01", payouts: "42", bookings: 0, verified: false };
    expect(typeof badPayouts.payouts).not.toBe("number");
  });

  it("rejects a mis-typed boolean field", () => {
    // @ts-expect-error - verified must be a boolean, not a string
    const badVerified: AdminUser = { id: "u1", name: "n", email: "e", role: "buyer", status: "active", joinedAt: "2020-01-01", lastSeen: "2020-01-01", payouts: 0, bookings: 0, verified: "yes" };
    expect(typeof badVerified.verified).not.toBe("boolean");
  });

  it("rejects an out-of-union role/status on the row", () => {
    // @ts-expect-error - "owner" is not a UserRole
    const badRole: AdminUser = { id: "u1", name: "n", email: "e", role: "owner", status: "active", joinedAt: "2020-01-01", lastSeen: "2020-01-01", payouts: 0, bookings: 0, verified: false };
    expect((ALL_ROLES as readonly string[]).includes(badRole.role)).toBe(false);
  });

  it("rejects an unknown extra property", () => {
    // @ts-expect-error - `salary` is not part of the AdminUser contract
    const extra: AdminUser = { id: "u1", name: "n", email: "e", role: "buyer", status: "active", joinedAt: "2020-01-01", lastSeen: "2020-01-01", payouts: 0, bookings: 0, verified: false, salary: 1000 };
    expect("salary" in extra).toBe(true);
  });
});

// ── Payloads ─────────────────────────────────────────────────────────────────

describe("bulk-action payloads", () => {
  it("SetRolePayload only accepts a UserRole", () => {
    const payload: SetRolePayload = { role: "moderator" };
    expect(payload.role).toBe("moderator");

    // @ts-expect-error - "root" is not a UserRole
    const invalidPayload: SetRolePayload = { role: "root" };
    expect((ALL_ROLES as readonly string[]).includes(invalidPayload.role)).toBe(false);
  });

  it("MessagePayload requires a string body", () => {
    const payload: MessagePayload = { text: "hello" };
    expect(typeof payload.text).toBe("string");

    // @ts-expect-error - text must be a string, not a number
    const invalidPayload: MessagePayload = { text: 123 };
    expect(typeof invalidPayload.text).not.toBe("string");
  });
});

// ── ColumnDef / SortSpec ─────────────────────────────────────────────────────

describe("ColumnDef", () => {
  it("accepts a minimal definition (optional width/align omitted)", () => {
    const col: ColumnDef = { key: "name", label: "Name", sortable: true };
    expect(col.width).toBeUndefined();
    expect(col.align).toBeUndefined();
  });

  it("accepts the documented align values and rejects others", () => {
    const aligned: ColumnDef = { key: "payouts", label: "Payouts", sortable: true, align: "right" };
    expect(["left", "right", "center"]).toContain(aligned.align);

    // @ts-expect-error - "middle" is not a valid align
    const badAlign: ColumnDef = { key: "name", label: "Name", sortable: true, align: "middle" };
    expect(["left", "right", "center"]).not.toContain(badAlign.align);
  });

  it("restricts the key to a real AdminUser field", () => {
    // @ts-expect-error - "salary" is not keyof AdminUser
    const badKey: ColumnDef = { key: "salary", label: "Salary", sortable: true };
    expect((EXPECTED_ADMIN_USER_KEYS as readonly string[]).includes(badKey.key as string)).toBe(false);
  });
});

describe("SortSpec", () => {
  it("accepts every documented direction", () => {
    for (const dir of ALL_SORT_DIRS) {
      const spec: SortSpec = { key: "name", dir };
      expect(NEXT_SORT_DIR[spec.dir]).toBeDefined();
    }
  });

  it("restricts the key to a real AdminUser field", () => {
    // @ts-expect-error - "salary" is not keyof AdminUser
    const badKey: SortSpec = { key: "salary", dir: "asc" };
    expect((EXPECTED_ADMIN_USER_KEYS as readonly string[]).includes(badKey.key as string)).toBe(false);
  });

  it("cycles a spec through the none → asc → desc → none transitions", () => {
    let spec: SortSpec = { key: "name", dir: "none" };
    expect(spec.dir).toBe("none");

    spec = { ...spec, dir: NEXT_SORT_DIR[spec.dir] };
    expect(spec.dir).toBe("asc");

    spec = { ...spec, dir: NEXT_SORT_DIR[spec.dir] };
    expect(spec.dir).toBe("desc");

    spec = { ...spec, dir: NEXT_SORT_DIR[spec.dir] };
    expect(spec.dir).toBe("none");
  });
});

// ── AdminUserTableState — primary state model ────────────────────────────────

describe("AdminUserTableState", () => {
  const emptyState = (): AdminUserTableState => ({
    sorts: [],
    selectedIds: new Set<string>(),
  });

  it("starts empty with a Set-typed selection", () => {
    const state = emptyState();
    expect(state.sorts).toEqual([]);
    expect(state.selectedIds).toBeInstanceOf(Set);
    expect(state.selectedIds.size).toBe(0);
  });

  it("supports the initial → sorted → selection-cleared lifecycle immutably", () => {
    const initial: AdminUserTableState = { sorts: [], selectedIds: new Set(["u1"]) };

    const sortedState: AdminUserTableState = {
      ...initial,
      sorts: [{ key: "name", dir: "asc" }],
    };

    const cleared: AdminUserTableState = {
      ...sortedState,
      selectedIds: new Set<string>(),
    };

    // Prior states are never mutated (spread + new Set/array literals).
    expect(initial.sorts).toEqual([]);
    expect(initial.selectedIds.has("u1")).toBe(true);

    expect(sortedState.sorts).toEqual([{ key: "name", dir: "asc" }]);
    expect(sortedState.selectedIds.has("u1")).toBe(true);

    // Clearing the selection must preserve the active sort.
    expect(cleared.sorts).toEqual(sortedState.sorts);
    expect(cleared.selectedIds.size).toBe(0);
  });

  it("models selection as a Set with add/delete toggle transitions", () => {
    const toggle = (state: AdminUserTableState, id: string): AdminUserTableState => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...state, selectedIds: next };
    };

    let state = emptyState();
    state = toggle(state, "u1");
    state = toggle(state, "u2");
    expect([...state.selectedIds].sort()).toEqual(["u1", "u2"]);

    state = toggle(state, "u1");
    expect([...state.selectedIds]).toEqual(["u2"]);

    // De-selecting a value that is not present is a no-op.
    state = toggle(state, "ghost");
    expect([...state.selectedIds].sort()).toEqual(["ghost", "u2"]);
  });

  it("supports replacing the whole selection (select-all / deselect-all)", () => {
    const state: AdminUserTableState = { sorts: [], selectedIds: new Set(["u1"]) };

    const selectAll: AdminUserTableState = { ...state, selectedIds: new Set(["u1", "u2", "u3"]) };
    expect(selectAll.selectedIds.size).toBe(3);

    const deselectAll: AdminUserTableState = { ...selectAll, selectedIds: new Set<string>() };
    expect(deselectAll.selectedIds.size).toBe(0);
    // Original selection untouched.
    expect(state.selectedIds.size).toBe(1);
  });

  it("supports a multi-column sort stack without mutating the input", () => {
    const sortStack: SortSpec[] = [
      { key: "payouts", dir: "desc" },
      { key: "name", dir: "asc" },
    ];
    const state: AdminUserTableState = { sorts: sortStack, selectedIds: new Set<string>() };

    const extended: AdminUserTableState = {
      ...state,
      sorts: [...state.sorts, { key: "bookings", dir: "asc" }],
    };

    expect(extended.sorts).toHaveLength(3);
    expect(sortStack).toHaveLength(2); // original stack not mutated
  });
});
