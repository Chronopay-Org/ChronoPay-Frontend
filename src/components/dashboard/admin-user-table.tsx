"use client";

/**
 * AdminUserTable
 *
 * Accessible user-management table with:
 *  - Sticky header (CSS position: sticky)
 *  - Multi-column sort (click = exclusive, Shift+click = additive)
 *  - Filter bar (search query, role filter, status filter)
 *  - Pagination & page-size selector
 *  - Row multiselect with keyboard support (Space, Shift+Click, Ctrl+A)
 *  - Floating BulkActionsToolbar for role, suspend, and message actions
 */

import {
  useCallback,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { StatusChip } from "./status-chip";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import {
  DEFAULT_ADMIN_PAGE_SIZE,
  DEFAULT_ADMIN_PAGE_SIZES,
  VALID_USER_ROLES,
  VALID_USER_STATUSES,
  filterUsers,
  paginateUsers,
  sortUsers,
  toggleSort,
} from "./admin-user-data";
import type {
  AdminUser,
  AdminUserFilters,
  AdminUserTableState,
  BulkAction,
  ColumnDef,
  SortDir,
  SortSpec,
  UserRole,
  UserStatus,
} from "./admin-user-types";
import type { Tone } from "./types";

// ── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef[] = [
  { key: "name",     label: "Name",      sortable: true,  width: "min-w-[10rem]", align: "left" },
  { key: "email",    label: "Email",     sortable: true,  width: "min-w-[12rem]", align: "left" },
  { key: "role",     label: "Role",      sortable: true,  width: "min-w-[7rem]",  align: "left" },
  { key: "status",   label: "Status",    sortable: true,  width: "min-w-[7rem]",  align: "left" },
  { key: "joinedAt", label: "Joined",    sortable: true,  width: "min-w-[7rem]",  align: "left" },
  { key: "lastSeen", label: "Last seen", sortable: true,  width: "min-w-[7rem]",  align: "left" },
  { key: "payouts",  label: "Payouts",   sortable: true,  width: "min-w-[5rem]",  align: "right" },
  { key: "bookings", label: "Bookings",  sortable: true,  width: "min-w-[5rem]",  align: "right" },
  { key: "verified", label: "Verified",  sortable: true,  width: "min-w-[5rem]",  align: "center" },
];

// ── Tone maps ────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<AdminUser["status"], Tone> = {
  active:    "positive",
  suspended: "warning",
  pending:   "neutral",
  banned:    "critical",
};

const ROLE_TONE: Record<AdminUser["role"], Tone> = {
  admin:     "critical",
  moderator: "warning",
  support:   "neutral",
  supplier:  "positive",
  buyer:     "neutral",
};

// ── State / reducer ──────────────────────────────────────────────────────────

type TableAction =
  | { type: "SET_SORTS"; sorts: SortSpec[] }
  | { type: "TOGGLE_SORT"; key: keyof AdminUser; exclusive: boolean }
  | { type: "TOGGLE_ROW"; id: string }
  | { type: "RANGE_SELECT"; fromId: string; toId: string; orderedIds: string[] }
  | { type: "SELECT_ALL"; ids: string[] }
  | { type: "DESELECT_ALL" };

function tableReducer(
  state: AdminUserTableState,
  action: TableAction,
): AdminUserTableState {
  switch (action.type) {
    case "SET_SORTS":
      return {
        ...state,
        sorts: action.sorts,
      };

    case "TOGGLE_SORT":
      return {
        ...state,
        sorts: toggleSort(state.sorts, action.key, action.exclusive),
      };

    case "TOGGLE_ROW": {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, selectedIds: next };
    }

    case "RANGE_SELECT": {
      const { fromId, toId, orderedIds } = action;
      const fromIdx = orderedIds.indexOf(fromId);
      const toIdx   = orderedIds.indexOf(toId);
      if (fromIdx === -1 || toIdx === -1) return state;
      const [lo, hi] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
      const next = new Set(state.selectedIds);
      orderedIds.slice(lo, hi + 1).forEach((id) => next.add(id));
      return { ...state, selectedIds: next };
    }

    case "SELECT_ALL":
      return { ...state, selectedIds: new Set(action.ids) };

    case "DESELECT_ALL":
      return { ...state, selectedIds: new Set() };

    default:
      return state;
  }
}

// ── Helper: sort indicator ───────────────────────────────────────────────────

function SortIndicator({ dir, priority }: { dir: SortDir; priority: number }) {
  if (dir === "none") {
    return (
      <svg
        aria-hidden="true"
        className="h-3 w-3 text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      <svg
        aria-hidden="true"
        className={`h-3 w-3 transition-transform ${dir === "desc" ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
      {priority > 0 && (
        <span className="text-[9px] font-bold text-cyan-300 leading-none">{priority}</span>
      )}
    </span>
  );
}

// ── Helper: format dates ─────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Main component ───────────────────────────────────────────────────────────

export interface AdminUserTableProps {
  users: AdminUser[];
  /** Called when a bulk action is confirmed. */
  onBulkAction?: (
    action: BulkAction,
    ids: string[],
    payload?: { role?: UserRole; text?: string },
  ) => void;
  /** Optionally override the max-height of the scrollable body. */
  maxHeight?: string;
  /** Controlled or initial sorts stack. */
  sorts?: SortSpec[];
  onSortsChange?: (sorts: SortSpec[]) => void;
  /** Controlled or initial filters. */
  filters?: AdminUserFilters;
  onFiltersChange?: (filters: AdminUserFilters) => void;
  /** Controlled or initial 1-based page number. */
  page?: number;
  onPageChange?: (page: number) => void;
  /** Controlled or initial page size. */
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page size options. */
  pageSizeOptions?: readonly number[];
}

export function AdminUserTable({
  users,
  onBulkAction,
  maxHeight = "calc(100vh - 260px)",
  sorts: controlledSorts,
  onSortsChange,
  filters: controlledFilters,
  onFiltersChange,
  page: controlledPage,
  onPageChange,
  pageSize: controlledPageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_ADMIN_PAGE_SIZES,
}: AdminUserTableProps) {
  const gridId = useId();
  const [announcement, setAnnounce] = useState("");
  const lastSelectedRef = useRef<string | null>(null);

  const [state, dispatch] = useReducer(tableReducer, {
    sorts: controlledSorts ?? [],
    selectedIds: new Set<string>(),
  });

  const [internalFilters, setInternalFilters] = useState<AdminUserFilters>({
    query: "",
    role: "all",
    status: "all",
  });
  const [internalPage, setInternalPage] = useState<number>(1);
  const [internalPageSize, setInternalPageSize] = useState<number>(
    controlledPageSize ?? DEFAULT_ADMIN_PAGE_SIZE,
  );

  const activeSorts = controlledSorts ?? state.sorts;
  const activeFilters = controlledFilters ?? internalFilters;
  const requestedPage = controlledPage ?? internalPage;
  const activePageSize = controlledPageSize ?? internalPageSize;

  // Filtered and sorted rows
  const filteredUsers = useMemo(
    () => filterUsers(users, activeFilters),
    [users, activeFilters],
  );
  const sortedUsers = useMemo(
    () => sortUsers(filteredUsers, activeSorts),
    [filteredUsers, activeSorts],
  );

  // Paginated slice
  const pagination = useMemo(
    () => paginateUsers(sortedUsers, requestedPage, activePageSize),
    [sortedUsers, requestedPage, activePageSize],
  );

  const pagedUsers = pagination.items;
  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const totalFilteredCount = pagination.totalItems;

  const pagedIds = useMemo(() => pagedUsers.map((u) => u.id), [pagedUsers]);

  const allSelected =
    pagedIds.length > 0 && pagedIds.every((id) => state.selectedIds.has(id));
  const someSelected =
    !allSelected && pagedIds.some((id) => state.selectedIds.has(id));

  // ── Filter & pagination handlers ───────────────────────────────────────────

  const updatePage = useCallback(
    (nextPage: number) => {
      if (onPageChange) {
        onPageChange(nextPage);
      } else {
        setInternalPage(nextPage);
      }
    },
    [onPageChange],
  );

  const updatePageSize = useCallback(
    (nextSize: number) => {
      if (onPageSizeChange) {
        onPageSizeChange(nextSize);
      } else {
        setInternalPageSize(nextSize);
        updatePage(1);
      }
      setAnnounce(`Showing ${nextSize} users per page`);
    },
    [onPageSizeChange, updatePage],
  );

  const updateFilters = useCallback(
    (patch: Partial<AdminUserFilters>) => {
      const next: AdminUserFilters = {
        ...activeFilters,
        ...patch,
      };
      if (onFiltersChange) {
        onFiltersChange(next);
      } else {
        setInternalFilters(next);
        updatePage(1);
      }
    },
    [activeFilters, onFiltersChange, updatePage],
  );

  // ── Sort handler ───────────────────────────────────────────────────────────

  const handleSort = useCallback(
    (key: keyof AdminUser, e: React.MouseEvent | React.KeyboardEvent) => {
      const exclusive = !("shiftKey" in e && e.shiftKey);
      const nextSorts = toggleSort(activeSorts, key, exclusive);
      dispatch({ type: "SET_SORTS", sorts: nextSorts });
      onSortsChange?.(nextSorts);

      const spec = activeSorts.find((s) => s.key === key);
      const nextDir =
        !spec || spec.dir === "none"
          ? "ascending"
          : spec.dir === "asc"
          ? "descending"
          : "cleared";
      setAnnounce(`${String(key)} sorted ${nextDir}`);
    },
    [activeSorts, onSortsChange],
  );

  // ── Selection handlers ─────────────────────────────────────────────────────

  const handleRowSelect = useCallback(
    (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
      const isShift = "shiftKey" in e && e.shiftKey;
      if (isShift && lastSelectedRef.current) {
        dispatch({
          type: "RANGE_SELECT",
          fromId: lastSelectedRef.current,
          toId: id,
          orderedIds: pagedIds,
        });
      } else {
        dispatch({ type: "TOGGLE_ROW", id });
      }
      lastSelectedRef.current = id;
    },
    [pagedIds],
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      dispatch({ type: "DESELECT_ALL" });
      setAnnounce("All users deselected");
    } else {
      dispatch({ type: "SELECT_ALL", ids: pagedIds });
      setAnnounce(`All ${pagedIds.length} users selected`);
    }
  }, [allSelected, pagedIds]);

  // ── Keyboard navigation for grid cells ────────────────────────────────────

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        handleSelectAll();
      }
    },
    [handleSelectAll],
  );

  // ── Bulk action handler ────────────────────────────────────────────────────

  const handleBulkAction = useCallback(
    (action: BulkAction, payload?: { role?: UserRole; text?: string }) => {
      const ids = Array.from(state.selectedIds);
      onBulkAction?.(action, ids, payload);
      setAnnounce(`${action} applied to ${ids.length} user${ids.length === 1 ? "" : "s"}`);
    },
    [state.selectedIds, onBulkAction],
  );

  const handleDismiss = useCallback(() => {
    dispatch({ type: "DESELECT_ALL" });
    setAnnounce("Selection cleared");
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const rangeStart =
    totalFilteredCount === 0 ? 0 : (currentPage - 1) * activePageSize + 1;
  const rangeEnd = Math.min(totalFilteredCount, currentPage * activePageSize);

  return (
    <div className="relative">
      {/* Live region for sort and selection announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="table-live-region"
      >
        {announcement}
      </div>

      {/* Keyboard hint */}
      <p className="sr-only">
        Shift+click column headers for multi-column sort. Space to select rows,
        Shift+Space for range select, Ctrl+A to select all.
      </p>

      {/* Filter bar */}
      <div
        className="mb-4 flex flex-wrap items-center gap-3"
        data-testid="admin-user-filters"
      >
        <div className="flex-1 min-w-[14rem]">
          <label htmlFor={`${gridId}-search`} className="sr-only">
            Search users
          </label>
          <input
            id={`${gridId}-search`}
            type="search"
            data-testid="filter-search"
            aria-label="Search users"
            placeholder="Search by name or email…"
            value={activeFilters.query ?? ""}
            onChange={(e) => updateFilters({ query: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-ring-cyan"
          />
        </div>

        <div>
          <label htmlFor={`${gridId}-role-filter`} className="sr-only">
            Filter by role
          </label>
          <select
            id={`${gridId}-role-filter`}
            data-testid="filter-role"
            aria-label="Filter by role"
            value={activeFilters.role ?? "all"}
            onChange={(e) =>
              updateFilters({ role: e.target.value as UserRole | "all" })
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus-ring-cyan"
          >
            <option value="all">All roles</option>
            {VALID_USER_ROLES.map((r) => (
              <option key={r} value={r}>
                Role: {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${gridId}-status-filter`} className="sr-only">
            Filter by status
          </label>
          <select
            id={`${gridId}-status-filter`}
            data-testid="filter-status"
            aria-label="Filter by status"
            value={activeFilters.status ?? "all"}
            onChange={(e) =>
              updateFilters({ status: e.target.value as UserStatus | "all" })
            }
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus-ring-cyan"
          >
            <option value="all">All statuses</option>
            {VALID_USER_STATUSES.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable grid wrapper */}
      <div
        id={gridId}
        role="grid"
        aria-label="User management"
        aria-rowcount={totalFilteredCount + 1}
        aria-colcount={COLUMNS.length + 1}
        onKeyDown={handleGridKeyDown}
        className="overflow-x-auto rounded-2xl border border-white/10"
        style={{ maxHeight, overflowY: "auto" }}
        data-testid="admin-user-grid"
      >
        <table className="w-full border-collapse text-sm" style={{ minWidth: "720px" }}>
          {/* ── Sticky header ──────────────────────────────────────────────── */}
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            <tr role="row">
              {/* Select-all checkbox */}
              <th
                role="columnheader"
                scope="col"
                className="w-10 px-4 py-3 text-start"
                aria-label="Select all rows"
              >
                <input
                  type="checkbox"
                  data-testid="select-all-checkbox"
                  aria-label={allSelected ? "Deselect all" : "Select all"}
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 accent-cyan-300 cursor-pointer focus-ring-cyan"
                />
              </th>

              {/* Column headers */}
              {COLUMNS.map((col) => {
                const spec = activeSorts.find((s) => s.key === col.key);
                const dir: SortDir = spec?.dir ?? "none";
                const priority =
                  activeSorts.filter((s) => s.dir !== "none").findIndex(
                    (s) => s.key === col.key,
                  ) + 1;

                const ariaSort =
                  dir === "asc"
                    ? ("ascending" as const)
                    : dir === "desc"
                    ? ("descending" as const)
                    : ("none" as const);

                return (
                  <th
                    key={col.key}
                    role="columnheader"
                    scope="col"
                    aria-sort={col.sortable ? ariaSort : undefined}
                    className={[
                      col.width ?? "",
                      "px-4 py-3",
                      col.align === "right" ? "text-end" : col.align === "center" ? "text-center" : "text-start",
                      "text-xs font-semibold uppercase tracking-[0.12em] text-slate-400",
                      "border-b border-white/8",
                    ].join(" ")}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        data-testid={`sort-${col.key}`}
                        title="Click to sort. Shift+click for multi-column sort."
                        onClick={(e) => handleSort(col.key, e)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSort(col.key, e);
                          }
                        }}
                        className={[
                          "inline-flex items-center gap-1.5 rounded",
                          "focus-ring-cyan -mx-1 px-1 py-0.5",
                          "hover:text-slate-200 transition-colors",
                          dir !== "none" ? "text-cyan-200" : "",
                        ].join(" ")}
                      >
                        {col.label}
                        <SortIndicator dir={dir} priority={priority} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <tbody>
            {pagedUsers.length === 0 && (
              <tr role="row">
                <td
                  role="gridcell"
                  colSpan={COLUMNS.length + 1}
                  className="py-16 text-center text-slate-500"
                >
                  No users found.
                </td>
              </tr>
            )}

            {pagedUsers.map((user, rowIdx) => {
              const isSelected = state.selectedIds.has(user.id);
              const absoluteRowIdx = (currentPage - 1) * activePageSize + rowIdx + 2;
              return (
                <tr
                  key={user.id}
                  role="row"
                  aria-selected={isSelected}
                  aria-rowindex={absoluteRowIdx}
                  data-testid={`row-${user.id}`}
                  className={[
                    "border-b border-white/5 transition-colors",
                    isSelected
                      ? "bg-cyan-300/8"
                      : "hover:bg-white/[0.03]",
                  ].join(" ")}
                >
                  {/* Row checkbox */}
                  <td role="rowheader" className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      data-testid={`checkbox-${user.id}`}
                      aria-label={`Select ${user.name}`}
                      checked={isSelected}
                      onChange={() => {/* controlled by onClick */}}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowSelect(user.id, e);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.preventDefault();
                          handleRowSelect(user.id, e);
                        }
                      }}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-cyan-300 cursor-pointer focus-ring-cyan"
                    />
                  </td>

                  {/* Name */}
                  <td role="gridcell" className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{user.name}</span>
                      {user.verified && (
                        <svg
                          aria-label="Verified"
                          role="img"
                          className="h-3.5 w-3.5 shrink-0 text-cyan-300"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                  </td>

                  {/* Email */}
                  <td role="gridcell" className="px-4 py-3 text-slate-300 font-mono text-xs">
                    {user.email}
                  </td>

                  {/* Role */}
                  <td role="gridcell" className="px-4 py-3">
                    <StatusChip tone={ROLE_TONE[user.role]}>{user.role}</StatusChip>
                  </td>

                  {/* Status */}
                  <td role="gridcell" className="px-4 py-3">
                    <StatusChip tone={STATUS_TONE[user.status]}>{user.status}</StatusChip>
                  </td>

                  {/* Joined */}
                  <td role="gridcell" className="px-4 py-3 text-slate-400 font-mono text-xs tabular-nums">
                    <time dateTime={user.joinedAt}>{fmtDate(user.joinedAt)}</time>
                  </td>

                  {/* Last seen */}
                  <td role="gridcell" className="px-4 py-3 text-slate-400 font-mono text-xs tabular-nums">
                    <time dateTime={user.lastSeen}>{fmtDate(user.lastSeen)}</time>
                  </td>

                  {/* Payouts */}
                  <td role="gridcell" className="px-4 py-3 text-end tabular-nums text-slate-300">
                    {user.payouts.toLocaleString()}
                  </td>

                  {/* Bookings */}
                  <td role="gridcell" className="px-4 py-3 text-end tabular-nums text-slate-300">
                    {user.bookings.toLocaleString()}
                  </td>

                  {/* Verified */}
                  <td role="gridcell" className="px-4 py-3 text-center">
                    {user.verified ? (
                      <span className="text-emerald-400" aria-label="Yes">✓</span>
                    ) : (
                      <span className="text-slate-600" aria-label="No">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer summary + Pagination controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-slate-500" aria-live="polite" data-testid="table-footer-summary">
          {totalFilteredCount} user{totalFilteredCount === 1 ? "" : "s"}
          {totalFilteredCount > 0 && ` (showing ${rangeStart}–${rangeEnd})`}
          {state.selectedIds.size > 0 && ` · ${state.selectedIds.size} selected`}
          {activeSorts.filter((s) => s.dir !== "none").length > 0 &&
            ` · sorted by ${activeSorts
              .filter((s) => s.dir !== "none")
              .map((s) => `${String(s.key)} (${s.dir})`)
              .join(", ")}`}
        </p>

        <div
          className="flex flex-wrap items-center gap-3 text-xs text-slate-300"
          data-testid="pagination-controls"
        >
          {/* Page-size selector */}
          <div className="flex items-center gap-2">
            <label htmlFor={`${gridId}-page-size`} className="text-slate-400">
              Rows per page
            </label>
            <select
              id={`${gridId}-page-size`}
              data-testid="page-size-select"
              aria-label="Rows per page"
              value={activePageSize}
              onChange={(e) => updatePageSize(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus-ring-cyan"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Page navigation */}
          <nav aria-label="Table pagination" className="flex items-center gap-2">
            <button
              type="button"
              data-testid="pagination-prev"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => updatePage(currentPage - 1)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none focus-ring-cyan"
            >
              Previous
            </button>
            <span className="tabular-nums text-slate-400" data-testid="pagination-status">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              data-testid="pagination-next"
              aria-label="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => updatePage(currentPage + 1)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none focus-ring-cyan"
            >
              Next
            </button>
          </nav>
        </div>
      </div>

      {/* Floating bulk-actions toolbar */}
      <BulkActionsToolbar
        selectedIds={state.selectedIds}
        gridId={gridId}
        onAction={handleBulkAction}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
