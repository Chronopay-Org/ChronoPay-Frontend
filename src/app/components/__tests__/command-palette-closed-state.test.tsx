/**
 * command-palette-closed-state.test.tsx
 *
 * Regression coverage for #854: the closed-state early return
 * (`if (!isOpen) return null` at command-palette.tsx:238) and its
 * neighboring open/close, empty-result, and boundary paths.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "../command-palette";

const mockPathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  mockPathname.mockReturnValue("/dashboard");
});

function openPalette() {
  fireEvent.keyDown(document, { key: "k", metaKey: true });
}

function queryInput() {
  return screen.getByPlaceholderText("Search commands…");
}

describe("CommandPalette closed state (#854)", () => {
  it("renders nothing while closed", () => {
    render(<CommandPalette />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search commands…")).not.toBeInTheDocument();
  });

  it("opens on Cmd+K and renders the dialog", () => {
    render(<CommandPalette />);
    openPalette();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(queryInput()).toBeInTheDocument();
  });

  it("Escape with an empty query closes the palette", () => {
    render(<CommandPalette />);
    openPalette();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(queryInput(), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Escape with a non-empty query clears the query but stays open", () => {
    render(<CommandPalette />);
    openPalette();
    fireEvent.change(queryInput(), { target: { value: "wallet" } });
    expect(queryInput()).toHaveValue("wallet");
    fireEvent.keyDown(queryInput(), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(queryInput()).toHaveValue("");
  });

  it("shows an empty state and ignores Enter when nothing matches", () => {
    render(<CommandPalette />);
    openPalette();
    fireEvent.change(queryInput(), { target: { value: "zzz-no-such-command" } });
    expect(screen.getByText(/No results for/)).toBeInTheDocument();
    fireEvent.keyDown(queryInput(), { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/No results for/)).toBeInTheDocument();
  });

  it("reopens cleanly after being closed", () => {
    render(<CommandPalette />);
    openPalette();
    fireEvent.keyDown(queryInput(), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    openPalette();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(queryInput()).toHaveValue("");
  });
});
