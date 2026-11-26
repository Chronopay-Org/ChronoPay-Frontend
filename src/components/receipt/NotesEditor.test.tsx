import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotesEditor } from "./NotesEditor";

const receiptId = "receipt-notes-test";
const storageKey = `chronopay:receipt-notes:${receiptId}`;

beforeEach(() => {
  const entries = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
  });
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("NotesEditor", () => {
  it("marks an edit as unsaved and persists it after the debounce", () => {
    render(<NotesEditor receiptId={receiptId} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Follow up on this receipt" },
    });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(window.localStorage.getItem(storageKey)).toBeNull();

    act(() => vi.advanceTimersByTime(1500));

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(window.localStorage.getItem(storageKey)).toBe("Follow up on this receipt");
  });

  it.each([{ ctrlKey: true }, { metaKey: true }])(
    "saves immediately when the save shortcut is pressed with %j",
    (modifier) => {
      render(<NotesEditor receiptId={receiptId} />);
      const editor = screen.getByRole("textbox");
      fireEvent.change(editor, { target: { value: "Save immediately" } });
      expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
      expect(window.localStorage.getItem(storageKey)).toBeNull();

      fireEvent.keyDown(editor, { key: "s", ...modifier });

      expect(screen.getByText("Saved")).toBeInTheDocument();
      expect(window.localStorage.getItem(storageKey)).toBe("Save immediately");
    },
  );

  it("shows an empty preview and renders markdown without creating script elements", () => {
    render(<NotesEditor receiptId={receiptId} />);

    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("No notes yet.");

    fireEvent.click(screen.getByRole("tab", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "**x**\n\n<script>window.testMarker = true</script>" },
    });
    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));

    const preview = screen.getByRole("tabpanel");
    expect(preview.querySelector("strong")).toHaveTextContent("x");
    expect(preview.querySelector("script")).toBeNull();
  });
});
