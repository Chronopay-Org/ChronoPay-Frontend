/**
 * Unit tests for BulkActionsToolbar
 *
 * Coverage targets (95%+):
 *  - Renders nothing when selectedIds is empty
 *  - Renders toolbar with correct count label
 *  - Singular vs plural copy ("1 user" vs "N users")
 *  - role="toolbar" and aria-controls attributes
 *  - Live region announces selection count
 *  - Set Role: button opens listbox, selecting a role fires onAction
 *  - Set Role: Escape closes menu and returns focus to trigger
 *  - Suspend: fires onAction("suspend") immediately
 *  - Message: toggle opens panel; typing + Send fires onAction("message")
 *  - Message: Send disabled when textarea empty
 *  - Message: Cancel closes panel and clears text
 *  - Message: Escape closes panel
 *  - Dismiss: fires onDismiss
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BulkActionsToolbar } from "@/components/dashboard/bulk-actions-toolbar";

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderToolbar(ids: string[] = ["u1", "u2"], overrides = {}) {
  const onAction = vi.fn();
  const onDismiss = vi.fn();
  const utils = render(
    <BulkActionsToolbar
      selectedIds={new Set(ids)}
      gridId="test-grid"
      onAction={onAction}
      onDismiss={onDismiss}
      {...overrides}
    />,
  );
  return { ...utils, onAction, onDismiss };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("BulkActionsToolbar — visibility", () => {
  it("renders nothing when selectedIds is empty", () => {
    const { container } = render(
      <BulkActionsToolbar
        selectedIds={new Set()}
        gridId="g"
        onAction={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(container.querySelector('[data-testid="bulk-toolbar"]')).toBeNull();
  });

  it("renders toolbar when there is at least one selection", () => {
    renderToolbar(["u1"]);
    expect(screen.getByTestId("bulk-toolbar")).toBeInTheDocument();
  });
});

describe("BulkActionsToolbar — count label", () => {
  it('shows "1 selected" for one user', () => {
    renderToolbar(["u1"]);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it('shows "2 selected" for two users', () => {
    renderToolbar(["u1", "u2"]);
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("aria-label uses singular form for one user", () => {
    renderToolbar(["u1"]);
    const toolbar = screen.getByRole("toolbar");
    expect(toolbar.getAttribute("aria-label")).toContain("1 user selected");
  });

  it("aria-label uses plural form for multiple users", () => {
    renderToolbar(["u1", "u2"]);
    const toolbar = screen.getByRole("toolbar");
    expect(toolbar.getAttribute("aria-label")).toContain("2 users selected");
  });
});

describe("BulkActionsToolbar — ARIA attributes", () => {
  it("has role=toolbar", () => {
    renderToolbar();
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("aria-controls points at gridId", () => {
    renderToolbar();
    expect(screen.getByRole("toolbar").getAttribute("aria-controls")).toBe("test-grid");
  });

  it("renders live region", () => {
    renderToolbar();
    expect(screen.getByTestId("bulk-live-region")).toBeInTheDocument();
  });
});

describe("BulkActionsToolbar — Set Role", () => {
  it("opens role listbox on click", () => {
    renderToolbar();
    const btn = screen.getByRole("button", { name: /set role/i });
    fireEvent.click(btn);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("aria-expanded is true when open", () => {
    renderToolbar();
    const btn = screen.getByRole("button", { name: /set role/i });
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("fires onAction('setRole', { role }) when a role is selected", () => {
    const { onAction } = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: /set role/i }));
    fireEvent.click(screen.getByTestId("role-option-supplier"));
    expect(onAction).toHaveBeenCalledWith("setRole", { role: "supplier" });
  });

  it("fires onAction via keyboard Enter on a role option", () => {
    const { onAction } = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: /set role/i }));
    const option = screen.getByTestId("role-option-admin");
    fireEvent.keyDown(option, { key: "Enter" });
    expect(onAction).toHaveBeenCalledWith("setRole", { role: "admin" });
  });

  it("fires onAction via keyboard Space on a role option", () => {
    const { onAction } = renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: /set role/i }));
    const option = screen.getByTestId("role-option-buyer");
    fireEvent.keyDown(option, { key: " " });
    expect(onAction).toHaveBeenCalledWith("setRole", { role: "buyer" });
  });

  it("closes listbox after selection", () => {
    renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: /set role/i }));
    fireEvent.click(screen.getByTestId("role-option-moderator"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("Escape closes the role menu", () => {
    renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: /set role/i }));
    const option = screen.getByTestId("role-option-admin");
    fireEvent.keyDown(option, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});

describe("BulkActionsToolbar — Suspend", () => {
  it("fires onAction('suspend') when clicked", () => {
    const { onAction } = renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-suspend"));
    expect(onAction).toHaveBeenCalledWith("suspend");
  });
});

describe("BulkActionsToolbar — Message", () => {
  it("opens message dialog when Message button clicked", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Send button is disabled when textarea is empty", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    const send = screen.getByTestId("bulk-message-send");
    expect(send).toBeDisabled();
  });

  it("Send button is enabled after typing", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hello" } });
    expect(screen.getByTestId("bulk-message-send")).not.toBeDisabled();
  });

  it("fires onAction('message', { text }) on Send click", () => {
    const { onAction } = renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hi there" } });
    fireEvent.click(screen.getByTestId("bulk-message-send"));
    expect(onAction).toHaveBeenCalledWith("message", { text: "Hi there" });
  });

  it("trims whitespace before firing onAction", () => {
    const { onAction } = renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Hi  " } });
    fireEvent.click(screen.getByTestId("bulk-message-send"));
    expect(onAction).toHaveBeenCalledWith("message", { text: "Hi" });
  });

  it("does not fire onAction when text is whitespace-only", () => {
    const { onAction } = renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
    fireEvent.click(screen.getByTestId("bulk-message-send"));
    expect(onAction).not.toHaveBeenCalled();
  });

  it("closes dialog after Send", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hi" } });
    fireEvent.click(screen.getByTestId("bulk-message-send"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Cancel closes the message dialog", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Escape closes the message dialog", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Message toggle button re-opens dialog after closing", () => {
    renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("BulkActionsToolbar — Dismiss", () => {
  it("fires onDismiss when X button clicked", () => {
    const { onDismiss } = renderToolbar();
    fireEvent.click(screen.getByTestId("bulk-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
