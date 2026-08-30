import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toast } from "@/app/components/ui/toast";
import type { ToastItem } from "@/hooks/use-toast";

const makeToast = (overrides: Partial<ToastItem> = {}): ToastItem => ({
  id: "undo-toast",
  variant: "success",
  title: "Slot deleted",
  description: "The slot can be restored.",
  duration: 5000,
  count: 1,
  messages: [{ id: "message", title: "Slot deleted", timestamp: 0 }],
  ...overrides,
});

describe("toast undo", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("shows an accessible undo action and countdown", () => {
    render(<Toast toast={makeToast({ onUndo: vi.fn() })} onDismiss={vi.fn()} />);
    expect(screen.getByLabelText("Undo (Ctrl+Z)")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /seconds remaining/i })).toBeInTheDocument();
  });

  it("does not show a countdown for persistent undo", () => {
    render(<Toast toast={makeToast({ duration: 0, onUndo: vi.fn() })} onDismiss={vi.fn()} />);
    expect(screen.queryByRole("img", { name: /seconds remaining/i })).not.toBeInTheDocument();
  });

  it("runs undo once and dismisses after its announcement can be read", () => {
    const undo = vi.fn();
    const dismiss = vi.fn();
    render(<Toast toast={makeToast({ onUndo: undo })} onDismiss={dismiss} />);
    fireEvent.click(screen.getByLabelText("Undo (Ctrl+Z)"));
    expect(undo).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText("Undo (Ctrl+Z)")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(300));
    expect(dismiss).toHaveBeenCalledWith("undo-toast");
  });

  it("supports Ctrl+Z only while focus is inside this toast", () => {
    const undo = vi.fn();
    render(<Toast toast={makeToast({ onUndo: undo })} onDismiss={vi.fn()} />);
    const button = screen.getByLabelText("Undo (Ctrl+Z)");
    button.focus();
    fireEvent.keyDown(button, { key: "z", ctrlKey: true });
    expect(undo).toHaveBeenCalledOnce();
  });

  it("pauses the auto-dismiss timer on hover", () => {
    const dismiss = vi.fn();
    const { container } = render(<Toast toast={makeToast({ duration: 1000 })} onDismiss={dismiss} />);
    act(() => vi.advanceTimersByTime(500));
    fireEvent.mouseEnter(container.firstElementChild!);
    act(() => vi.advanceTimersByTime(1000));
    expect(dismiss).not.toHaveBeenCalled();
    fireEvent.mouseLeave(container.firstElementChild!);
    act(() => vi.advanceTimersByTime(500));
    expect(dismiss).toHaveBeenCalledWith("undo-toast");
  });

  it("announces undo availability", () => {
    render(<Toast toast={makeToast({ onUndo: vi.fn() })} onDismiss={vi.fn()} />);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText(/Undo available/i)).toBeInTheDocument();
  });

  it.each(["info", "warning", "error"] as const)("renders the %s live-region variant", (variant) => {
    render(<Toast toast={makeToast({ variant, onUndo: undefined })} onDismiss={vi.fn()} />);
    expect(screen.getByRole(variant === "warning" || variant === "error" ? "alert" : "status")).toBeInTheDocument();
    expect(screen.queryByLabelText("Undo (Ctrl+Z)")).not.toBeInTheDocument();
  });

  it("supports Command+Z and ignores modified shortcuts", () => {
    const undo = vi.fn();
    render(<Toast toast={makeToast({ onUndo: undo })} onDismiss={vi.fn()} />);
    const button = screen.getByLabelText("Undo (Ctrl+Z)");
    fireEvent.keyDown(button, { key: "z", metaKey: true, shiftKey: true });
    expect(undo).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: "z", metaKey: true });
    expect(undo).toHaveBeenCalledOnce();
  });

  it("renders and expands grouped messages while pausing its timer", () => {
    const dismiss = vi.fn();
    render(<Toast toast={makeToast({ count: 2, category: "transactions", messages: [
      { id: "first", title: "First transaction", timestamp: 0 },
      { id: "second", title: "Second transaction", timestamp: 0 },
    ] })} onDismiss={dismiss} />);
    const toggle = screen.getByLabelText("Expand notifications");
    fireEvent.click(toggle);
    expect(screen.getByRole("list", { name: /2 transactions notifications/i })).toBeInTheDocument();
    expect(screen.getByText("First transaction")).toBeInTheDocument();
    expect(screen.getByLabelText("Collapse notifications")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6000));
    expect(dismiss).not.toHaveBeenCalled();
  });

  it("cleans up a persistent toast only when the dismiss control is used", () => {
    const dismiss = vi.fn();
    render(<Toast toast={makeToast({ duration: 0, onUndo: undefined })} onDismiss={dismiss} />);
    act(() => vi.advanceTimersByTime(10000));
    expect(dismiss).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Dismiss: Slot deleted"));
    expect(dismiss).toHaveBeenCalledWith("undo-toast");
  });

  it("keeps focus within the toast paused and restores the description when a group collapses", () => {
    const { container } = render(<Toast toast={makeToast({ count: 2, description: "Group summary", messages: [
      { id: "first", title: "First", timestamp: 0 }, { id: "second", title: "Second", timestamp: 0 },
    ] })} onDismiss={vi.fn()} />);
    const toggle = screen.getByLabelText("Expand notifications");
    fireEvent.focus(toggle);
    fireEvent.blur(container.firstElementChild!, { relatedTarget: toggle });
    fireEvent.click(toggle);
    expect(screen.queryByText("Group summary")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Collapse notifications"));
    expect(screen.getByText("Group summary")).toBeInTheDocument();
  });

  it("does not consume Ctrl+Z when no undo callback is provided", () => {
    render(<Toast toast={makeToast({ onUndo: undefined })} onDismiss={vi.fn()} />);
    fireEvent.keyDown(screen.getByLabelText("Dismiss: Slot deleted"), { key: "z", ctrlKey: true, altKey: true });
    expect(screen.queryByText("Action undone.")).not.toBeInTheDocument();
  });

  it("uses the default timeout when duration is omitted", () => {
    const dismiss = vi.fn();
    render(<Toast toast={makeToast({ duration: undefined })} onDismiss={dismiss} />);
    act(() => vi.advanceTimersByTime(4999));
    expect(dismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(dismiss).toHaveBeenCalledOnce();
  });
});
