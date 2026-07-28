import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KeyboardShortcutsOverlay } from "../keyboard-shortcuts-overlay";

// ─── Helpers ────────────────────────────────────────────────────────────────

function renderOverlay(onClose = vi.fn()) {
  render(<KeyboardShortcutsOverlay isOpen onClose={onClose} />);
  return onClose;
}

function getSearchInput() {
  return screen.getByRole("combobox", { name: /search keyboard shortcuts/i });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("KeyboardShortcutsOverlay", () => {
  // ── Rendering ──────────────────────────────────────────────────────────

  it("renders nothing when isOpen is false", () => {
    render(<KeyboardShortcutsOverlay isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog with a title and search input when open", () => {
    renderOverlay();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /keyboard shortcuts/i }),
    ).toBeInTheDocument();
    expect(getSearchInput()).toBeInTheDocument();
  });

  it("lists all shortcuts by default", () => {
    renderOverlay();
    expect(screen.getAllByRole("option").length).toBeGreaterThan(5);
  });

  it("renders all category filter chips", () => {
    renderOverlay();
    expect(screen.getByTestId("shortcut-category-All")).toBeInTheDocument();
    expect(
      screen.getByTestId("shortcut-category-Navigation"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("shortcut-category-Search")).toBeInTheDocument();
    expect(
      screen.getByTestId("shortcut-category-Actions"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("shortcut-category-General"),
    ).toBeInTheDocument();
  });

  // ── Search ─────────────────────────────────────────────────────────────

  it("filters shortcuts by description text", () => {
    renderOverlay();
    fireEvent.change(getSearchInput(), { target: { value: "marketplace" } });
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent(/marketplace/i);
  });

  it("filters shortcuts by a key token", () => {
    renderOverlay();
    fireEvent.change(getSearchInput(), { target: { value: "mint" } });
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent(/mint a new time slot/i);
  });

  it("shows a no-matches empty state for an unmatched query", () => {
    renderOverlay();
    fireEvent.change(getSearchInput(), { target: { value: "zzzznomatch" } });
    expect(screen.queryAllByRole("option").length).toBe(0);
    expect(screen.getByText(/no shortcuts found/i)).toBeInTheDocument();
  });

  it("clears the search query via the clear button", () => {
    renderOverlay();
    const input = getSearchInput();
    fireEvent.change(input, { target: { value: "marketplace" } });
    expect(screen.getAllByRole("option").length).toBe(1);

    fireEvent.click(screen.getByLabelText("Clear search"));
    expect(input).toHaveValue("");
    expect(screen.getAllByRole("option").length).toBeGreaterThan(5);
  });

  // ── Category filter chips ─────────────────────────────────────────────

  it("filters by category when a chip is clicked", () => {
    renderOverlay();
    fireEvent.click(screen.getByTestId("shortcut-category-Navigation"));
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    options.forEach((option) => {
      expect(option.textContent).toMatch(/go to/i);
    });
  });

  it("marks the active category chip with aria-pressed", () => {
    renderOverlay();
    const allChip = screen.getByTestId("shortcut-category-All");
    const navChip = screen.getByTestId("shortcut-category-Navigation");
    expect(allChip).toHaveAttribute("aria-pressed", "true");
    expect(navChip).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(navChip);
    expect(navChip).toHaveAttribute("aria-pressed", "true");
    expect(allChip).toHaveAttribute("aria-pressed", "false");
  });

  it("combines category filter and search query", () => {
    renderOverlay();
    fireEvent.click(screen.getByTestId("shortcut-category-Actions"));
    fireEvent.change(getSearchInput(), { target: { value: "theme" } });
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent(/toggle light and dark theme/i);
  });

  it("shows an empty state when category + query combination has no matches", () => {
    renderOverlay();
    fireEvent.click(screen.getByTestId("shortcut-category-Navigation"));
    fireEvent.change(getSearchInput(), { target: { value: "mint" } });
    expect(screen.getByText(/no shortcuts found/i)).toBeInTheDocument();
  });

  it("navigates chip row with ArrowRight/ArrowLeft", () => {
    renderOverlay();
    const allChip = screen.getByTestId("shortcut-category-All");
    const navChip = screen.getByTestId("shortcut-category-Navigation");
    allChip.focus();
    fireEvent.keyDown(allChip, { key: "ArrowRight" });
    expect(navChip).toHaveFocus();
    fireEvent.keyDown(navChip, { key: "ArrowLeft" });
    expect(allChip).toHaveFocus();
  });

  it("jumps to the first chip on Home and the last chip on End", () => {
    renderOverlay();
    const allChip = screen.getByTestId("shortcut-category-All");
    const navChip = screen.getByTestId("shortcut-category-Navigation");
    const generalChip = screen.getByTestId("shortcut-category-General");

    navChip.focus();
    fireEvent.keyDown(navChip, { key: "End" });
    expect(generalChip).toHaveFocus();

    fireEvent.keyDown(generalChip, { key: "Home" });
    expect(allChip).toHaveFocus();
  });

  it("ignores unrelated key presses on a chip", () => {
    renderOverlay();
    const allChip = screen.getByTestId("shortcut-category-All");
    allChip.focus();
    fireEvent.keyDown(allChip, { key: "a" });
    expect(allChip).toHaveFocus();
  });

  it("ignores ArrowDown/ArrowUp on the search input when there are no results", () => {
    renderOverlay();
    const input = getSearchInput();
    fireEvent.change(input, { target: { value: "zzzznomatch" } });
    // Should not throw and should remain a no-op with zero results.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getByText(/no shortcuts found/i)).toBeInTheDocument();
  });

  it("wraps to the first result with ArrowDown from the last result", () => {
    renderOverlay();
    const input = getSearchInput();
    fireEvent.click(screen.getByTestId("shortcut-category-General"));
    const options = screen.getAllByRole("option");
    for (let i = 0; i < options.length; i++) {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    }
    const optionsAfter = screen.getAllByRole("option");
    expect(optionsAfter[0]).toHaveAttribute("aria-selected", "true");
  });

  it("wraps to the last result with ArrowUp from the first result", () => {
    renderOverlay();
    const input = getSearchInput();
    fireEvent.click(screen.getByTestId("shortcut-category-General"));
    fireEvent.keyDown(input, { key: "ArrowUp" });
    const options = screen.getAllByRole("option");
    expect(options[options.length - 1]).toHaveAttribute("aria-selected", "true");
  });

  // ── Roving result highlight ("focus first result") ────────────────────

  it("highlights the first result by default", () => {
    renderOverlay();
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("resets the highlight to the first match whenever the query changes", () => {
    renderOverlay();
    const input = getSearchInput();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.change(input, { target: { value: "go" } });
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("moves the highlight with ArrowDown and ArrowUp from the search input", () => {
    renderOverlay();
    const input = getSearchInput();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    let options = screen.getAllByRole("option");
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("sets aria-activedescendant to the highlighted option id", () => {
    renderOverlay();
    const input = getSearchInput();
    const options = screen.getAllByRole("option");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);
  });

  // ── Dismissal ──────────────────────────────────────────────────────────

  it("calls onClose when the close button is clicked", () => {
    const onClose = renderOverlay();
    fireEvent.click(screen.getByLabelText("Close keyboard shortcuts"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape", () => {
    const onClose = renderOverlay();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the backdrop", () => {
    const onClose = vi.fn();
    const { container } = render(
      <KeyboardShortcutsOverlay isOpen onClose={onClose} />,
    );
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the dialog panel", () => {
    const onClose = renderOverlay();
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });

  // ── Accessibility ──────────────────────────────────────────────────────

  it("dialog has aria-modal and is labelled by the heading", () => {
    renderOverlay();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent(
      /keyboard shortcuts/i,
    );
  });

  it("announces the result count via a live region", () => {
    renderOverlay();
    fireEvent.change(getSearchInput(), { target: { value: "marketplace" } });
    expect(screen.getByRole("status")).toHaveTextContent(/1 shortcut found/i);
  });

  it("announces zero results distinctly", () => {
    renderOverlay();
    fireEvent.change(getSearchInput(), { target: { value: "zzzznomatch" } });
    expect(screen.getByRole("status")).toHaveTextContent(
      /no shortcuts match your search/i,
    );
  });

  it("focuses the search input when opened", async () => {
    render(<KeyboardShortcutsOverlay isOpen onClose={vi.fn()} />);
    // Focus is scheduled via requestAnimationFrame in an effect.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(getSearchInput()).toHaveFocus();
  });

  it("resets query and category each time the dialog re-opens", () => {
    const { rerender } = render(
      <KeyboardShortcutsOverlay isOpen onClose={vi.fn()} />,
    );
    fireEvent.change(getSearchInput(), { target: { value: "marketplace" } });
    fireEvent.click(screen.getByTestId("shortcut-category-Navigation"));

    rerender(<KeyboardShortcutsOverlay isOpen={false} onClose={vi.fn()} />);
    rerender(<KeyboardShortcutsOverlay isOpen onClose={vi.fn()} />);

    expect(getSearchInput()).toHaveValue("");
    expect(screen.getByTestId("shortcut-category-All")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
