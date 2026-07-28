import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AccountSwitcher } from "../account-switcher";

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Helper to open the dropdown */
function openSwitcher() {
  const trigger = screen.getByRole("button", { name: /switch account/i });
  fireEvent.click(trigger);
  return trigger;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AccountSwitcher", () => {
  // ── Basic rendering ──────────────────────────────────────────────────────

  it("renders the trigger button with active account info", () => {
    render(<AccountSwitcher />);
    const trigger = screen.getByRole("button", { name: /switch account/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-label");
    expect(trigger.getAttribute("aria-label")).toContain("Primary");
  });

  it("shows active account label on trigger", () => {
    render(<AccountSwitcher />);
    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  // ── Dropdown open/close ──────────────────────────────────────────────────

  it("opens dropdown on trigger click", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    expect(screen.getByText("Switch account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search accounts/i)).toBeInTheDocument();
  });

  it("closes dropdown on second trigger click", () => {
    render(<AccountSwitcher />);
    const trigger = openSwitcher();
    expect(screen.getByText("Switch account")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText("Switch account")).not.toBeInTheDocument();
  });

  it("closes dropdown on Escape key", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    expect(screen.getByText("Switch account")).toBeInTheDocument();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Switch account")).not.toBeInTheDocument();
  });

  // ── Active account pinned ────────────────────────────────────────────────

  it("shows the active account with Active badge", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const activeBadges = screen.getAllByText("Active");
    expect(activeBadges.length).toBe(1);
  });

  // ── Recent accounts ──────────────────────────────────────────────────────

  it("shows Recent section label", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    expect(screen.getByText("Recent")).toBeInTheDocument();
  });

  it("shows other accounts in the recent list", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    expect(screen.getByText("Savings")).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
  });

  // ── Search / typeahead ───────────────────────────────────────────────────

  it("filters accounts by label when searching", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "sav" } });
    // Use test-id to find account labels (label text may be split by HighlightMatch <mark>)
    const labels = screen.getAllByTestId("account-label");
    expect(labels.length).toBe(1);
    expect(labels[0].textContent).toBe("Savings");
  });

  it("filters accounts by provider when searching", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "albedo" } });
    const labels = screen.getAllByTestId("account-label");
    expect(labels.length).toBe(1);
    expect(labels[0].textContent).toBe("Savings");
  });

  it("shows empty state when no accounts match search", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "nonexistent" } });
    expect(screen.getByText(/no accounts matching/i)).toBeInTheDocument();
  });

  it("clears search on X button click and returns to default view", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "sav" } });
    const clearBtn = screen.getByLabelText("Clear search");
    fireEvent.click(clearBtn);
    // Should show all accounts again using test-ids
    const labels = screen.getAllByTestId("account-label");
    expect(labels.length).toBeGreaterThanOrEqual(3);
  });

  it("clears search on Escape when query is non-empty without closing", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "sav" } });
    fireEvent.keyDown(input, { key: "Escape" });
    // Query cleared, all accounts visible, dropdown still open
    const labels = screen.getAllByTestId("account-label");
    expect(labels.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("Switch account")).toBeInTheDocument();
  });

  // ── Switching accounts ───────────────────────────────────────────────────

  it("switches account when clicking another account label", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    // Find and click Savings in the dropdown
    const savingsLabel = screen.getAllByTestId("account-label")
      .find(el => el.textContent === "Savings");
    expect(savingsLabel).toBeDefined();
    fireEvent.click(savingsLabel!);
    // The trigger should now show Savings as the active account
    expect(screen.getByText("Savings")).toBeInTheDocument();
    // Dropdown should close
    expect(screen.queryByText("Switch account")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking active account option", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    // Click the first option (Primary Active) in the listbox
    const options = screen.getAllByRole("option");
    fireEvent.click(options[0]);
    expect(screen.queryByText("Switch account")).not.toBeInTheDocument();
  });

  // ── Adding an account ────────────────────────────────────────────────────

  it("adds a new account when clicking Add account", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const addBtn = screen.getByText("Add account");
    fireEvent.click(addBtn);
    // Should close the dropdown
    expect(screen.queryByText("Switch account")).not.toBeInTheDocument();
    // The trigger should show the new account label (use getAllByText and check at least one visible match)
    const matches = screen.getAllByText(/Account 4/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // At least one visible element shows the new label
    expect(matches.some(el => el.classList.contains("sr-only") === false)).toBe(true);
  });

  it("wraps around with ArrowDown at end of list", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    const options = screen.getAllByRole("option");
    // Navigate past the end to wrap around
    for (let i = 0; i < options.length + 1; i++) {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    }
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  // ── Keyboard navigation ─────────────────────────────────────────────────

  it("navigates with ArrowDown and sets aria-selected", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    // First option should be selected
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("navigates with ArrowUp to last item", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    const options = screen.getAllByRole("option");
    expect(options[options.length - 1]).toHaveAttribute("aria-selected", "true");
  });

  it("switches account with Enter on a non-active selected item", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    // Navigate to second item
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    // Should switch to Savings
    expect(screen.getByText("Savings")).toBeInTheDocument();
  });

  it("closes on Tab key", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "Tab" });
    expect(screen.queryByText("Switch account")).not.toBeInTheDocument();
  });

  // ── Accessibility ───────────────────────────────────────────────────────

  it("trigger has aria-expanded attribute that reflects state", () => {
    render(<AccountSwitcher />);
    const trigger = screen.getByRole("button", { name: /switch account/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("search input has combobox role and appropriate ARIA attributes", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-controls");
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("account options have listbox role", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThanOrEqual(3);
  });

  it("active account has aria-current attribute", () => {
    render(<AccountSwitcher />);
    openSwitcher();
    const activeOption = screen.getByRole("option", { name: /primary/i });
    expect(activeOption).toHaveAttribute("aria-current", "true");
  });

  it("has live region for announcements", () => {
    render(<AccountSwitcher />);
    const liveRegions = screen.getAllByRole("status");
    expect(liveRegions.length).toBeGreaterThanOrEqual(1);
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  it("handles click-outside to close", () => {
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <AccountSwitcher />
      </div>,
    );
    openSwitcher();
    expect(screen.getByText("Switch account")).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByText("Switch account")).not.toBeInTheDocument();
  });
});
