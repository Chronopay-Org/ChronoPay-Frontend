import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Toast } from "@/app/components/ui/toast";
import type { ToastItem, ToastMessage } from "@/hooks/use-toast";

describe("Toast Notifications Center", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockDismiss = vi.fn();

  function createMessage(id: string, title: string): ToastMessage {
    return {
      id,
      title,
      timestamp: Date.now(),
    };
  }

  function createToastItem(overrides: Partial<ToastItem> = {}): ToastItem {
    return {
      id: "test-toast",
      variant: "info",
      title: "Test Title",
      count: 1,
      messages: [createMessage("msg-1", "Test Message")],
      ...overrides,
    };
  }

  it("handles standard ephemeral toasts normally", () => {
    const toastItem = createToastItem({ duration: 5000 });
    render(<Toast toast={toastItem} onDismiss={mockDismiss} />);
    
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    
    // Should dismiss after duration
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(mockDismiss).toHaveBeenCalledWith("test-toast");
  });

  it("treats specific categories as persistent notifications", () => {
    const toastItem = createToastItem({ category: "bookings" });
    render(<Toast toast={toastItem} onDismiss={mockDismiss} />);
    
    // Should NOT dismiss after duration (persistent)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(mockDismiss).not.toHaveBeenCalled();
    
    // Should show mark as read button for single unread notification
    expect(screen.getByLabelText("Mark as read")).toBeInTheDocument();
  });

  it("groups notifications and allows marking all as read", () => {
    const toastItem = createToastItem({
      category: "payments",
      count: 2,
      messages: [
        createMessage("msg-1", "Payment 1"),
        createMessage("msg-2", "Payment 2"),
      ],
    });
    
    render(<Toast toast={toastItem} onDismiss={mockDismiss} />);
    
    // Expand the group
    fireEvent.click(screen.getByLabelText("Expand notifications"));
    
    // Wait for animation frame (just in case)
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText("Payment 1")).toBeInTheDocument();
    expect(screen.getByText("Payment 2")).toBeInTheDocument();
    
    // Find "Mark all as read"
    const markAllBtn = screen.getByText(/Mark all as read/);
    expect(markAllBtn).toBeInTheDocument();
    
    // The badge should have an aria-label with unread counts
    const badge = screen.getByLabelText(/2 unread notifications in this group/);
    expect(badge).toBeInTheDocument();
    
    // Mark all as read
    fireEvent.click(markAllBtn);
    
    // Badge aria label should update? Actually it doesn't change text to "0 unread" but badge style changes. 
    // Wait, the badge might still say "0 unread notifications in this group" if it re-renders. 
    // Wait, my code conditionally renders the label or the badge.
    // Let's just check that Mark all as read button disappears.
    expect(screen.queryByText(/Mark all as read/)).not.toBeInTheDocument();
  });

  it("allows marking individual messages as read", () => {
    const toastItem = createToastItem({
      category: "disputes",
      count: 2,
      messages: [
        createMessage("msg-1", "Dispute 1"),
        createMessage("msg-2", "Dispute 2"),
      ],
    });
    
    render(<Toast toast={toastItem} onDismiss={mockDismiss} />);
    
    // Expand the group
    fireEvent.click(screen.getByLabelText("Expand notifications"));
    
    // Find "Mark as read" buttons
    const markReadBtns = screen.getAllByText("Mark as read");
    expect(markReadBtns).toHaveLength(2);
    
    // Click first one
    fireEvent.click(markReadBtns[0]);
    
    // Only one should remain
    expect(screen.getAllByText("Mark as read")).toHaveLength(1);
  });
  
  it("exposes unread counts in aria-label for the container", () => {
    const toastItem = createToastItem({
      category: "system",
      title: "System Updates",
      count: 3,
      messages: [
        createMessage("msg-1", "Update 1"),
        createMessage("msg-2", "Update 2"),
        createMessage("msg-3", "Update 3"),
      ],
    });
    
    render(<Toast toast={toastItem} onDismiss={mockDismiss} />);
    
    // Container should have aria-label
    const container = screen.getByLabelText("3 unread system notifications out of 3 total: System Updates");
    expect(container).toBeInTheDocument();
  });
});
