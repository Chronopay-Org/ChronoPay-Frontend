"use client";

/**
 * /admin/users — Admin User Management page
 *
 * Standalone page that wraps AdminUserTable inside a full-bleed layout
 * consistent with the rest of the dashboard (dark background, constrained
 * content width, accessible heading hierarchy).
 */

import { PanelShell } from "@/components/dashboard/panel-shell";
import { AdminUserTable } from "@/components/dashboard/admin-user-table";
import { SAMPLE_ADMIN_USERS } from "@/components/dashboard/admin-user-data";
import type { BulkAction, UserRole } from "@/components/dashboard/admin-user-types";

export default function AdminUsersPage() {
  function handleBulkAction(
    action: BulkAction,
    ids: string[],
    payload?: { role?: UserRole; text?: string },
  ) {
    // In production these would call API endpoints.
    // For now we log so reviewers can verify the callback fires.
    console.info("[AdminUsersPage] bulk action", { action, ids, payload });
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main id="main-content" className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 xl:px-8">
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

        {/* Table panel */}
        <PanelShell
          eyebrow="Admin"
          title="All Users"
          description="Shift+click column headers for multi-column sort. Space to select, Ctrl+A to select all."
        >
          <AdminUserTable
            users={SAMPLE_ADMIN_USERS}
            onBulkAction={handleBulkAction}
          />
        </PanelShell>
      </main>
    </div>
  );
}
