/**
 * Unit tests for AdminUserTable
 *
 * Coverage targets (95%+):
 *  - Renders correct number of rows
 *  - Shows "No users found" for empty list
 *  - Sticky-header column labels render
 *  - Select-all checkbox: checks all, unchecks all, indeterminate state
 *  - Individual row checkboxes select/deselect a row
 *  - aria-selected reflects selection state
 *  - Shift+click range selection
 *  - Ctrl+A selects all rows
 *  - Sort buttons: aria-sort attribute cycles correctly
 *  - Multi-column sort with Shift+click
 *  - BulkActionsToolbar appears when rows are selected
 *  - BulkActionsToolbar hidden when nothing selected
 *  - onBulkAction callback invoked with selected IDs
 *  - Footer summary shows row count and selection count
 *  - Verified badge renders for verified users
 *  - StatusChip renders for role and status columns
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AdminUserTable } from "@/components/dashboard/admin-user-table";
import type { AdminUser } from "@/components/dashboard/admin-user-types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USERS: AdminUser[] = [
  {
    id: "u1",
    name: "Alice",
    email: "alice@example.com",
    role: "admin",
    status: "active",
    joinedAt: "2023-01-01",
    lastSeen: "2024-07-01",
    payouts: 10,
    bookings: 5,
    verified: true,
  },
  {
    id: "u2",
    name: "Bob",
    email: "bob@example.com",
    role: "buyer",
    status: "suspended",
    joinedAt: "2023-06-15",
    lastSeen: "2024-06-01",
    payouts: 0,
    bookings: 2,
    verified: false,
  },
  {
    id: "u3",
    name: "Carol",
    email: "carol@example.com",
    role: "supplier",
    status: "pending",
    joinedAt: "2024-01-10",
    lastSeen: "2024-07-27",
    payouts: 50,
    bookings: 20,
    verified: true,
  },
];

function renderTable(users = USERS, onBulkAction = vi.fn()) {
  return render(<AdminUserTable users={users} onBulkAction={onBulkAction} />);
}

// ── Row rendering ─────────────────────────────────────────────────────────────

describe("AdminUserTable — rendering", () => {
  it("renders a row for each user", () => {
    renderTable();
    expect(screen.getByTestId("row-u1")).toBeInTheDocument();
    expect(screen.getByTestId("row-u2")).toBeInTheDocument();
    expect(screen.getByTestId("row-u3")).toBeInTheDocument();
  });

  it("shows 'No users found' when list is empty", () => {
    renderTable([]);
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it("renders all column header labels", () => {
    renderTable();
    for (const label of ["Name", "Email", "Role", "Status", "Joined", "Last seen", "Payouts", "Bookings", "Verified"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders user name in each row", () => {
    renderTable();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("renders verified checkmark for verified users", () => {
    renderTable();
    // The SVG for verified has aria-label="Verified"
    const badges = screen.getAllByRole("img", { name: /verified/i });
    expect(badges.length).toBeGreaterThan(0);
  });

  it("renders role StatusChip", () => {
    renderTable();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("buyer")).toBeInTheDocument();
  });

  it("renders status StatusChip", () => {
    renderTable();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("suspended")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("grid has role=grid with aria-label", () => {
    renderTable();
    expect(screen.getByRole("grid", { name: /user management/i })).toBeInTheDocument();
  });

  it("shows row count in footer", () => {
    renderTable();
    expect(screen.getByText(/3 users/i)).toBeInTheDocument();
  });
});

// ── Select-all checkbox ───────────────────────────────────────────────────────

describe("AdminUserTable — select-all checkbox", () => {
  it("is unchecked initially", () => {
    renderTable();
    const cb = screen.getByTestId("select-all-checkbox") as HTMLInputElement;
    expect(cb.checked).toBe(false);
    expect(cb.indeterminate).toBe(false);
  });

  it("selects all rows when clicked from unchecked state", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("select-all-checkbox"));
    for (const u of USERS) {
      const row = screen.getByTestId(`row-${u.id}`);
      expect(row.getAttribute("aria-selected")).toBe("true");
    }
  });

  it("deselects all rows when clicked from checked state", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("select-all-checkbox")); // select all
    fireEvent.click(screen.getByTestId("select-all-checkbox")); // deselect all
    for (const u of USERS) {
      const row = screen.getByTestId(`row-${u.id}`);
      expect(row.getAttribute("aria-selected")).toBe("false");
    }
  });

  it("is indeterminate when some (not all) rows selected", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("checkbox-u1")); // select one
    const cb = screen.getByTestId("select-all-checkbox") as HTMLInputElement;
    expect(cb.indeterminate).toBe(true);
    expect(cb.checked).toBe(false);
  });

  it("is fully checked when all rows selected individually", () => {
    renderTable();
    for (const u of USERS) fireEvent.click(screen.getByTestId(`checkbox-${u.id}`));
    const cb = screen.getByTestId("select-all-checkbox") as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });
});

// ── Row selection ─────────────────────────────────────────────────────────────

describe("AdminUserTable — row selection", () => {
  it("selects a row when its checkbox is clicked", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("checkbox-u2"));
    expect(screen.getByTestId("row-u2").getAttribute("aria-selected")).toBe("true");
  });

  it("deselects a row when its checkbox is clicked again", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("checkbox-u2"));
    fireEvent.click(screen.getByTestId("checkbox-u2"));
    expect(screen.getByTestId("row-u2").getAttribute("aria-selected")).toBe("false");
  });

  it("selects multiple individual rows", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("checkbox-u1"));
    fireEvent.click(screen.getByTestId("checkbox-u3"));
    expect(screen.getByTestId("row-u1").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByTestId("row-u2").getAttribute("aria-selected")).toBe("false");
    expect(screen.getByTestId("row-u3").getAttribute("aria-selected")).toBe("true");
  });

  it("Space key toggles row selection", () => {
    renderTable();
    const cb = screen.getByTestId("checkbox-u1");
    fireEvent.keyDown(cb, { key: " " });
    expect(screen.getByTestId("row-u1").getAttribute("aria-selected")).toBe("true");
  });

  it("shows selection count in footer", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("checkbox-u1"));
    fireEvent.click(screen.getByTestId("checkbox-u2"));
    // Footer paragraph contains "· 2 selected"
    expect(screen.getAllByText(/2 selected/i).length).toBeGreaterThan(0);
  });
});

// ── Range selection ───────────────────────────────────────────────────────────

describe("AdminUserTable — Shift+click range selection", () => {
  it("selects all rows between two clicked checkboxes", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("checkbox-u1")); // first anchor
    fireEvent.click(screen.getByTestId("checkbox-u3"), { shiftKey: true }); // range to u3
    for (const u of USERS) {
      expect(screen.getByTestId(`row-${u.id}`).getAttribute("aria-selected")).toBe("true");
    }
  });
});

// ── Ctrl+A ────────────────────────────────────────────────────────────────────

describe("AdminUserTable — Ctrl+A", () => {
  it("selects all rows", () => {
    renderTable();
    const grid = screen.getByTestId("admin-user-grid");
    fireEvent.keyDown(grid, { key: "a", ctrlKey: true });
    for (const u of USERS) {
      expect(screen.getByTestId(`row-${u.id}`).getAttribute("aria-selected")).toBe("true");
    }
  });

  it("deselects all when all are already selected", () => {
    renderTable();
    const grid = screen.getByTestId("admin-user-grid");
    fireEvent.keyDown(grid, { key: "a", ctrlKey: true }); // select all
    fireEvent.keyDown(grid, { key: "a", ctrlKey: true }); // deselect all
    for (const u of USERS) {
      expect(screen.getByTestId(`row-${u.id}`).getAttribute("aria-selected")).toBe("false");
    }
  });
});

// ── Sort ──────────────────────────────────────────────────────────────────────

describe("AdminUserTable — sort", () => {
  it("name column header has aria-sort=none initially", () => {
    renderTable();
    const btn = screen.getByTestId("sort-name");
    // The th wrapping it should have aria-sort
    const th = btn.closest("th");
    expect(th?.getAttribute("aria-sort")).toBe("none");
  });

  it("clicking sort-name cycles to ascending", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("sort-name"));
    const th = screen.getByTestId("sort-name").closest("th");
    expect(th?.getAttribute("aria-sort")).toBe("ascending");
  });

  it("clicking sort-name twice cycles to descending", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("sort-name"));
    fireEvent.click(screen.getByTestId("sort-name"));
    const th = screen.getByTestId("sort-name").closest("th");
    expect(th?.getAttribute("aria-sort")).toBe("descending");
  });

  it("clicking sort-name three times resets to none", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("sort-name"));
    fireEvent.click(screen.getByTestId("sort-name"));
    fireEvent.click(screen.getByTestId("sort-name"));
    const th = screen.getByTestId("sort-name").closest("th");
    expect(th?.getAttribute("aria-sort")).toBe("none");
  });

  it("Shift+click adds secondary sort column", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("sort-name")); // primary: name asc
    fireEvent.click(screen.getByTestId("sort-payouts"), { shiftKey: true }); // secondary: payouts asc
    const nameTh = screen.getByTestId("sort-name").closest("th");
    const payoutsTh = screen.getByTestId("sort-payouts").closest("th");
    expect(nameTh?.getAttribute("aria-sort")).toBe("ascending");
    expect(payoutsTh?.getAttribute("aria-sort")).toBe("ascending");
  });

  it("shows sort info in footer when sorted", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("sort-name"));
    expect(screen.getByText(/sorted by/i)).toBeInTheDocument();
  });
});

// ── Bulk-actions toolbar integration ─────────────────────────────────────────

describe("AdminUserTable — bulk-actions toolbar integration", () => {
  it("toolbar is hidden when nothing is selected", () => {
    renderTable();
    expect(screen.queryByTestId("bulk-toolbar")).toBeNull();
  });

  it("toolbar appears when a row is selected", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("checkbox-u1"));
    expect(screen.getByTestId("bulk-toolbar")).toBeInTheDocument();
  });

  it("toolbar disappears after dismiss", () => {
    renderTable();
    fireEvent.click(screen.getByTestId("checkbox-u1"));
    fireEvent.click(screen.getByTestId("bulk-dismiss"));
    expect(screen.queryByTestId("bulk-toolbar")).toBeNull();
  });

  it("onBulkAction is called with selected IDs on suspend", () => {
    const onBulkAction = vi.fn();
    render(<AdminUserTable users={USERS} onBulkAction={onBulkAction} />);
    fireEvent.click(screen.getByTestId("checkbox-u1"));
    fireEvent.click(screen.getByTestId("checkbox-u2"));
    fireEvent.click(screen.getByTestId("bulk-suspend"));
    expect(onBulkAction).toHaveBeenCalledWith(
      "suspend",
      expect.arrayContaining(["u1", "u2"]),
      undefined,
    );
  });

  it("onBulkAction is called with role payload on setRole", () => {
    const onBulkAction = vi.fn();
    render(<AdminUserTable users={USERS} onBulkAction={onBulkAction} />);
    fireEvent.click(screen.getByTestId("checkbox-u3"));
    fireEvent.click(screen.getByRole("button", { name: /set role/i }));
    fireEvent.click(screen.getByTestId("role-option-moderator"));
    expect(onBulkAction).toHaveBeenCalledWith(
      "setRole",
      ["u3"],
      { role: "moderator" },
    );
  });

  it("onBulkAction is called with message text payload", () => {
    const onBulkAction = vi.fn();
    render(<AdminUserTable users={USERS} onBulkAction={onBulkAction} />);
    fireEvent.click(screen.getByTestId("checkbox-u1"));
    fireEvent.click(screen.getByTestId("bulk-message-toggle"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hello!" } });
    fireEvent.click(screen.getByTestId("bulk-message-send"));
    expect(onBulkAction).toHaveBeenCalledWith(
      "message",
      ["u1"],
      { text: "Hello!" },
    );
  });
});
