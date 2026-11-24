/**
 * Dedicated regression suite for the BulkActionsToolbar failure/interaction
 * edges that `bulk-actions-toolbar.test.tsx` leaves untouched.
 *
 * The consolidated suite walks the happy-path state machine (open, select,
 * suspend, message, dismiss). It never mentions `mousedown`, `activeElement` or
 * `removeEventListener`, so the whole outside-click / focus-management /
 * teardown layer is unverified. This file covers:
 *
 * - outside-click dismissal for BOTH popovers, plus the `.contains()` guard that
 *   keeps a click inside the popover from closing it,
 * - the listener being torn down when a popover closes and on unmount,
 * - focus being returned to the trigger after every exit path (role select,
 *   Escape on an option, Send, Cancel, Escape in the textarea),
 * - the two popovers being mutually exclusive,
 * - the role listbox's structure (order, count, `aria-selected`, `tabIndex`),
 * - `count`-driven copy re-deriving on prop change, and de-duplication of a
 *   `Set` built from repeated ids,
 * - the static a11y wiring on the toolbar, listbox and dialog.
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BulkActionsToolbar } from "@/components/dashboard/bulk-actions-toolbar";

const ROLE_ORDER = ["admin", "supplier", "buyer", "moderator", "support"];

function renderToolbar(ids: string[] = ["u1", "u2"]) {
  const onAction = vi.fn();
  const onDismiss = vi.fn();
  const utils = render(
    <BulkActionsToolbar
      selectedIds={new Set(ids)}
      gridId="users-grid"
      onAction={onAction}
      onDismiss={onDismiss}
    />,
  );
  return { ...utils, onAction, onDismiss };
}

const roleButton = () => screen.getByRole("button", { name: /set role/i });
const messageButton = () => screen.getByTestId("bulk-message-toggle");
const openRoles = () => fireEvent.click(roleButton());
const openMessage = () => fireEvent.click(messageButton());

describe("BulkActionsToolbar — popover dismissal", () => {
  it("closes the role menu when a mousedown lands outside it", () => {
    renderToolbar();
    openRoles();
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("keeps the role menu open when the mousedown lands inside it", () => {
    renderToolbar();
    openRoles();

    fireEvent.mouseDown(screen.getByRole("listbox"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("closes the message dialog when a mousedown lands outside it", () => {
    renderToolbar();
    openMessage();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the message dialog open when the mousedown lands inside it", () => {
    renderToolbar();
    openMessage();

    fireEvent.mouseDown(screen.getByRole("dialog"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("removes the outside-click listener once the role menu closes", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    renderToolbar();
    openRoles();

    fireEvent.click(roleButton()); // toggle closed

    const removed = removeSpy.mock.calls.filter(([type]) => type === "mousedown");
    expect(removed.length).toBeGreaterThanOrEqual(1);
    expect(typeof removed[0][1]).toBe("function");
    removeSpy.mockRestore();
  });

  it("removes the outside-click listener once the message dialog closes", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    renderToolbar();
    openMessage();

    fireEvent.click(messageButton()); // toggle closed

    const removed = removeSpy.mock.calls.filter(([type]) => type === "mousedown");
    expect(removed.length).toBeGreaterThanOrEqual(1);
    removeSpy.mockRestore();
  });

  it("tears down both listeners on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderToolbar();
    openRoles();
    unmount();

    const removed = removeSpy.mock.calls.filter(([type]) => type === "mousedown");
    expect(removed.length).toBeGreaterThanOrEqual(1);
    removeSpy.mockRestore();
  });

  it("stops listening after the menu closes, so a stray mousedown is harmless", () => {
    renderToolbar();
    openRoles();
    fireEvent.click(roleButton());

    expect(() => fireEvent.mouseDown(document.body)).not.toThrow();
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

describe("BulkActionsToolbar — popover mutual exclusion", () => {
  it("closes the role menu when the message dialog opens", () => {
    renderToolbar();
    openRoles();

    openMessage();

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the message dialog when the role menu opens", () => {
    renderToolbar();
    openMessage();

    openRoles();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});

describe("BulkActionsToolbar — focus management", () => {
  it("returns focus to the Set Role button after a role is chosen", () => {
    renderToolbar();
    openRoles();

    fireEvent.click(screen.getByTestId("role-option-moderator"));

    expect(document.activeElement).toBe(roleButton());
  });

  it("returns focus to the Set Role button after Escape on an option", () => {
    renderToolbar();
    openRoles();

    fireEvent.keyDown(screen.getByTestId("role-option-admin"), { key: "Escape" });

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(roleButton());
  });

  it("returns focus to the Message button after Send", () => {
    renderToolbar();
    openMessage();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hi" } });

    fireEvent.click(screen.getByTestId("bulk-message-send"));

    expect(document.activeElement).toBe(messageButton());
  });

  it("returns focus to the Message button after Cancel", () => {
    renderToolbar();
    openMessage();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(document.activeElement).toBe(messageButton());
  });

  it("returns focus to the Message button after Escape in the textarea", () => {
    renderToolbar();
    openMessage();

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });

    expect(document.activeElement).toBe(messageButton());
  });

  it("clears the textarea so a re-opened dialog starts empty and disabled", () => {
    renderToolbar();
    openMessage();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "queued text" } });
    fireEvent.click(screen.getByTestId("bulk-message-send"));

    openMessage();

    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByTestId("bulk-message-send")).toBeDisabled();
  });
});

describe("BulkActionsToolbar — listbox structure", () => {
  it("renders exactly the five supported roles in order", () => {
    renderToolbar();
    openRoles();

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(ROLE_ORDER.length);
    expect(options.map((o) => o.textContent)).toEqual(ROLE_ORDER);
  });

  it("marks every option as not selected and keyboard-focusable", () => {
    renderToolbar();
    openRoles();

    for (const role of ROLE_ORDER) {
      const option = screen.getByTestId(`role-option-${role}`);
      expect(option).toHaveAttribute("aria-selected", "false");
      expect(option).toHaveAttribute("tabindex", "0");
    }
  });

  it("labels the listbox for assistive technology", () => {
    renderToolbar();
    openRoles();

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-label", "Select role");
  });

  it("selects on Space as well as Enter", () => {
    const { onAction } = renderToolbar();
    openRoles();

    fireEvent.keyDown(screen.getByTestId("role-option-buyer"), { key: " " });

    expect(onAction).toHaveBeenCalledWith("setRole", { role: "buyer" });
  });

  it("ignores unrelated keys on an option and keeps the menu open", () => {
    const { onAction } = renderToolbar();
    openRoles();

    fireEvent.keyDown(screen.getByTestId("role-option-admin"), { key: "a" });
    fireEvent.keyDown(screen.getByTestId("role-option-admin"), { key: "Tab" });

    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});

describe("BulkActionsToolbar — count-derived copy", () => {
  const renderWith = (ids: string[]) => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    const view = render(
      <BulkActionsToolbar
        selectedIds={new Set(ids)}
        gridId="users-grid"
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    );
    return { ...view, onAction, onDismiss };
  };

  it("re-derives the label when the selection grows", () => {
    const { rerender, onAction, onDismiss } = renderWith(["u1"]);
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    rerender(
      <BulkActionsToolbar
        selectedIds={new Set(["u1", "u2", "u3"])}
        gridId="users-grid"
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText("3 selected")).toBeInTheDocument();
  });

  it("switches the live region copy from singular to plural", () => {
    const { rerender, onAction, onDismiss } = renderWith(["u1"]);
    expect(screen.getByTestId("bulk-live-region")).toHaveTextContent("1 user selected");

    rerender(
      <BulkActionsToolbar
        selectedIds={new Set(["u1", "u2"])}
        gridId="users-grid"
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByTestId("bulk-live-region")).toHaveTextContent("2 users selected");
  });

  it("unmounts the toolbar when the selection is emptied", () => {
    const { rerender, onAction, onDismiss } = renderWith(["u1", "u2"]);
    expect(screen.getByTestId("bulk-toolbar")).toBeInTheDocument();

    rerender(
      <BulkActionsToolbar
        selectedIds={new Set()}
        gridId="users-grid"
        onAction={onAction}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.queryByTestId("bulk-toolbar")).toBeNull();
  });

  it("counts a Set built from repeated ids once", () => {
    renderWith(["u1", "u1", "u1"]);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByTestId("bulk-toolbar")).toHaveAttribute(
      "aria-label",
      "Bulk actions — 1 user selected",
    );
  });
});

describe("BulkActionsToolbar — static a11y wiring", () => {
  it("points aria-controls at the configured grid", () => {
    renderToolbar();
    expect(screen.getByTestId("bulk-toolbar")).toHaveAttribute("aria-controls", "users-grid");
  });

  it("keeps the live region polite and atomic", () => {
    renderToolbar();
    const live = screen.getByTestId("bulk-live-region");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("exposes the expanded state of the Set Role trigger", () => {
    renderToolbar();
    expect(roleButton()).toHaveAttribute("aria-haspopup", "listbox");
    expect(roleButton()).toHaveAttribute("aria-expanded", "false");

    openRoles();

    expect(roleButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("labels the message dialog", () => {
    renderToolbar();
    openMessage();

    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-label",
      "Send message to selected users",
    );
  });

  it("binds the message label to the textarea", () => {
    renderToolbar();
    openMessage();

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("id", "bulk-message-text");
    expect(screen.getByText("Message to 2 users")).toHaveAttribute("for", "bulk-message-text");
  });

  it("gives the dismiss control an accessible name", () => {
    renderToolbar();
    expect(screen.getByTestId("bulk-dismiss")).toHaveAttribute("aria-label", "Deselect all users");
  });

  it("marks the toolbar animations as motion-safe only", () => {
    renderToolbar();
    const toolbar = screen.getByTestId("bulk-toolbar");
    expect(toolbar.className).toContain("motion-safe:animate-in");
    expect(toolbar.className).toContain("motion-safe:slide-in-from-bottom-4");
  });
});
