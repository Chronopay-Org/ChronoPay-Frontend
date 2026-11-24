import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ToastProvider, useToast } from "@/hooks/use-toast";
import {
  NotificationsProvider,
  useNotifications,
  notificationsReducer,
  NOTIFICATIONS_STORAGE_KEY,
} from "./notifications-provider";
import type { NotificationsState } from "./notifications-provider";
import type { NotificationItem } from "./types";

const seed: NotificationItem[] = [
  {
    id: "n1",
    title: "Slot booked",
    timestamp: "2 min ago",
    read: false,
    tone: "success",
  },
  {
    id: "n2",
    title: "Escrow failed",
    timestamp: "5 hours ago",
    read: false,
    tone: "error",
  },
  {
    id: "n3",
    title: "Payout completed",
    timestamp: "1 hour ago",
    read: true,
    tone: "info",
  },
];

const initialState: NotificationsState = {
  items: seed,
  dismissed: [],
  hydrated: false,
};

describe("notificationsReducer", () => {
  it("adds a new notification at the top", () => {
    const next = notificationsReducer(initialState, {
      type: "add",
      notification: {
        id: "n4",
        title: "New review",
        timestamp: "now",
        read: false,
        tone: "info",
      },
    });
    expect(next.items[0].id).toBe("n4");
    expect(next.items).toHaveLength(4);
  });

  it("replaces a notification added with an existing id", () => {
    const next = notificationsReducer(initialState, {
      type: "add",
      notification: {
        id: "n1",
        title: "Slot booked (updated)",
        timestamp: "now",
        read: true,
        tone: "success",
      },
    });
    expect(next.items).toHaveLength(3);
    expect(next.items[0].title).toBe("Slot booked (updated)");
    expect(next.items[0].read).toBe(true);
  });

  it("marks one notification read", () => {
    const next = notificationsReducer(initialState, {
      type: "markRead",
      id: "n1",
    });
    expect(next.items.find((i) => i.id === "n1")?.read).toBe(true);
    expect(next.items.find((i) => i.id === "n2")?.read).toBe(false);
  });

  it("marks all notifications read", () => {
    const next = notificationsReducer(initialState, { type: "markAllRead" });
    expect(next.items.every((i) => i.read)).toBe(true);
  });

  it("dismisses the given ids and keeps them for undo", () => {
    const next = notificationsReducer(initialState, {
      type: "dismiss",
      ids: ["n1", "n3"],
    });
    expect(next.items.map((i) => i.id)).toEqual(["n2"]);
    expect(next.dismissed.map((d) => d.item.id)).toEqual(["n1", "n3"]);
  });

  it("undo restores the dismissed batch at the original positions", () => {
    const dismissed = notificationsReducer(initialState, {
      type: "dismiss",
      ids: ["n1", "n3"],
    });
    const next = notificationsReducer(dismissed, { type: "undo" });
    expect(next.items.map((i) => i.id)).toEqual(["n1", "n2", "n3"]);
    expect(next.dismissed).toEqual([]);
  });

  it("undo is a no-op when nothing was dismissed", () => {
    const next = notificationsReducer(initialState, { type: "undo" });
    expect(next).toBe(initialState);
  });

  it("hydrate replaces the list and clears the dismissed batch", () => {
    const dismissed = notificationsReducer(initialState, {
      type: "dismiss",
      ids: ["n1"],
    });
    const stored: NotificationItem[] = [
      {
        id: "s1",
        title: "Stored one",
        timestamp: "yesterday",
        read: false,
        tone: "info",
      },
    ];
    const next = notificationsReducer(dismissed, {
      type: "hydrate",
      items: stored,
    });
    expect(next.items).toEqual(stored);
    expect(next.dismissed).toEqual([]);
    expect(next.hydrated).toBe(true);
  });
});

function Probe() {
  const { items, unreadCount, canUndo, add, markRead, markAllRead, dismiss, undo } =
    useNotifications();
  const { toasts } = useToast();
  return (
    <div>
      <span data-testid="unread">{unreadCount}</span>
      <span data-testid="can-undo">{canUndo ? "yes" : "no"}</span>
      <span data-testid="toast-count">{toasts.length}</span>
      <span data-testid="toast-variant">{toasts[0]?.variant ?? "none"}</span>
      <ul>
        {items.map((item) => (
          <li key={item.id} data-testid={`item-${item.id}`}>
            {item.title}:{item.read ? "read" : "unread"}
          </li>
        ))}
      </ul>
      <button
        data-testid="add-info"
        onClick={() =>
          add({
            id: "n4",
            title: "New review",
            timestamp: "now",
            read: false,
            tone: "info",
          })
        }
      >
        Add info
      </button>
      <button
        data-testid="add-error"
        onClick={() =>
          add({
            id: "n5",
            title: "Escrow failed again",
            timestamp: "now",
            read: false,
            tone: "error",
          })
        }
      >
        Add error
      </button>
      <button data-testid="mark-read-n1" onClick={() => markRead("n1")}>
        Mark n1 read
      </button>
      <button data-testid="mark-all-read" onClick={markAllRead}>
        Mark all read
      </button>
      <button data-testid="dismiss-n1" onClick={() => dismiss(["n1"])}>
        Dismiss n1
      </button>
      <button data-testid="undo" onClick={undo}>
        Undo
      </button>
    </div>
  );
}

function renderProbe(initialItems = seed) {
  return render(
    <ToastProvider>
      <NotificationsProvider initialItems={initialItems}>
        <Probe />
      </NotificationsProvider>
    </ToastProvider>,
  );
}

describe("NotificationsProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("exposes the seeded items and the unread count", () => {
    renderProbe();
    expect(screen.getByTestId("unread").textContent).toBe("2");
    expect(screen.getByTestId("item-n1").textContent).toContain("unread");
    expect(screen.getByTestId("item-n3").textContent).toContain("read");
  });

  it("adds a notification and raises a critical toast only for error tone", () => {
    renderProbe();
    fireEvent.click(screen.getByTestId("add-info"));
    expect(screen.getByTestId("item-n4")).toBeInTheDocument();
    expect(screen.getByTestId("toast-count").textContent).toBe("0");

    fireEvent.click(screen.getByTestId("add-error"));
    expect(screen.getByTestId("item-n5")).toBeInTheDocument();
    expect(screen.getByTestId("toast-count").textContent).toBe("1");
    expect(screen.getByTestId("toast-variant").textContent).toBe("critical");
  });

  it("marks one and then all as read", () => {
    renderProbe();
    fireEvent.click(screen.getByTestId("mark-read-n1"));
    expect(screen.getByTestId("unread").textContent).toBe("1");
    fireEvent.click(screen.getByTestId("mark-all-read"));
    expect(screen.getByTestId("unread").textContent).toBe("0");
  });

  it("dismisses and undoes, and reports canUndo", () => {
    renderProbe();
    expect(screen.getByTestId("can-undo").textContent).toBe("no");
    fireEvent.click(screen.getByTestId("dismiss-n1"));
    expect(screen.queryByTestId("item-n1")).not.toBeInTheDocument();
    expect(screen.getByTestId("can-undo").textContent).toBe("yes");
    fireEvent.click(screen.getByTestId("undo"));
    expect(screen.getByTestId("item-n1")).toBeInTheDocument();
    expect(screen.getByTestId("can-undo").textContent).toBe("no");
  });

  it("persists changes to localStorage", async () => {
    renderProbe();
    fireEvent.click(screen.getByTestId("mark-all-read"));
    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) ?? "[]",
      ) as NotificationItem[];
      expect(stored).toHaveLength(3);
      expect(stored.every((item) => item.read)).toBe(true);
    });
  });

  it("hydrates from localStorage when a stored list exists", async () => {
    const stored: NotificationItem[] = [
      {
        id: "s1",
        title: "Stored one",
        timestamp: "yesterday",
        read: false,
        tone: "info",
      },
      {
        id: "s2",
        title: "Stored two",
        timestamp: "yesterday",
        read: true,
        tone: "success",
      },
    ];
    window.localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(stored),
    );
    renderProbe();
    expect(await screen.findByTestId("item-s1")).toBeInTheDocument();
    expect(screen.getByTestId("unread").textContent).toBe("1");
    expect(screen.queryByTestId("item-n1")).not.toBeInTheDocument();
  });
});
