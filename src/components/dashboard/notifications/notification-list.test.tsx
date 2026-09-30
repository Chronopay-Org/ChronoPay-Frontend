/**
 * Behavior tests for NotificationList (the list container).
 *
 * Rendered output is dominated by child components (NotificationItem,
 * BulkActionBar, EmptyStateCard) whose internals have their own dedicated
 * suites. These tests therefore target NotificationList's own contract:
 * the empty state, the select-all control, the live-region announcements,
 * the toolbar wiring, and the keyboard-driven selection behavior it
 * implements on the <ul> container.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { NotificationList } from "./notification-list";
import { notifications } from "./mock-data";
import type { NotificationItem as NotificationItemType } from "./types";

// NotificationList pulls in EmptyStateCard, which pulls in the unrelated
// "@/components/dashboard" barrel. Follow the repo convention (see
// index.test.ts) and stub it so the empty state can still be asserted
// without dragging unrelated code into this suite.
vi.mock("@/app/components/empty-state-card", () => ({
  EmptyStateCard: ({
    eyebrow,
    title,
    description,
  }: {
    eyebrow: string;
    title: string;
    description: string;
  }) => (
    <section>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  ),
}));

// The BulkActionBar child animates via framer-motion; under happy-dom its
// mount/unmount produces nondeterministic "AbortError: The animation was
// canceled" rejections that fail unrelated tests. The animation itself is not
// NotificationList behavior, so stub it for determinism.
vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: () => (props: Record<string, unknown> & { children?: ReactNode }) => {
    // Strip animation-only props so they never reach the DOM.
    const skip = new Set(["initial", "animate", "transition", "exit"]);
    const rest: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (!skip.has(key)) rest[key] = props[key];
    }
    return <div {...rest} />;
  } }),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const items: NotificationItemType[] = notifications;

const unreadItem = (id: string): NotificationItemType => ({
  id,
  title: `Unread ${id}`,
  timestamp: "just now",
  read: false,
  tone: "info",
});

function renderList(props: Partial<Parameters<typeof NotificationList>[0]> = {}) {
  const onMarkAsRead = vi.fn();
  const onArchive = vi.fn();
  render(
    <NotificationList
      notifications={props.notifications ?? items}
      onMarkAsRead={props.onMarkAsRead ?? onMarkAsRead}
      onArchive={props.onArchive ?? onArchive}
    />,
  );
  return { onMarkAsRead, onArchive };
}

const getList = () => screen.getByRole("group", { name: "Notifications list" });
const listOptions = () => within(getList()).getAllByRole("option");
const selectAllBox = () =>
  screen.getByRole("checkbox", { name: /notifications/i });

// ── Tests ────────────────────────────────────────────────────────────────────

describe("NotificationList: rendering", () => {
  it("renders one option per notification inside the labeled group", () => {
    renderList();

    const list = getList();
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute("aria-multiselectable", "true");
    expect(within(list).getAllByRole("option")).toHaveLength(items.length);
  });

  it("renders each notification's title", () => {
    renderList();

    for (const item of items) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
    }
  });

  it("renders the empty state instead of the list when there are no notifications", () => {
    renderList({ notifications: [] });

    expect(screen.queryByRole("group", { name: "Notifications list" })).not.toBeInTheDocument();
    expect(screen.getByText("All caught up")).toBeInTheDocument();
    expect(screen.getByText("You have no notifications at the moment.")).toBeInTheDocument();
  });

  it("announces the selection count through the live region", () => {
    renderList();

    const live = screen.getByRole("status");
    expect(live).toHaveTextContent("No notifications selected");
  });
});

describe("NotificationList: selection via checkboxes", () => {
  it("starts with nothing selected and the select-all control unchecked", () => {
    renderList();

    expect(selectAllBox()).not.toBeChecked();
    expect(screen.queryByRole("toolbar", { name: "Bulk actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No notifications selected");
  });

  it("toggling a single item's checkbox announces '1 notification selected' and shows the toolbar", async () => {
    const user = userEvent.setup();
    renderList();

    const firstBox = within(listOptions()[0]).getByRole("checkbox");
    await user.click(firstBox);

    expect(screen.getByRole("status")).toHaveTextContent("1 notification selected");
    expect(screen.getByRole("toolbar", { name: "Bulk actions" })).toBeInTheDocument();
  });

  it("selecting all items via their checkboxes makes select-all checked", async () => {
    const user = userEvent.setup();
    renderList();

    for (const option of listOptions()) {
      await user.click(within(option).getByRole("checkbox"));
    }

    expect(selectAllBox()).toBeChecked();
    expect(selectAllBox()).toHaveAccessibleName("Deselect all notifications");
  });

  it("select-all checks every box and announces the full count", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(selectAllBox());

    expect(selectAllBox()).toBeChecked();
    for (const option of listOptions()) {
      expect(within(option).getByRole("checkbox")).toBeChecked();
    }
    expect(screen.getByRole("status")).toHaveTextContent(
      `${items.length} notifications selected`,
    );
  });

  it("clicking select-all again deselects everything", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(selectAllBox());
    await user.click(selectAllBox());

    expect(selectAllBox()).not.toBeChecked();
    for (const option of listOptions()) {
      expect(within(option).getByRole("checkbox")).not.toBeChecked();
    }
    expect(screen.getByRole("status")).toHaveTextContent("No notifications selected");
    expect(screen.queryByRole("toolbar", { name: "Bulk actions" })).not.toBeInTheDocument();
  });

  it("shows select-all in an indeterminate state when only some items are selected", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(within(listOptions()[0]).getByRole("checkbox"));

    const box = selectAllBox();
    expect(box.checked).toBe(false);
    expect((box as HTMLInputElement).indeterminate).toBe(true);
  });
});

describe("NotificationList: bulk actions", () => {
  it("mark-as-read flips the selected items to read, calls back, and clears the selection", async () => {
    const user = userEvent.setup();
    const { onMarkAsRead } = renderList();

    await user.click(selectAllBox());
    await user.click(
      screen.getByRole("button", { name: /mark .* as read/i }),
    );

    expect(onMarkAsRead).toHaveBeenCalledTimes(1);
    expect(onMarkAsRead).toHaveBeenCalledWith(items.map((i) => i.id));

    // Read styling from NotificationItem: unread titles are white/semibold,
    // read titles use text-slate-300.
    for (const item of items) {
      expect(screen.getByText(item.title)).toHaveClass("text-slate-300");
    }
    expect(screen.queryByRole("toolbar", { name: "Bulk actions" })).not.toBeInTheDocument();
  });

  it("mark-as-read only affects the selected subset", async () => {
    const user = userEvent.setup();
    const { onMarkAsRead } = renderList();

    await user.click(within(listOptions()[1]).getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /mark .* as read/i }));

    expect(onMarkAsRead).toHaveBeenCalledWith([items[1].id]);
    expect(screen.getByText(items[1].title)).toHaveClass("text-slate-300");
    expect(screen.getByText(items[0].title)).not.toHaveClass("text-slate-300");
  });

  it("archive removes the selected items, calls back, and clears the selection", async () => {
    const user = userEvent.setup();
    const { onArchive } = renderList();

    await user.click(within(listOptions()[0]).getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /archive/i }));

    expect(onArchive).toHaveBeenCalledWith([items[0].id]);
    expect(screen.queryByText(items[0].title)).not.toBeInTheDocument();
    expect(within(getList()).getAllByRole("option")).toHaveLength(items.length - 1);
    expect(screen.queryByRole("toolbar", { name: "Bulk actions" })).not.toBeInTheDocument();
  });

  it("archive drops the toolbar once the list is emptied", async () => {
    const user = userEvent.setup();
    const single: NotificationItemType[] = [unreadItem("only-1")];
    const { onArchive } = renderList({ notifications: single });

    await user.click(within(listOptions()[0]).getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /archive/i }));

    expect(onArchive).toHaveBeenCalledWith(["only-1"]);
    expect(screen.queryByRole("group", { name: "Notifications list" })).not.toBeInTheDocument();
    expect(screen.getByText("All caught up")).toBeInTheDocument();
  });

  it("does not render a toolbar while nothing is selected", () => {
    renderList();

    expect(screen.queryByRole("toolbar", { name: "Bulk actions" })).not.toBeInTheDocument();
  });
});

describe("NotificationList: keyboard interaction on the container", () => {
  it("Escape clears the selection", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(within(listOptions()[0]).getByRole("checkbox"));
    expect(screen.getByRole("toolbar", { name: "Bulk actions" })).toBeInTheDocument();

    listOptions()[0].focus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("toolbar", { name: "Bulk actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No notifications selected");
  });

  it("Ctrl+A selects all notifications", async () => {
    const user = userEvent.setup();
    renderList();

    listOptions()[0].focus();
    await user.keyboard("{Control>}a");

    expect(selectAllBox()).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(
      `${items.length} notifications selected`,
    );
  });

  it("Meta+A (macOS select-all) selects all notifications", async () => {
    const user = userEvent.setup();
    renderList();

    listOptions()[0].focus();
    await user.keyboard("{Meta>}a");

    expect(selectAllBox()).toBeChecked();
  });

  it("Shift+ArrowDown extends the selection across the focus range", async () => {
    const user = userEvent.setup();
    renderList();

    listOptions()[0].focus();
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

    expect(screen.getByRole("status")).toHaveTextContent("2 notifications selected");
    expect(within(listOptions()[0]).getByRole("checkbox")).toBeChecked();
    expect(within(listOptions()[1]).getByRole("checkbox")).toBeChecked();
    expect(within(listOptions()[2]).getByRole("checkbox")).not.toBeChecked();
  });

  it("Shift+ArrowUp extends the selection backwards", async () => {
    const user = userEvent.setup();
    renderList();

    const options = listOptions();
    options[2].focus();
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");

    expect(screen.getByRole("status")).toHaveTextContent("2 notifications selected");
    expect(within(options[1]).getByRole("checkbox")).toBeChecked();
    expect(within(options[2]).getByRole("checkbox")).toBeChecked();
  });

  it("Shift+ArrowDown is a no-op at the end of the list", async () => {
    const user = userEvent.setup();
    renderList();

    const options = listOptions();
    options[options.length - 1].focus();
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");

    expect(screen.getByRole("status")).toHaveTextContent("No notifications selected");
  });

  it("keyboard shortcuts do nothing when focus is outside the list", async () => {
    const user = userEvent.setup();
    renderList();

    await user.keyboard("{Control>}a");

    expect(selectAllBox()).not.toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("No notifications selected");
  });
});

describe("NotificationList: optional callbacks", () => {
  it("tolerates missing onMarkAsRead/onArchive handlers without crashing", async () => {
    const user = userEvent.setup();
    render(<NotificationList notifications={items} />);

    await user.click(selectAllBox());
    await user.click(screen.getByRole("button", { name: /mark .* as read/i }));
    await user.click(selectAllBox());
    await user.click(screen.getByRole("button", { name: /archive/i }));

    expect(screen.getByText("All caught up")).toBeInTheDocument();
  });
});
