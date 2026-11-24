"use client";

/**
 * /admin/users — Admin User Management page
 *
 * - Gates access to the "admin" role via RoleContext (shows a forbidden state
 *   with a link back home for non-admin roles).
 * - Maintains a users store + sent messages log with confirm dialog and
 *   undoable toast feedback for bulk actions (suspend, change role, message).
 * - Syncs table sort, filters, page, and pageSize with URL search params.
 */

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PanelShell } from "@/components/dashboard/panel-shell";
import { AdminUserTable } from "@/components/dashboard/admin-user-table";
import {
  DEFAULT_ADMIN_PAGE_SIZE,
  DEFAULT_ADMIN_PAGE_SIZES,
  SAMPLE_ADMIN_USERS,
  VALID_USER_ROLES,
  VALID_USER_STATUSES,
  parseSortsParam,
  serializeSortsParam,
} from "@/components/dashboard/admin-user-data";
import type {
  AdminUser,
  AdminUserFilters,
  BulkAction,
  SentUserMessage,
  SortSpec,
  UserRole,
  UserStatus,
} from "@/components/dashboard/admin-user-types";
import { useRole } from "@/app/components/navigation/RoleContext";
import { useToast } from "@/hooks/use-toast";

// ── Safe hooks for test environments without providers/router ────────────────

function useSafeRole(): { role: "admin" | "supplier" | "buyer" } {
  try {
    return useRole();
  } catch {
    return { role: "admin" };
  }
}

function useSafeToast() {
  try {
    return useToast();
  } catch {
    return null;
  }
}

function useSafeNavigation() {
  const router = useRouter();
  const pathname = usePathname() || "/admin/users";
  const searchParams = useSearchParams();

  return { router, pathname, searchParams };
}

// ── Pending bulk action shape ────────────────────────────────────────────────

interface PendingBulkAction {
  action: BulkAction;
  ids: string[];
  payload?: { role?: UserRole; text?: string };
}

interface InlineUndoToast {
  id: string;
  title: string;
  description: string;
  onUndo: () => void;
}

function describeBulkAction(pending: PendingBulkAction): {
  title: string;
  confirmLabel: string;
  summary: string;
} {
  const count = pending.ids.length;
  const targetLabel = `${count} user${count === 1 ? "" : "s"}`;

  switch (pending.action) {
    case "suspend":
      return {
        title: `Suspend ${targetLabel}?`,
        confirmLabel: "Confirm Suspend",
        summary: `This will set ${targetLabel} to suspended status. You can undo this action immediately after confirming.`,
      };
    case "setRole": {
      const nextRole = pending.payload?.role ?? "buyer";
      return {
        title: `Change role to ${nextRole} for ${targetLabel}?`,
        confirmLabel: "Confirm Role Change",
        summary: `This will assign the "${nextRole}" role to ${targetLabel}.`,
      };
    }
    case "message": {
      const preview = pending.payload?.text ?? "";
      return {
        title: `Send message to ${targetLabel}?`,
        confirmLabel: "Confirm Send",
        summary: `Message: "${preview}"`,
      };
    }
  }
}

// ── Inner page content ───────────────────────────────────────────────────────

function AdminUsersPageContent() {
  const { role } = useSafeRole();
  const toastCtx = useSafeToast();
  const { router, pathname, searchParams } = useSafeNavigation();

  // Users store and sent-messages store
  const [users, setUsers] = useState<AdminUser[]>(() =>
    SAMPLE_ADMIN_USERS.map((u) => ({ ...u })),
  );
  const [sentMessages, setSentMessages] = useState<SentUserMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingBulkAction | null>(
    null,
  );
  const [inlineToast, setInlineToast] = useState<InlineUndoToast | null>(null);

  // Local fallback URL query string when next/navigation router is not reactive
  const [fallbackSearch, setFallbackSearch] = useState<string | null>(null);

  const effectiveParams = useMemo(() => {
    if (fallbackSearch !== null) {
      return new URLSearchParams(fallbackSearch);
    }
    if (searchParams && typeof searchParams.get === "function") {
      return searchParams;
    }
    return new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
  }, [searchParams, fallbackSearch]);

  // Parse URL state
  const sorts = useMemo<SortSpec[]>(
    () => parseSortsParam(effectiveParams.get("sort")),
    [effectiveParams],
  );

  const filters = useMemo<AdminUserFilters>(() => {
    const q = effectiveParams.get("q") ?? "";
    const rawRole = effectiveParams.get("role");
    const rawStatus = effectiveParams.get("status");
    const roleFilter: UserRole | "all" =
      rawRole && (VALID_USER_ROLES as readonly string[]).includes(rawRole)
        ? (rawRole as UserRole)
        : "all";
    const statusFilter: UserStatus | "all" =
      rawStatus && (VALID_USER_STATUSES as readonly string[]).includes(rawStatus)
        ? (rawStatus as UserStatus)
        : "all";
    return {
      query: q,
      role: roleFilter,
      status: statusFilter,
    };
  }, [effectiveParams]);

  const page = useMemo<number>(() => {
    const raw = effectiveParams.get("page");
    const n = raw ? Number(raw) : 1;
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  }, [effectiveParams]);

  const pageSize = useMemo<number>(() => {
    const raw = effectiveParams.get("pageSize");
    const n = raw ? Number(raw) : DEFAULT_ADMIN_PAGE_SIZE;
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULT_ADMIN_PAGE_SIZE;
  }, [effectiveParams]);

  // Update URL search params helper
  const updateSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const currentStr =
        typeof effectiveParams.toString === "function"
          ? effectiveParams.toString()
          : "";
      const next = new URLSearchParams(currentStr);
      mutate(next);
      const qs = next.toString();
      const nextUrl = `${pathname}${qs ? `?${qs}` : ""}`;

      setFallbackSearch(qs ? `?${qs}` : "");

      if (typeof window !== "undefined" && window.history?.replaceState) {
        try {
          window.history.replaceState(null, "", nextUrl);
        } catch {
          // ignore in restricted environments
        }
      }

      if (router && typeof router.replace === "function") {
        router.replace(nextUrl, { scroll: false });
      }
    },
    [effectiveParams, pathname, router],
  );

  const handleSortsChange = useCallback(
    (nextSorts: SortSpec[]) => {
      updateSearchParams((params) => {
        const serialized = serializeSortsParam(nextSorts);
        if (serialized) params.set("sort", serialized);
        else params.delete("sort");
      });
    },
    [updateSearchParams],
  );

  const handleFiltersChange = useCallback(
    (nextFilters: AdminUserFilters) => {
      updateSearchParams((params) => {
        const q = nextFilters.query?.trim() ?? "";
        if (q) params.set("q", q);
        else params.delete("q");

        if (nextFilters.role && nextFilters.role !== "all") {
          params.set("role", nextFilters.role);
        } else {
          params.delete("role");
        }

        if (nextFilters.status && nextFilters.status !== "all") {
          params.set("status", nextFilters.status);
        } else {
          params.delete("status");
        }

        params.delete("page");
      });
    },
    [updateSearchParams],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      updateSearchParams((params) => {
        if (nextPage > 1) params.set("page", String(nextPage));
        else params.delete("page");
      });
    },
    [updateSearchParams],
  );

  const handlePageSizeChange = useCallback(
    (nextSize: number) => {
      updateSearchParams((params) => {
        if (nextSize !== DEFAULT_ADMIN_PAGE_SIZE) {
          params.set("pageSize", String(nextSize));
        } else {
          params.delete("pageSize");
        }
        params.delete("page");
      });
    },
    [updateSearchParams],
  );

  // ── Bulk actions: request confirmation, execute, and undo ──────────────────

  const handleBulkAction = useCallback(
    (
      action: BulkAction,
      ids: string[],
      payload?: { role?: UserRole; text?: string },
    ) => {
      if (ids.length === 0) return;
      setPendingAction({ action, ids, payload });
    },
    [],
  );

  const confirmBulkAction = useCallback(() => {
    if (!pendingAction) return;
    const { action, ids, payload } = pendingAction;
    const idSet = new Set(ids);
    const count = ids.length;
    const targetLabel = `${count} user${count === 1 ? "" : "s"}`;

    // Snapshot previous users and messages for undo
    const previousUsers = users.map((u) => ({ ...u }));
    const previousMessages = [...sentMessages];

    let toastTitle = "";
    let toastDescription = "";

    if (action === "suspend") {
      setUsers((prev) =>
        prev.map((u) => (idSet.has(u.id) ? { ...u, status: "suspended" } : u)),
      );
      toastTitle = `Suspended ${targetLabel}`;
      toastDescription = `Status updated to suspended for ${targetLabel}.`;
    } else if (action === "setRole" && payload?.role) {
      const nextRole = payload.role;
      setUsers((prev) =>
        prev.map((u) => (idSet.has(u.id) ? { ...u, role: nextRole } : u)),
      );
      toastTitle = `Updated role to ${nextRole}`;
      toastDescription = `Assigned ${nextRole} to ${targetLabel}.`;
    } else if (action === "message" && payload?.text) {
      const msg: SentUserMessage = {
        id: `msg-${Date.now()}`,
        recipientIds: ids,
        text: payload.text,
        sentAt: new Date().toISOString(),
      };
      setSentMessages((prev) => [...prev, msg]);
      toastTitle = `Message sent to ${targetLabel}`;
      toastDescription = `"${payload.text}"`;
    }

    const handleUndo = () => {
      setUsers(previousUsers);
      setSentMessages(previousMessages);
      setInlineToast(null);
    };

    setInlineToast({
      id: `undo-${Date.now()}`,
      title: toastTitle,
      description: toastDescription,
      onUndo: handleUndo,
    });

    toastCtx?.toast({
      variant: "success",
      title: toastTitle,
      description: toastDescription,
      onUndo: handleUndo,
    });

    setPendingAction(null);
  }, [pendingAction, users, sentMessages, toastCtx]);

  const cancelBulkAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  // ── Role gating ────────────────────────────────────────────────────────────

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <main
          id="main-content"
          className="mx-auto max-w-2xl px-4 py-16 sm:px-6 text-center"
        >
          <div
            role="alert"
            data-testid="admin-forbidden-state"
            className="rounded-3xl border border-rose-500/25 bg-slate-900/90 p-8 shadow-2xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">
              403 Forbidden
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">
              Access Restricted
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              You do not have permission to view User Management. This page is
              restricted to platform administrators (current role:{" "}
              <span className="font-semibold text-slate-200">{role}</span>).
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/dashboard"
                data-testid="forbidden-home-link"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 focus-ring-cyan"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const dialogCopy = pendingAction ? describeBulkAction(pendingAction) : null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main id="main-content" className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 xl:px-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold sm:text-2xl text-white">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View, sort, and manage platform users. Select rows to perform bulk
            actions such as changing roles, suspending accounts, or sending
            messages.
          </p>
        </div>

        {/* Undo Toast banner (accessible directly inside the page as well as global ToastProvider) */}
        {inlineToast && (
          <div
            role="status"
            aria-live="polite"
            data-testid="bulk-undo-toast"
            className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-950/85 px-4 py-3 text-sm text-emerald-100 shadow-lg"
          >
            <div>
              <p className="font-semibold">{inlineToast.title}</p>
              <p className="text-xs text-emerald-200/80">{inlineToast.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="bulk-undo-button"
                onClick={inlineToast.onUndo}
                className="rounded-full border border-emerald-300/40 bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-400/30 focus-ring-cyan"
              >
                Undo
              </button>
              <button
                type="button"
                aria-label="Dismiss notification"
                data-testid="bulk-toast-dismiss"
                onClick={() => setInlineToast(null)}
                className="rounded-full p-1 text-emerald-300 hover:text-white focus-ring-cyan"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Table panel */}
        <PanelShell
          eyebrow="Admin"
          title="All Users"
          description="Shift+click column headers for multi-column sort. Space to select, Ctrl+A to select all."
        >
          <AdminUserTable
            users={users}
            onBulkAction={handleBulkAction}
            sorts={sorts}
            onSortsChange={handleSortsChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            page={page}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={DEFAULT_ADMIN_PAGE_SIZES}
          />
        </PanelShell>

        {/* Sent messages log (if any messages were dispatched in this session) */}
        {sentMessages.length > 0 && (
          <div
            data-testid="sent-messages-log"
            className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300"
          >
            <h2 className="font-semibold uppercase tracking-wider text-slate-400">
              Recent Bulk Messages ({sentMessages.length})
            </h2>
            <ul className="mt-2 space-y-1">
              {sentMessages.map((m) => (
                <li key={m.id} data-testid={`sent-message-${m.id}`}>
                  <span className="font-medium text-cyan-300">
                    To {m.recipientIds.length} user{m.recipientIds.length === 1 ? "" : "s"}:
                  </span>{" "}
                  {m.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confirmation Modal Dialog */}
        {pendingAction && dialogCopy && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-confirm-title"
            aria-describedby="bulk-confirm-desc"
            data-testid="bulk-confirm-dialog"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl">
              <h2
                id="bulk-confirm-title"
                className="text-lg font-bold text-white"
              >
                {dialogCopy.title}
              </h2>
              <p
                id="bulk-confirm-desc"
                className="mt-2 text-sm text-slate-300"
              >
                {dialogCopy.summary}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  data-testid="bulk-confirm-cancel"
                  onClick={cancelBulkAction}
                  className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 focus-ring-cyan"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="bulk-confirm-submit"
                  onClick={confirmBulkAction}
                  className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-200 focus-ring-cyan"
                >
                  {dialogCopy.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <AdminUsersPageContent />
    </Suspense>
  );
}
