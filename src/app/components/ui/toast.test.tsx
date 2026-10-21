import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Toast } from "./toast";
import type { ToastItem, ToastMessage } from "@/hooks/use-toast";

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
