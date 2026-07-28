import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationList } from "@/components/dashboard/notifications/notification-list";
import { useNotificationSelection } from "@/components/dashboard/notifications/use-notification-selection";
import type { NotificationItem } from "@/components/dashboard/notifications/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const defaultNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Slot booked",
    description: "A slot was booked.",
    timestamp: "2 min ago",
    read: false,
    tone: "success",
  },
  {
    id: "n2",
    title: "Payout completed",
    description: "Payout released.",
    timestamp: "1 hour ago",
    read: false,
    tone: "info",
  },
  {
    id: "n3",
    title: "Confirmation needed",
    description: "Waiting for confirmation.",
    timestamp: "3 hours ago",
    read: true,
    tone: "warning",
  },
  {
    id: "n4",
    title: "Escrow failed",
    description: "Release rejected.",
    timestamp: "5 hours ago",
    read: true,
    tone: "error",
  },
];

// ── Tests: useNotificationSelection ───────────────────────────────────────────

describe("useNotificationSelection", () => {
  function TestHarness() {
    const hook = useNotificationSelection();
    return (
      <div>
        <span data-testid="count">{hook.selectedCount}</span>
        <button data-testid="toggle-n1" onClick={() => hook.toggleSelect("n1")}>
          Toggle n1
        </button>
        <button
          data-testid="toggle-n2"
          onClick={() => hook.toggleSelect("n2")}
        >
          Toggle n2
        </button>
        <button
          data-testid="range"
          onClick={() => hook.rangeSelect(["n1", "n2"])}
        >
          Range n1-n2
        </button>
        <button
          data-testid="select-all"
          onClick={() => hook.selectAll(["n1", "n2", "n3", "n4"])}
        >
          Select all
        </button>
        <button data-testid="clear" onClick={() => hook.clearSelection()}>
          Clear
        </button>
        <span data-testid="is-n1-selected">
          {hook.isSelected("n1") ? "true" : "false"}
        </span>
        <span data-testid="is-n2-selected">
          {hook.isSelected("n2") ? "true" : "false"}
        </span>
      </div>
    );
  }

  it("starts with empty selection", () => {
    render(<TestHarness />);
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("toggles single selection on and off", () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId("toggle-n1"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("is-n1-selected").textContent).toBe("true");

    fireEvent.click(screen.getByTestId("toggle-n1"));
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("is-n1-selected").textContent).toBe("false");
  });

  it("supports multiple independent selections", () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId("toggle-n1"));
    fireEvent.click(screen.getByTestId("toggle-n2"));
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("is-n1-selected").textContent).toBe("true");
    expect(screen.getByTestId("is-n2-selected").textContent).toBe("true");
  });

  it("rangeSelect selects multiple ids", () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId("range"));
    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("selectAll selects all given ids", () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId("select-all"));
    expect(screen.getByTestId("count").textContent).toBe("4");
  });

  it("clearSelection resets to zero", () => {
    render(<TestHarness />);
    fireEvent.click(screen.getByTestId("select-all"));
    fireEvent.click(screen.getByTestId("clear"));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});

// ── Tests: NotificationList (integration) ─────────────────────────────────────

describe("NotificationList", () => {
  const mockOnMarkAsRead = vi.fn();
  const mockOnArchive = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setup(notifications = defaultNotifications) {
    return render(
      <NotificationList
        notifications={notifications}
        onMarkAsRead={mockOnMarkAsRead}
        onArchive={mockOnArchive}
      />,
    );
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  it("renders all notification items", () => {
    setup();
    expect(screen.getByText("Slot booked")).toBeInTheDocument();
    expect(screen.getByText("Payout completed")).toBeInTheDocument();
    expect(screen.getByText("Confirmation needed")).toBeInTheDocument();
    expect(screen.getByText("Escrow failed")).toBeInTheDocument();
  });

  it("renders timestamps for each notification", () => {
    setup();
    expect(screen.getByText("2 min ago")).toBeInTheDocument();
    expect(screen.getByText("1 hour ago")).toBeInTheDocument();
  });

  it("renders select-all checkbox", () => {
    setup();
    expect(
      screen.getByLabelText("Select all notifications"),
    ).toBeInTheDocument();
  });

  it("has proper ARIA attributes on the list", () => {
    setup();
    const list = screen.getByRole("group", { name: "Notifications list" });
    expect(list).toHaveAttribute("aria-multiselectable", "true");
  });

  it("each notification item has role=option and aria-selected", () => {
    setup();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4);
    options.forEach((opt) => {
      expect(opt).toHaveAttribute("aria-selected", "false");
      expect(opt).toHaveAttribute("data-index");
    });
  });

  it("renders description text when present", () => {
    setup();
    expect(screen.getByText("A slot was booked.")).toBeInTheDocument();
  });

  // ── Selection via checkbox click ─────────────────────────────────────────

  it("toggles selection when clicking a notification row", () => {
    setup();
    const firstOption = screen.getAllByRole("option")[0];

    fireEvent.click(firstOption);
    expect(firstOption).toHaveAttribute("aria-selected", "true");

    fireEvent.click(firstOption);
    expect(firstOption).toHaveAttribute("aria-selected", "false");
  });

  it("selects multiple items by clicking each row", () => {
    setup();
    const options = screen.getAllByRole("option");

    fireEvent.click(options[0]);
    fireEvent.click(options[2]);

    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[2]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "false");
  });

  it("shows selected count in the header when items are selected", () => {
    setup();
    expect(
      screen.queryByText(/1 selected/),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("option")[0]);

    const countEls = screen.getAllByText(/1 selected/);
    expect(countEls.length).toBeGreaterThanOrEqual(1);
  });

  // ── Select-all ───────────────────────────────────────────────────────────

  it("select-all selects all items", () => {
    setup();
    fireEvent.click(screen.getByLabelText("Select all notifications"));
    const options = screen.getAllByRole("option");
    options.forEach((opt) => {
      expect(opt).toHaveAttribute("aria-selected", "true");
    });
    expect(screen.getByLabelText("Deselect all notifications")).toBeInTheDocument();
  });

  it("deselect-all deselects all items", () => {
    setup();
    fireEvent.click(screen.getByLabelText("Select all notifications"));
    fireEvent.click(screen.getByLabelText("Deselect all notifications"));
    const options = screen.getAllByRole("option");
    options.forEach((opt) => {
      expect(opt).toHaveAttribute("aria-selected", "false");
    });
  });

  // ── Keyboard: Space to toggle ────────────────────────────────────────────

  it("toggles selection with Space key on focused item", () => {
    setup();
    const firstOption = screen.getAllByRole("option")[0];
    firstOption.focus();

    fireEvent.keyDown(firstOption, { key: " " });
    expect(firstOption).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(firstOption, { key: " " });
    expect(firstOption).toHaveAttribute("aria-selected", "false");
  });

  // ── Keyboard: Ctrl+A to select all ───────────────────────────────────────

  it("selects all with Ctrl+A on a focused item", () => {
    setup();
    const firstOption = screen.getAllByRole("option")[0];
    firstOption.focus();

    fireEvent.keyDown(firstOption, { key: "a", ctrlKey: true, bubbles: true });

    const options = screen.getAllByRole("option");
    options.forEach((opt) => {
      expect(opt).toHaveAttribute("aria-selected", "true");
    });
  });

  // ── Keyboard: Escape to clear ────────────────────────────────────────────

  it("clears selection with Escape on a focused item", () => {
    setup();
    fireEvent.click(screen.getAllByRole("option")[0]);
    expect(screen.getAllByRole("option")[0]).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const firstOption = screen.getAllByRole("option")[0];
    firstOption.focus();
    fireEvent.keyDown(firstOption, { key: "Escape", bubbles: true });

    const options = screen.getAllByRole("option");
    options.forEach((opt) => {
      expect(opt).toHaveAttribute("aria-selected", "false");
    });
  });

  // ── Bulk action: Mark as Read ────────────────────────────────────────────

  it("calls onMarkAsRead with selected ids", () => {
    setup();
    fireEvent.click(screen.getAllByRole("option")[0]);
    fireEvent.click(screen.getAllByRole("option")[1]);

    fireEvent.click(screen.getByRole("button", { name: /mark.*as.*read/i }));
    expect(mockOnMarkAsRead).toHaveBeenCalledWith(["n1", "n2"]);
  });

  it("marks items as read locally and clears selection", () => {
    setup();
    const options = screen.getAllByRole("option");

    fireEvent.click(options[0]);
    fireEvent.click(
      screen.getByRole("button", { name: /mark.*as.*read/i }),
    );

    expect(screen.queryByRole("toolbar", { name: "Bulk actions" })).not.toBeInTheDocument();
  });

  // ── Bulk action: Archive ─────────────────────────────────────────────────

  it("calls onArchive with selected ids", () => {
    setup();
    fireEvent.click(screen.getAllByRole("option")[0]);

    fireEvent.click(screen.getByRole("button", { name: /archive/i }));
    expect(mockOnArchive).toHaveBeenCalledWith(["n1"]);
  });

  it("removes archived items from the list", () => {
    setup();
    const options = screen.getAllByRole("option");

    fireEvent.click(options[0]);
    fireEvent.click(screen.getByRole("button", { name: /archive/i }));

    expect(screen.queryByText("Slot booked")).not.toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  // ── Bulk Action Bar visibility ───────────────────────────────────────────

  it("bulk action bar is not visible when nothing is selected", () => {
    setup();
    expect(
      screen.queryByRole("toolbar", { name: "Bulk actions" }),
    ).not.toBeInTheDocument();
  });

  it("bulk action bar appears when at least one item is selected", () => {
    setup();
    fireEvent.click(screen.getAllByRole("option")[0]);
    expect(
      screen.getByRole("toolbar", { name: "Bulk actions" }),
    ).toBeInTheDocument();
  });

  it("bulk action bar shows correct selected count", () => {
    setup();
    fireEvent.click(screen.getAllByRole("option")[0]);
    fireEvent.click(screen.getAllByRole("option")[1]);

    const countElements = screen.getAllByText("2 selected");
    expect(countElements.length).toBeGreaterThanOrEqual(1);
    const visibleCounts = countElements.filter(
      (el) => !el.classList.contains("sr-only"),
    );
    expect(visibleCounts.length).toBeGreaterThanOrEqual(1);
  });

  it("bulk action bar hides after performing archive", () => {
    setup();
    fireEvent.click(screen.getAllByRole("option")[0]);
    expect(
      screen.getByRole("toolbar", { name: "Bulk actions" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /archive/i }));
    expect(
      screen.queryByRole("toolbar", { name: "Bulk actions" }),
    ).not.toBeInTheDocument();
  });

  // ── Empty state ──────────────────────────────────────────────────────────

  it("renders empty state when no notifications", async () => {
    setup([]);
    expect(screen.getByText("All caught up")).toBeInTheDocument();
  });

  it("shows guidance text in empty state", () => {
    setup([]);
    expect(
      screen.getByText("You have no notifications at the moment."),
    ).toBeInTheDocument();
  });

  it("does not render list controls in empty state", () => {
    setup([]);
    expect(
      screen.queryByRole("group", { name: "Notifications list" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Select all notifications"),
    ).not.toBeInTheDocument();
  });

  // ── Mixed selection state ────────────────────────────────────────────────

  it("handles select-all then partial deselection", () => {
    setup();
    fireEvent.click(screen.getByLabelText("Select all notifications"));

    fireEvent.click(screen.getAllByRole("option")[0]);

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[2]).toHaveAttribute("aria-selected", "true");
    expect(options[3]).toHaveAttribute("aria-selected", "true");
  });

  // ── Rapid selection ──────────────────────────────────────────────────────

  it("handles rapid selection without errors", () => {
    setup();
    const options = screen.getAllByRole("option");

    for (let i = 0; i < 10; i++) {
      fireEvent.click(options[0]);
    }
    expect(options[0]).toHaveAttribute("aria-selected", "false");

    fireEvent.click(options[0]);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  // ── Accessibility checks ─────────────────────────────────────────────────

  it("checkbox inputs have proper aria-labels", () => {
    setup();
    const checkboxes = screen.getAllByLabelText(/select notification/i);
    expect(checkboxes).toHaveLength(4);
    expect(checkboxes[0]).toHaveAttribute(
      "aria-label",
      "Select notification: Slot booked",
    );
  });

  it("bulk action buttons have descriptive aria-labels", () => {
    setup();
    fireEvent.click(screen.getAllByRole("option")[0]);
    fireEvent.click(screen.getAllByRole("option")[1]);

    const markReadBtn = screen.getByRole("button", {
      name: /mark 2 notifications as read/i,
    });
    expect(markReadBtn).toBeInTheDocument();

    const archiveBtn = screen.getByRole("button", {
      name: /archive 2 notifications/i,
    });
    expect(archiveBtn).toBeInTheDocument();
  });

  it("bulk action buttons use singular label for single item", () => {
    setup();
    fireEvent.click(screen.getAllByRole("option")[0]);

    expect(
      screen.getByRole("button", {
        name: /mark 1 notification as read/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /archive 1 notification/i,
      }),
    ).toBeInTheDocument();
  });

  // ── Read/unread visual distinction ───────────────────────────────────────

  it("unread items have semibold font weight", () => {
    setup();
    const title = screen.getByText("Slot booked");
    expect(title.className).toMatch(/font-semibold/);
  });

  it("read items have normal font weight", () => {
    setup();
    const title = screen.getByText("Confirmation needed");
    expect(title.className).not.toMatch(/font-semibold/);
  });
});
