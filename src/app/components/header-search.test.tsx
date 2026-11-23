import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackDidYouMeanClick } from "@/lib/analytics";
import { HeaderSearch } from "./header-search";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("trackDidYouMeanClick", () => {
  const originalEnv = process.env.NODE_ENV;
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockClear();
  });

  it("resolves successfully when both inputs are provided in development", async () => {
    process.env.NODE_ENV = "development";
    const result = await trackDidYouMeanClick("teh", "the");
    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith("[analytics] did_you_mean_click", {
      original: "teh",
      suggested: "the",
    });
  });

  it("resolves successfully when both inputs are provided in production", async () => {
    process.env.NODE_ENV = "production";
    const result = await trackDidYouMeanClick("teh", "the");
    expect(result).toBe(true);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("rejects when the original term is empty", async () => {
    await expect(trackDidYouMeanClick("", "the")).rejects.toThrow(
      "Both original and suggested terms are required for analytics tracking.",
    );
  });

  it("rejects when the suggested term is empty", async () => {
    await expect(trackDidYouMeanClick("teh", "")).rejects.toThrow(
      "Both original and suggested terms are required for analytics tracking.",
    );
  });
});

describe("HeaderSearch receipt notes", () => {
  const receiptId = "slot-note-42";
  const receiptNoteKey = `chronopay:receipt-notes:${receiptId}`;

  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    mockPush.mockClear();
  });

  function setupSearch(noteText = "Remember to share the handoff summary with Jordan.") {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    vi.stubGlobal("requestAnimationFrame", vi.fn());
    window.localStorage.setItem(receiptNoteKey, noteText);

    render(<HeaderSearch />);
    fireEvent.click(screen.getByRole("button", { name: "Open search" }));
    return screen.getByRole("combobox", { name: "Search ChronoPay" });
  }

  it("debounces and highlights matching saved receipt-note previews", () => {
    const input = setupSearch();
    fireEvent.change(input, { target: { value: "handoff" } });

    expect(screen.queryByText("Receipt notes")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(screen.queryByText("Receipt notes")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByText("Receipt notes")).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: "Remember to share the handoff summary with Jordan.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("handoff", { selector: "mark" })).toBeInTheDocument();
  });

  it("does not search receipt notes for a one-character query", () => {
    const input = setupSearch();
    fireEvent.change(input, { target: { value: "h" } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText("Receipt notes")).not.toBeInTheDocument();
  });

  it("keeps a match late in a long note inside the highlighted preview", () => {
    const input = setupSearch(
      `${"Earlier discussion details. ".repeat(5)}The handoff is scheduled for Friday.`,
    );
    fireEvent.change(input, { target: { value: "handoff" } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText("handoff", { selector: "mark" })).toBeInTheDocument();
  });

  it("navigates to the matching receipt when selected with the keyboard", () => {
    const input = setupSearch();
    fireEvent.change(input, { target: { value: "handoff" } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith(
      `/dashboard/slots/${receiptId}/receipt`,
    );
  });
});
