import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ToastProvider } from "@/hooks/use-toast";
import { NotificationsProvider } from "./notifications-provider";
import { NotificationBell } from "./notification-bell";
import type { NotificationItem } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const items: NotificationItem[] = [
  { id: "b1", title: "One", timestamp: "now", read: false, tone: "info" },
  { id: "b2", title: "Two", timestamp: "now", read: false, tone: "warning" },
  {
    id: "b3",
    title: "Three",
    timestamp: "now",
    read: true,
    tone: "success",
  },
];

describe("NotificationBell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the unread count with an aria-live badge and links to the notifications page", () => {
    render(
      <ToastProvider>
        <NotificationsProvider initialItems={items}>
          <NotificationBell />
        </NotificationsProvider>
      </ToastProvider>,
    );

    const link = screen.getByRole("link", {
      name: /Notifications, 2 unread/i,
    });
    expect(link).toHaveAttribute("href", "/dashboard/notifications");
    const badge = screen.getByText("2");
    expect(badge).toHaveAttribute("aria-live", "polite");
  });

  it("hides the badge when nothing is unread", () => {
    const allRead = items.map((item) => ({ ...item, read: true }));
    render(
      <ToastProvider>
        <NotificationsProvider initialItems={allRead}>
          <NotificationBell />
        </NotificationsProvider>
      </ToastProvider>,
    );

    expect(
      screen.getByRole("link", { name: "Notifications" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("renders a plain bell without a provider instead of throwing", () => {
    render(<NotificationBell />);
    expect(
      screen.getByRole("link", { name: "Notifications" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/dashboard/notifications",
    );
  });
});
