"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useContext } from "react";
import clsx from "clsx";
import { NotificationsContext } from "./notifications-provider";

/**
 * Bell button linking to the notifications page, with an unread badge.
 *
 * Reads the unread count from NotificationsContext. When rendered outside
 * a NotificationsProvider (e.g. the Header in isolation) it degrades to a
 * plain bell with no badge instead of throwing, so the header never crashes
 * the page.
 */
export function NotificationBell() {
  const ctx = useContext(NotificationsContext);
  const unreadCount = ctx ? ctx.unreadCount : 0;
  const label =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications";

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={label}
      className={clsx(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full",
        "border border-slate-400/20 transition hover:bg-slate-500/10",
      )}
      style={{ color: "var(--foreground)" }}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unreadCount > 0 ? (
        <span
          aria-live="polite"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold leading-none text-white"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
