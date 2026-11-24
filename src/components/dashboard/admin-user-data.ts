/**
 * Sample data and sort utilities for AdminUserTable.
 * In production these would come from an API.
 */

import type {
  AdminUser,
  AdminUserFilters,
  SortSpec,
  UserRole,
  UserStatus,
} from "./admin-user-types";

export const VALID_ADMIN_USER_KEYS: ReadonlyArray<keyof AdminUser> = [
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
];

export const VALID_USER_ROLES: ReadonlyArray<UserRole> = [
  "admin",
  "supplier",
  "buyer",
  "moderator",
  "support",
];

export const VALID_USER_STATUSES: ReadonlyArray<UserStatus> = [
  "active",
  "suspended",
  "pending",
  "banned",
];

export const DEFAULT_ADMIN_PAGE_SIZES = [5, 10, 25, 50] as const;
export const DEFAULT_ADMIN_PAGE_SIZE = 10;

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

// ── Filter, Pagination & URL Serialization utilities ─────────────────────────

/**
 * Filter an array of AdminUsers by free-text query (name or email), role, and status.
 */
export function filterUsers(
  users: AdminUser[],
  filters?: AdminUserFilters,
): AdminUser[] {
  if (!filters) return [...users];
  const q = filters.query?.trim().toLowerCase() ?? "";
  const roleFilter = filters.role && filters.role !== "all" ? filters.role : null;
  const statusFilter =
    filters.status && filters.status !== "all" ? filters.status : null;

  if (!q && !roleFilter && !statusFilter) return [...users];

  return users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    if (q) {
      const matchesName = u.name.toLowerCase().includes(q);
      const matchesEmail = u.email.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail) return false;
    }
    return true;
  });
}

/**
 * Paginate an array of AdminUsers using a 1-based page index and pageSize.
 * Clamps page into `[1, totalPages]`.
 */
export function paginateUsers(
  users: AdminUser[],
  page: number,
  pageSize: number,
): {
  items: AdminUser[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
} {
  const safeSize = Math.max(1, Math.floor(pageSize) || DEFAULT_ADMIN_PAGE_SIZE);
  const totalItems = users.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (safePage - 1) * safeSize;
  return {
    items: users.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    totalItems,
    totalPages,
  };
}

/**
 * Serialize a SortSpec stack to a compact URL param value (e.g. "name:asc,payouts:desc").
 */
export function serializeSortsParam(sorts: SortSpec[]): string {
  return sorts
    .filter((s) => s.dir === "asc" || s.dir === "desc")
    .map((s) => `${String(s.key)}:${s.dir}`)
    .join(",");
}

/**
 * Parse a URL param string (e.g. "name:asc,payouts:desc") into validated SortSpecs.
 */
export function parseSortsParam(raw: string | null | undefined): SortSpec[] {
  if (!raw || !raw.trim()) return [];
  const specs: SortSpec[] = [];
  const seen = new Set<keyof AdminUser>();

  for (const token of raw.split(",")) {
    const [rawKey, rawDir] = token.trim().split(":");
    const key = rawKey as keyof AdminUser;
    const dir = rawDir === "desc" ? "desc" : rawDir === "asc" ? "asc" : null;
    if (
      key &&
      dir &&
      VALID_ADMIN_USER_KEYS.includes(key) &&
      !seen.has(key)
    ) {
      seen.add(key);
      specs.push({ key, dir });
    }
  }
  return specs;
}

