import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ToastProvider } from "@/hooks/use-toast";
import { NotificationsProvider } from "@/components/dashboard/notifications/notifications-provider";
import NotificationsPage from "./page";

// Mock the DashboardShell so we don't have to deal with its contexts,
// following the same pattern as the settings page test.
vi.mock("@/app/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));

describe("NotificationsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders inside the dashboard shell with the notification list", () => {
    render(
      <ToastProvider>
        <NotificationsProvider>
          <NotificationsPage />
        </NotificationsProvider>
      </ToastProvider>,
    );

    expect(screen.getByTestId("dashboard-shell")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /notifications/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 unread notifications")).toBeInTheDocument();
    expect(
      screen.getByText("Slot booked: Product strategy call"),
    ).toBeInTheDocument();
    expect(screen.getByText("Payout completed")).toBeInTheDocument();
  });

  it("renders without errors (boundary)", () => {
    const { container } = render(
      <ToastProvider>
        <NotificationsProvider>
          <NotificationsPage />
        </NotificationsProvider>
      </ToastProvider>,
    );
    expect(container).not.toBeEmptyDOMElement();
  });
});
