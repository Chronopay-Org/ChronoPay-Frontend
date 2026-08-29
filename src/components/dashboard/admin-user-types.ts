/**
 * Admin User Management — core types
 *
 * Follows the project's existing type conventions in types.ts.
 * All string timestamps are ISO-8601 date strings.
 */

export type UserRole = "admin" | "supplier" | "buyer" | "moderator" | "support";

export type UserStatus = "active" | "suspended" | "pending" | "banned";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string; // ISO-8601 date string
  lastSeen: string; // ISO-8601 date string
  payouts: number;
  bookings: number;
  verified: boolean;
}

// ── Sort ────────────────────────────────────────────────────────────────────

/** Sort direction for a column. "none" means the column is not participating. */
export type SortDir = "asc" | "desc" | "none";

/** A single column sort specification. */
export interface SortSpec {
  key: keyof AdminUser;
  dir: SortDir;
}

// ── Bulk actions ────────────────────────────────────────────────────────────

/** Identifiers for bulk actions available in the floating toolbar. */
export type BulkAction = "setRole" | "suspend" | "message";

/** Payload for the setRole bulk action. */
export interface SetRolePayload {
  role: UserRole;
}

/** Payload for the message bulk action. */
export interface MessagePayload {
  text: string;
}

// ── Column metadata ─────────────────────────────────────────────────────────

/** Column definition used by AdminUserTable. */
export interface ColumnDef {
  key: keyof AdminUser;
  label: string;
  sortable: boolean;
  /** Width class passed to each cell (Tailwind, e.g. "w-40") */
  width?: string;
  align?: "left" | "right" | "center";
}

// ── Table state ─────────────────────────────────────────────────────────────

/** Full internal state of the AdminUserTable. */
export interface AdminUserTableState {
  /** Ordered sort specs — first entry is primary, etc. */
  sorts: SortSpec[];
  /** Set of selected user IDs. */
  selectedIds: Set<string>;
}
