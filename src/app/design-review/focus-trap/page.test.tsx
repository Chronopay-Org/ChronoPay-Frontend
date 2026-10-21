import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FocusTrapTesterPage from "./page";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("FocusTrapTesterPage", () => {
  it("renders the review navigation and the actual tester", () => {
    render(<FocusTrapTesterPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Focus Trap Tester Harness" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Review/ })).toHaveAttribute("href", "/design-review");
    expect(screen.getByRole("heading", { level: 2, name: "Focus Trap Tester" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Open + Test focus trap" })).toHaveLength(6);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the base overlay and closes it from the page", () => {
    render(<FocusTrapTesterPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "Open + Test focus trap" })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByPlaceholderText("Text input")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Close modal" })[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Open + Test focus trap" })).toHaveLength(6);
  });

  it("reports a missing dialog as an inconclusive result", async () => {
    vi.useFakeTimers();
    const querySelector = Element.prototype.querySelector;
    vi.spyOn(Element.prototype, "querySelector").mockImplementation(function (selector: string) {
      if (selector === '[role="dialog"][aria-modal="true"]') return null;
      return querySelector.call(this, selector);
    });

    render(<FocusTrapTesterPage />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Open + Test focus trap" })[0]);
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByText(/Could not find the modal dialog in the DOM/)).toBeInTheDocument();
    expect(screen.getByText("Results: 0 passed, 0 failed, 1 inconclusive")).toBeInTheDocument();
  });
});
