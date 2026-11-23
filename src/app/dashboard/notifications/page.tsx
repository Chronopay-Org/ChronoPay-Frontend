"use client";

import { DashboardShell } from "@/app/components/dashboard-shell";
import { NotificationList } from "@/components/dashboard/notifications/notification-list";
import { useNotifications } from "@/components/dashboard/notifications/notifications-provider";

export default function NotificationsPage() {
  const { items, unreadCount, markRead, dismiss } = useNotifications();

  return (
    <DashboardShell>
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
        <div className="mb-6">
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Notifications
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"}
          </p>
        </div>
        <NotificationList
          notifications={items}
          onMarkAsRead={(ids) => ids.forEach((id) => markRead(id))}
          onArchive={(ids) => dismiss(ids)}
        />
      </main>
    </DashboardShell>
  );
}
