/**
 * Sample data and sort utilities for AdminUserTable.
 * In production these would come from an API.
 */

import type { AdminUser, SortSpec } from "./admin-user-types";

// ── Sample rows ──────────────────────────────────────────────────────────────

export const SAMPLE_ADMIN_USERS: AdminUser[] = [
  {
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
  },
  {
    id: "u2",
    name: "Bob Okafor",
    email: "bob@example.com",
    role: "supplier",
    status: "active",
    joinedAt: "2023-03-08",
    lastSeen: "2024-07-25",
    payouts: 210,
    bookings: 88,
    verified: true,
  },
  {
    id: "u3",
    name: "Carol Martinez",
    email: "carol@example.com",
    role: "buyer",
    status: "pending",
    joinedAt: "2024-05-20",
    lastSeen: "2024-07-10",
    payouts: 0,
    bookings: 3,
    verified: false,
  },
  {
    id: "u4",
    name: "David Kim",
    email: "david@example.com",
    role: "moderator",
    status: "active",
    joinedAt: "2023-06-01",
    lastSeen: "2024-07-26",
    payouts: 0,
    bookings: 0,
    verified: true,
  },
  {
    id: "u5",
    name: "Eve Nakamura",
    email: "eve@example.com",
    role: "supplier",
    status: "suspended",
    joinedAt: "2023-02-14",
    lastSeen: "2024-06-30",
    payouts: 55,
    bookings: 40,
    verified: true,
  },
  {
    id: "u6",
    name: "Frank Osei",
    email: "frank@example.com",
    role: "support",
    status: "active",
    joinedAt: "2023-09-11",
    lastSeen: "2024-07-28",
    payouts: 0,
    bookings: 12,
    verified: false,
  },
  {
    id: "u7",
    name: "Grace Liu",
    email: "grace@example.com",
    role: "buyer",
    status: "banned",
    joinedAt: "2022-11-30",
    lastSeen: "2024-01-05",
    payouts: 0,
    bookings: 7,
    verified: false,
  },
  {
    id: "u8",
    name: "Hamid Rashid",
    email: "hamid@example.com",
    role: "supplier",
    status: "active",
    joinedAt: "2023-07-22",
    lastSeen: "2024-07-27",
    payouts: 133,
    bookings: 95,
    verified: true,
  },
];

// ── Sort utilities ───────────────────────────────────────────────────────────

/**
 * Compare two AdminUser values for a given key.
 * Numbers and booleans are sorted numerically;
 * strings are sorted locale-insensitively.
 */
function compareValues(a: AdminUser, b: AdminUser, key: keyof AdminUser): number {
  const av = a[key];
  const bv = b[key];

  if (typeof av === "number" && typeof bv === "number") return av - bv;
  if (typeof av === "boolean" && typeof bv === "boolean") return Number(av) - Number(bv);
  return String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
}

/**
 * Apply a stack of SortSpecs to an array of AdminUsers.
 * Earlier specs in the array take priority (primary → secondary → …).
 * Returns a new sorted array; the original is not mutated.
 */
export function sortUsers(users: AdminUser[], sorts: SortSpec[]): AdminUser[] {
  const activeSorts = sorts.filter((s) => s.dir !== "none");
  if (activeSorts.length === 0) return [...users];

  return [...users].sort((a, b) => {
    for (const spec of activeSorts) {
      const cmp = compareValues(a, b, spec.key);
      if (cmp !== 0) return spec.dir === "asc" ? cmp : -cmp;
    }
    return 0;
  });
}

/**
 * Toggle a column in a sort-spec stack.
 *
 * Cycle:  none → asc → desc → none (removes from stack when reset to none).
 * If the column is not in the stack, it is appended with dir="asc".
 * If `exclusive` is true (e.g. user clicked without holding Shift) the stack
 * is replaced with just this column.
 */
export function toggleSort(
  sorts: SortSpec[],
  key: keyof AdminUser,
  exclusive: boolean,
): SortSpec[] {
  const existing = sorts.find((s) => s.key === key);

  let nextDir: "asc" | "desc" | "none";
  if (!existing || existing.dir === "none") {
    nextDir = "asc";
  } else if (existing.dir === "asc") {
    nextDir = "desc";
  } else {
    nextDir = "none";
  }

  if (exclusive) {
    return nextDir === "none" ? [] : [{ key, dir: nextDir }];
  }

  // Multi-column: update or remove the spec for this key
  const without = sorts.filter((s) => s.key !== key);
  if (nextDir === "none") return without;
  return [...without, { key, dir: nextDir }];
}
