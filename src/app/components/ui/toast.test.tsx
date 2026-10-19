import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Toast } from "./toast";
import type { ToastCategory, ToastItem, ToastMessage } from "@/hooks/use-toast";

describe("Toast component behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const mockDismiss = vi.fn();
  const mockUndo = vi.fn();

  function createMessage(id: string, title: string): ToastMessage {
    return {
      id,
      title,
      timestamp: Date.now(),
    };
  }

  function makeToast(overrides: Partial<ToastItem> = {}): ToastItem {
    return {
      id: "toast-1",
      variant: "info",
      title: "Test Toast",
      count: 1,
      messages: [createMessage("msg-1", "Test Message")],
      ...overrides,
    };
  }

  it("renders with required props and handles auto-dismiss state transition", () => {
    render(<Toast toast={makeToast({ duration: 5000 })} onDismiss={mockDismiss} />);
    
    expect(screen.getByText("Test Toast")).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(mockDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("pauses auto-dismiss on hover and resumes on unhover", () => {
    render(<Toast toast={makeToast({ duration: 5000 })} onDismiss={mockDismiss} />);
    
    const container = screen.getByRole("status");
    
    act(() => {
      vi.advanceTimersByTime(2000); // 3000ms left
    });
    
    fireEvent.mouseEnter(container);
    
    act(() => {
      vi.advanceTimersByTime(4000); // Should not dismiss yet due to hover
    });
    expect(mockDismiss).not.toHaveBeenCalled();
    
    fireEvent.mouseLeave(container);
    
    act(() => {
      vi.advanceTimersByTime(3000); // 3000ms left from pause
    });
    expect(mockDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("handles empty messages gracefully (invalid/edge input)", () => {
    render(<Toast toast={makeToast({ messages: [] })} onDismiss={mockDismiss} />);
    // Should render title even if messages are empty
    expect(screen.getByText("Test Toast")).toBeInTheDocument();
  });

  it("handles missing description and other optional props", () => {
    render(<Toast toast={makeToast({ description: undefined, actions: undefined, onUndo: undefined })} onDismiss={mockDismiss} />);
    expect(screen.getByText("Test Toast")).toBeInTheDocument();
  });

  it("handles negative duration edge case", () => {
    render(<Toast toast={makeToast({ duration: -1000 })} onDismiss={mockDismiss} />);
    // If duration is effectively 0, it shouldn't auto-dismiss immediately if negative, wait no, let's see how Math.max behaves
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(mockDismiss).toHaveBeenCalledWith("toast-1"); // Because -1000 means it dismisses at max(0, -1000) which is 0.
  });

  it("handles zero duration (persistent toast) correctly", () => {
    render(<Toast toast={makeToast({ duration: 0 })} onDismiss={mockDismiss} />);
    
    act(() => {
      vi.advanceTimersByTime(100000);
    });
    
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it("handles the undo state transition", () => {
    render(<Toast toast={makeToast({ onUndo: mockUndo, duration: 5000 })} onDismiss={mockDismiss} />);
    
    const undoButton = screen.getByLabelText("Undo (Ctrl+Z)");
    fireEvent.click(undoButton);
    
    expect(mockUndo).toHaveBeenCalled();
    expect(screen.getByText("Action undone.")).toBeInTheDocument();
    
    // Should dismiss after a short delay (300ms in implementation)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("triggers keyboard shortcut for undo", () => {
    const { container } = render(<Toast toast={makeToast({ onUndo: mockUndo, duration: 5000 })} onDismiss={mockDismiss} />);
    
    fireEvent.keyDown(container.firstChild as Element, { key: "z", ctrlKey: true });
    expect(mockUndo).toHaveBeenCalled();
  });

  it("expands and collapses grouped notifications (state transition)", () => {
    render(
      <Toast 
        toast={makeToast({ 
          count: 2, 
          messages: [createMessage("msg-1", "First"), createMessage("msg-2", "Second")] 
        })} 
        onDismiss={mockDismiss} 
      />
    );
    
    const expandButton = screen.getByLabelText("Expand notifications");
    fireEvent.click(expandButton);
    
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    
    const collapseButton = screen.getByLabelText("Collapse notifications");
    fireEvent.click(collapseButton);
    
    // Should collapse (might still be in DOM due to Framer Motion exit animation, but we can just test the button change)
    expect(screen.getByLabelText("Expand notifications")).toBeInTheDocument();
  });
});

/**
 * Acceptance criteria tests for issue #1130:
 * "isPersistentCategory is undefined" — ReferenceError on every toast render.
 *
 * Three required variants:
 *   1. Ungrouped toast with no category → must not throw.
 *   2. Ungrouped toast with category: "payments" → must not throw; shows unread dot.
 *   3. Grouped toast (count > 1) → must not throw; badge count is visible.
 */
describe("isPersistentCategory fix — issue #1130 acceptance criteria", () => {
  const mockDismiss = vi.fn();

  function createMessage(id: string, title: string): ToastMessage {
    return { id, title, timestamp: Date.now() };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    mockDismiss.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Case 1: no category ────────────────────────────────────────────────────
  it("renders without throwing when toast has no category (ungrouped)", () => {
    // Previously threw: ReferenceError: isPersistentCategory is not defined
    const toast: ToastItem = {
      id: "no-cat-1",
      variant: "success",
      title: "Copied to clipboard",
      count: 1,
      messages: [createMessage("msg-1", "Copied to clipboard")],
      // category intentionally omitted
    };

    expect(() =>
      render(<Toast toast={toast} onDismiss={mockDismiss} />)
    ).not.toThrow();

    expect(screen.getByText("Copied to clipboard")).toBeInTheDocument();
    // No unread indicator for a non-persistent toast
    expect(screen.queryByLabelText("1 unread notification")).not.toBeInTheDocument();
    // No mark-as-read button
    expect(screen.queryByLabelText("Mark as read")).not.toBeInTheDocument();
  });

  // ── Case 2: persistent category "payments" ────────────────────────────────
  it("renders without throwing when toast has category: 'payments' and shows unread indicator", () => {
    const toast: ToastItem = {
      id: "payments-1",
      variant: "info",
      title: "Payment received",
      count: 1,
      messages: [createMessage("pay-msg-1", "Payment received")],
      category: "payments" as ToastCategory,
    };

    expect(() =>
      render(<Toast toast={toast} onDismiss={mockDismiss} />)
    ).not.toThrow();

    expect(screen.getByText("Payment received")).toBeInTheDocument();

    // Persistent category with unread message → unread dot should be present
    expect(screen.getByLabelText("1 unread notification")).toBeInTheDocument();
    // Mark-as-read button should appear for ungrouped persistent toasts
    expect(screen.getByLabelText("Mark as read")).toBeInTheDocument();
  });

  it("hides unread dot for 'payments' toast after marking as read", () => {
    const toast: ToastItem = {
      id: "payments-2",
      variant: "info",
      title: "Payment received",
      count: 1,
      messages: [createMessage("pay-msg-2", "Payment received")],
      category: "payments" as ToastCategory,
    };

    render(<Toast toast={toast} onDismiss={mockDismiss} />);

    // Dot is visible initially
    expect(screen.getByLabelText("1 unread notification")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Mark as read"));

    // Dot must disappear after mark-as-read
    expect(screen.queryByLabelText("1 unread notification")).not.toBeInTheDocument();
  });

  // ── Case 3: grouped toast (count > 1) ─────────────────────────────────────
  it("renders without throwing when toast is grouped (count > 1) with a persistent category", () => {
    const toast: ToastItem = {
      id: "group:bookings",
      variant: "info",
      title: "3 new booking updates",
      count: 3,
      messages: [
        createMessage("bk-1", "Booking confirmed"),
        createMessage("bk-2", "Booking rescheduled"),
        createMessage("bk-3", "Booking cancelled"),
      ],
      category: "bookings" as ToastCategory,
    };

    expect(() =>
      render(<Toast toast={toast} onDismiss={mockDismiss} />)
    ).not.toThrow();

    expect(screen.getByText("3 new booking updates")).toBeInTheDocument();

    // Grouped badge showing the count must be present
    const badge = screen.getByLabelText("3 unread notifications in this group");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("3");
  });

  it("renders without throwing when grouped toast has no persistent category", () => {
    // count > 1 but category is not in NOTIFICATION_CATEGORIES
    const toast: ToastItem = {
      id: "non-persistent-group",
      variant: "warning",
      title: "2 connection warnings",
      count: 2,
      messages: [
        createMessage("w-1", "Retry 1"),
        createMessage("w-2", "Retry 2"),
      ],
      // No category — isPersistentCategory must be false, not a ReferenceError
    };

    expect(() =>
      render(<Toast toast={toast} onDismiss={mockDismiss} />)
    ).not.toThrow();

    expect(screen.getByText("2 connection warnings")).toBeInTheDocument();
    // Badge still shows count for grouped toasts regardless of category
    const badge = screen.getByLabelText("2 unread notifications in this group");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("2");
  });
});
