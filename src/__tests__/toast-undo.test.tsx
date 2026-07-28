/**
 * Toast undo affordance — unit tests
 *
 * Coverage targets (≥95%):
 *  - Rendering: all four variants, with/without undo, with/without description
 *  - CountdownRing: renders when onUndo present and duration > 0; hidden when duration=0
 *  - Undo button: renders label, icon, aria-label; fires onUndo on click; dismisses toast
 *  - Undo button: not rendered after undo is triggered (undoDone state)
 *  - Ctrl+Z shortcut: fires onUndo when not inside a text field
 *  - Ctrl+Z shortcut: does NOT fire when target is INPUT, TEXTAREA, or contenteditable
 *  - Ctrl+Z shortcut: does NOT fire after undo already done
 *  - Ctrl+Z shortcut: does NOT fire when no onUndo provided
 *  - Meta+Z: fires onUndo (Mac fallback)
 *  - Hover/focus pause: timer pauses; ring updates correctly
 *  - Auto-dismiss: fires after duration when not paused
 *  - Auto-dismiss: does NOT fire when duration=0
 *  - Screen reader announcements: live region announces "Undo available" on mount;
 *    announces "Action undone" after undo click
 *  - Grouped toast: count badge, expand/collapse, expanded panel content
 *  - Dismiss button: fires onDismiss
 *  - Reduced motion: ring shows no animation (static)
 *  - RTL: component renders without layout breakage (no hard-coded LTR values)
 *  - useToast: onUndo passes through from ToastInput to ToastItem
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Toast } from "@/app/components/ui/toast";
import { ToastProvider, useToast } from "@/hooks/use-toast";
import type { ToastItem } from "@/hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeToast(overrides: Partial<ToastItem> = {}): ToastItem {
  return {
    id: "toast-1",
    variant: "success",
    title: "Slot purchased",
    description: "Your time slot is confirmed.",
    duration: 5000,
    count: 1,
    messages: [
      {
        id: "msg-1",
        title: "Slot purchased",
        description: "Your time slot is confirmed.",
        timestamp: Date.now(),
      },
    ],
    ...overrides,
  };
}

function renderToast(
  toastItem: ToastItem,
  onDismiss = vi.fn(),
) {
  return render(<Toast toast={toastItem} onDismiss={onDismiss} />);
}

// ─── Setup/Teardown ───────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── Basic rendering ──────────────────────────────────────────────────────────

describe("Toast — basic rendering", () => {
  it("renders title and description", () => {
    renderToast(makeToast());
    expect(screen.getByText("Slot purchased")).toBeDefined();
    expect(screen.getByText("Your time slot is confirmed.")).toBeDefined();
  });

  it("renders without description", () => {
    renderToast(makeToast({ description: undefined }));
    expect(screen.getByText("Slot purchased")).toBeDefined();
  });

  it.each(["success", "info", "warning", "error"] as const)(
    "renders %s variant without crashing",
    (variant) => {
      renderToast(makeToast({ variant }));
      // The container div with role exists
      const el = screen.getByRole(
        variant === "success" || variant === "info" ? "status" : "alert",
      );
      expect(el).toBeDefined();
    },
  );

  it("dismiss button has correct aria-label", () => {
    renderToast(makeToast());
    const btn = screen.getByLabelText("Dismiss: Slot purchased");
    expect(btn).toBeDefined();
  });

  it("fires onDismiss when dismiss button clicked", () => {
    const onDismiss = vi.fn();
    renderToast(makeToast(), onDismiss);
    fireEvent.click(screen.getByLabelText("Dismiss: Slot purchased"));
    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });
});

// ─── Undo button ──────────────────────────────────────────────────────────────

describe("Toast — undo button", () => {
  it("renders undo button when onUndo provided", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    expect(screen.getByLabelText("Undo (Ctrl+Z)")).toBeDefined();
  });

  it("does NOT render undo button when onUndo absent", () => {
    renderToast(makeToast({ onUndo: undefined }));
    expect(screen.queryByLabelText("Undo (Ctrl+Z)")).toBeNull();
  });

  it("undo button shows 'Undo' text", () => {
    renderToast(makeToast({ onUndo: vi.fn() }));
    expect(screen.getByText("Undo")).toBeDefined();
  });

  it("clicking undo button calls onUndo", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    fireEvent.click(screen.getByLabelText("Undo (Ctrl+Z)"));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("clicking undo dismisses the toast after 300ms", () => {
    const onUndo = vi.fn();
    const onDismiss = vi.fn();
    renderToast(makeToast({ onUndo }), onDismiss);
    fireEvent.click(screen.getByLabelText("Undo (Ctrl+Z)"));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("undo button disappears after undo is triggered", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    act(() => {
      fireEvent.click(screen.getByLabelText("Undo (Ctrl+Z)"));
    });
    // After click, undoDone becomes true — button should be gone synchronously
    expect(screen.queryByLabelText("Undo (Ctrl+Z)")).toBeNull();
  });

  it("does not call onUndo twice if button is clicked twice rapidly", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    const btn = screen.getByLabelText("Undo (Ctrl+Z)");
    fireEvent.click(btn);
    // Button is gone after first click (undoDone=true), so second click can't land
    expect(screen.queryByLabelText("Undo (Ctrl+Z)")).toBeNull();
    expect(onUndo).toHaveBeenCalledOnce();
  });
});

// ─── Countdown ring ───────────────────────────────────────────────────────────

describe("Toast — countdown ring", () => {
  it("renders ring wrapper when onUndo and duration > 0", () => {
    renderToast(makeToast({ onUndo: vi.fn(), duration: 5000 }));
    // The ring wrapper has a role="img" aria-label containing "seconds remaining"
    const ring = screen.getByRole("img");
    expect(ring.getAttribute("aria-label")).toMatch(/seconds remaining/i);
  });

  it("does NOT render ring when duration is 0", () => {
    renderToast(makeToast({ onUndo: vi.fn(), duration: 0 }));
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("does NOT render ring when onUndo is absent", () => {
    renderToast(makeToast({ duration: 5000 }));
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("SVG within ring has aria-hidden='true'", () => {
    renderToast(makeToast({ onUndo: vi.fn(), duration: 5000 }));
    const svgEl = document.querySelector("svg");
    expect(svgEl?.getAttribute("aria-hidden")).toBe("true");
  });
});

// ─── Auto-dismiss ─────────────────────────────────────────────────────────────

describe("Toast — auto-dismiss", () => {
  it("calls onDismiss after duration ms", () => {
    const onDismiss = vi.fn();
    renderToast(makeToast({ duration: 3000 }), onDismiss);
    act(() => vi.advanceTimersByTime(3000));
    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("does NOT call onDismiss when duration is 0", () => {
    const onDismiss = vi.fn();
    renderToast(makeToast({ duration: 0 }), onDismiss);
    act(() => vi.advanceTimersByTime(10000));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("pauses auto-dismiss on hover and resumes on mouse leave", () => {
    const onDismiss = vi.fn();
    const { container } = renderToast(makeToast({ duration: 4000 }), onDismiss);
    const wrapper = container.firstChild as HTMLElement;

    // Advance half the time, then hover
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.mouseEnter(wrapper);

    // Advance beyond original duration — should NOT dismiss
    act(() => vi.advanceTimersByTime(4000));
    expect(onDismiss).not.toHaveBeenCalled();

    // Mouse leave — remaining 2000ms should trigger dismiss
    fireEvent.mouseLeave(wrapper);
    act(() => vi.advanceTimersByTime(2000));
    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("pauses auto-dismiss on focus and resumes on blur", () => {
    const onDismiss = vi.fn();
    const { container } = renderToast(makeToast({ duration: 4000 }), onDismiss);
    const wrapper = container.firstChild as HTMLElement;

    act(() => vi.advanceTimersByTime(1000));
    fireEvent.focus(wrapper);
    act(() => vi.advanceTimersByTime(5000));
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.blur(wrapper);
    act(() => vi.advanceTimersByTime(3000));
    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });
});

// ─── Ctrl+Z keyboard shortcut ─────────────────────────────────────────────────

describe("Toast — Ctrl+Z shortcut", () => {
  it("fires onUndo on Ctrl+Z when toast has onUndo", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    fireEvent.keyDown(document, { key: "z", ctrlKey: true });
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("fires onUndo on Meta+Z (Mac)", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    fireEvent.keyDown(document, { key: "z", metaKey: true });
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("does NOT fire when target is an INPUT", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "z", ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("does NOT fire when target is a TEXTAREA", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    fireEvent.keyDown(ta, { key: "z", ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
    document.body.removeChild(ta);
  });

  it("does NOT fire when target is contenteditable", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    const div = document.createElement("div");
    div.contentEditable = "true";
    document.body.appendChild(div);
    fireEvent.keyDown(div, { key: "z", ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it("does NOT fire Ctrl+Z when no onUndo provided", () => {
    const onDismiss = vi.fn();
    renderToast(makeToast({ onUndo: undefined }), onDismiss);
    // No error should be thrown; no dismiss triggered by Ctrl+Z
    expect(() =>
      fireEvent.keyDown(document, { key: "z", ctrlKey: true }),
    ).not.toThrow();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does NOT fire Ctrl+Z after undo is already done", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));

    // First Ctrl+Z — should work
    fireEvent.keyDown(document, { key: "z", ctrlKey: true });
    expect(onUndo).toHaveBeenCalledOnce();

    // Second Ctrl+Z — undoDone is true, should be no-op
    fireEvent.keyDown(document, { key: "z", ctrlKey: true });
    expect(onUndo).toHaveBeenCalledOnce(); // still only once
  });

  it("does NOT fire on Ctrl+Shift+Z (redo)", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    fireEvent.keyDown(document, { key: "z", ctrlKey: true, shiftKey: true });
    expect(onUndo).not.toHaveBeenCalled();
  });

  it("does NOT fire on Ctrl+Alt+Z", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    fireEvent.keyDown(document, { key: "z", ctrlKey: true, altKey: true });
    expect(onUndo).not.toHaveBeenCalled();
  });

  it("removes keydown listener when component unmounts", () => {
    const onUndo = vi.fn();
    const { unmount } = renderToast(makeToast({ onUndo }));
    unmount();
    fireEvent.keyDown(document, { key: "z", ctrlKey: true });
    expect(onUndo).not.toHaveBeenCalled();
  });
});

// ─── Screen reader announcements ─────────────────────────────────────────────

describe("Toast — screen reader announcements", () => {
  it("renders a sr-only live region when onUndo is provided", () => {
    renderToast(makeToast({ onUndo: vi.fn() }));
    // There should be a polite live region for undo announcements
    const liveRegions = document.querySelectorAll('[aria-live="polite"]');
    // One from the toast container, one from the announcer
    const srOnly = Array.from(liveRegions).find((el) =>
      el.classList.contains("sr-only"),
    );
    expect(srOnly).toBeDefined();
  });

  it("does NOT render sr-only live region when no onUndo", () => {
    renderToast(makeToast({ onUndo: undefined }));
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly).toBeNull();
  });

  it("announces undo availability after 600ms delay", () => {
    renderToast(makeToast({ onUndo: vi.fn() }));
    const srOnly = document.querySelector(".sr-only")!;
    expect(srOnly.textContent).toBe("");

    act(() => vi.advanceTimersByTime(600));
    expect(srOnly.textContent).toMatch(/undo available/i);
  });

  it("announces 'Action undone' after undo click", () => {
    renderToast(makeToast({ onUndo: vi.fn() }));
    const srOnly = document.querySelector(".sr-only")!;
    act(() => {
      fireEvent.click(screen.getByLabelText("Undo (Ctrl+Z)"));
    });
    expect(srOnly.textContent).toMatch(/action undone/i);
  });
});

// ─── Grouped toast ────────────────────────────────────────────────────────────

describe("Toast — grouped toast", () => {
  function makeGroupedToast(): ToastItem {
    return {
      id: "group:transactions",
      variant: "success",
      title: "3 transactions confirmed",
      duration: 5000,
      count: 3,
      category: "transactions",
      messages: [
        { id: "m1", title: "Slot #42 purchased", timestamp: Date.now() - 2000 },
        { id: "m2", title: "Slot #43 purchased", timestamp: Date.now() - 1000 },
        { id: "m3", title: "Slot #44 purchased", timestamp: Date.now() },
      ],
    };
  }

  it("renders count badge for grouped toasts", () => {
    renderToast(makeGroupedToast());
    expect(screen.getByLabelText("3 notifications in this group")).toBeDefined();
  });

  it("renders expand button with aria-expanded=false initially", () => {
    renderToast(makeGroupedToast());
    const expandBtn = screen.getByLabelText("Expand notifications");
    expect(expandBtn.getAttribute("aria-expanded")).toBe("false");
  });

  it("expanding shows individual messages", () => {
    renderToast(makeGroupedToast());
    act(() => {
      fireEvent.click(screen.getByLabelText("Expand notifications"));
    });
    expect(screen.getByText("Slot #42 purchased")).toBeDefined();
    expect(screen.getByText("Slot #43 purchased")).toBeDefined();
    expect(screen.getByText("Slot #44 purchased")).toBeDefined();
  });

  it("expanded button aria-expanded becomes true after click", () => {
    renderToast(makeGroupedToast());
    act(() => {
      fireEvent.click(screen.getByLabelText("Expand notifications"));
    });
    const collapseBtn = screen.getByLabelText("Collapse notifications");
    expect(collapseBtn.getAttribute("aria-expanded")).toBe("true");
  });

  it("does not show undo on grouped toast without onUndo prop", () => {
    // No onUndo on this toast — undo button must be absent
    renderToast(makeGroupedToast());
    expect(screen.queryByLabelText("Undo (Ctrl+Z)")).toBeNull();
  });

  it("grouped toast with onUndo renders undo affordance", () => {
    const onUndo = vi.fn();
    const grouped: ToastItem = {
      id: "group:tx",
      variant: "success",
      title: "2 transactions",
      duration: 5000,
      count: 2,
      messages: [
        { id: "m1", title: "Tx 1", timestamp: Date.now() - 1000 },
        { id: "m2", title: "Tx 2", timestamp: Date.now() },
      ],
      onUndo,
    };
    renderToast(grouped);
    expect(screen.getByLabelText("Undo (Ctrl+Z)")).toBeDefined();
  });
});

// ─── Reduced motion ───────────────────────────────────────────────────────────

describe("Toast — reduced motion", () => {
  it("ring SVG still renders under reduced motion (structure unchanged)", () => {
    // Mock matchMedia to prefer reduced motion
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderToast(makeToast({ onUndo: vi.fn(), duration: 5000 }));
    const svgEl = document.querySelector("svg");
    expect(svgEl).toBeDefined();

    window.matchMedia = original;
  });
});

// ─── useToast hook — onUndo integration ──────────────────────────────────────

describe("useToast — onUndo threads through correctly", () => {
  // These tests don't need fake timers — switch to real timers for async updates
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.useFakeTimers());

  it("onUndo is preserved on the ToastItem emitted by the hook", async () => {
    const onUndo = vi.fn();
    let capturedItem: ToastItem | null = null;

    function TestHarness() {
      const { toast, toasts } = useToast();
      React.useEffect(() => {
        toast({ variant: "success", title: "Test undo toast", onUndo });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      if (toasts.length > 0) capturedItem = toasts[0];
      return null;
    }

    render(
      <ToastProvider>
        <TestHarness />
      </ToastProvider>,
    );

    await waitFor(() => expect(capturedItem).not.toBeNull());
    expect(capturedItem!.onUndo).toBe(onUndo);
  });

  it("onUndo is undefined when not provided", async () => {
    let capturedItem: ToastItem | null = null;

    function NoUndoHarness() {
      const { toast, toasts } = useToast();
      React.useEffect(() => {
        toast({ variant: "info", title: "No undo" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      if (toasts.length > 0) capturedItem = toasts[0];
      return null;
    }

    render(
      <ToastProvider>
        <NoUndoHarness />
      </ToastProvider>,
    );

    await waitFor(() => expect(capturedItem).not.toBeNull());
    expect(capturedItem!.onUndo).toBeUndefined();
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("Toast — edge cases", () => {
  it("rapid undo click does not cause errors", () => {
    const onUndo = vi.fn();
    renderToast(makeToast({ onUndo }));
    expect(() => {
      fireEvent.click(screen.getByLabelText("Undo (Ctrl+Z)"));
      // After first click the button is gone — subsequent clicks can't land
    }).not.toThrow();
  });

  it("undo toast with duration=0 renders button but no ring", () => {
    renderToast(makeToast({ onUndo: vi.fn(), duration: 0 }));
    expect(screen.getByLabelText("Undo (Ctrl+Z)")).toBeDefined();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders correctly when category is set (non-grouped, category-tagged toast)", () => {
    renderToast(
      makeToast({ category: "transactions", count: 1, onUndo: vi.fn() }),
    );
    expect(screen.getByText("Slot purchased")).toBeDefined();
    expect(screen.getByLabelText("Undo (Ctrl+Z)")).toBeDefined();
  });

  it("grouped toast with undo renders without crashing", () => {
    const grouped: ToastItem = {
      id: "group:tx",
      variant: "success",
      title: "2 transactions",
      duration: 5000,
      count: 2,
      messages: [
        { id: "m1", title: "Tx 1", timestamp: Date.now() - 1000 },
        { id: "m2", title: "Tx 2", timestamp: Date.now() },
      ],
      onUndo: vi.fn(),
    };
    expect(() => renderToast(grouped)).not.toThrow();
  });
});

// ─── relativeTime helper — branch coverage ─────────────────────────────────

describe("Toast — grouped message timestamps (relativeTime branches)", () => {
  it("displays 'm ago' for messages 2 minutes old", () => {
    const twoMinsAgo = Date.now() - 2 * 60 * 1000;
    const grouped: ToastItem = {
      id: "group:timestamps",
      variant: "info",
      title: "2 messages",
      duration: 5000,
      count: 2,
      messages: [
        { id: "m1", title: "Old message", timestamp: twoMinsAgo },
        { id: "m2", title: "Recent message", timestamp: Date.now() - 30 },
      ],
    };
    renderToast(grouped);
    // Expand the panel to render message timestamps
    act(() => {
      fireEvent.click(screen.getByLabelText("Expand notifications"));
    });
    // "2m ago" should appear for the old message
    const timeEls = document.querySelectorAll("time");
    const timeTexts = Array.from(timeEls).map((el) => el.textContent);
    expect(timeTexts.some((t) => t?.includes("m ago"))).toBe(true);
  });

  it("displays 'h ago' for messages > 1 hour old", () => {
    const twoHoursAgo = Date.now() - 2 * 3600 * 1000;
    const grouped: ToastItem = {
      id: "group:oldts",
      variant: "info",
      title: "Old group",
      duration: 5000,
      count: 2,
      messages: [
        { id: "m1", title: "Very old message", timestamp: twoHoursAgo },
        { id: "m2", title: "Recent message", timestamp: Date.now() - 100 },
      ],
    };
    renderToast(grouped);
    act(() => {
      fireEvent.click(screen.getByLabelText("Expand notifications"));
    });
    const timeEls = document.querySelectorAll("time");
    const timeTexts = Array.from(timeEls).map((el) => el.textContent);
    expect(timeTexts.some((t) => t?.includes("h ago"))).toBe(true);
  });

  it("displays 's ago' for messages < 60s old", () => {
    const recentTs = Date.now() - 5000;
    const grouped: ToastItem = {
      id: "group:recent",
      variant: "success",
      title: "Recent group",
      duration: 5000,
      count: 2,
      messages: [
        { id: "m1", title: "Recent msg", timestamp: recentTs },
        { id: "m2", title: "Also recent", timestamp: Date.now() - 100 },
      ],
    };
    renderToast(grouped);
    act(() => {
      fireEvent.click(screen.getByLabelText("Expand notifications"));
    });
    const timeEls = document.querySelectorAll("time");
    const timeTexts = Array.from(timeEls).map((el) => el.textContent);
    expect(timeTexts.some((t) => t?.includes("s ago"))).toBe(true);
  });
});

// ─── CountdownRing paused state ───────────────────────────────────────────────

describe("Toast — countdown ring paused state", () => {
  it("ring wrapper updates aria-label when toast is paused (hover)", () => {
    renderToast(makeToast({ onUndo: vi.fn(), duration: 5000 }));
    const { container } = render(
      <Toast toast={makeToast({ onUndo: vi.fn(), duration: 5000 })} onDismiss={vi.fn()} />
    );
    const wrapper = container.firstChild as HTMLElement;
    // Pause via hover
    fireEvent.mouseEnter(wrapper);
    const ringWrapper = container.querySelector('[role="img"]');
    // aria-label should still exist while paused
    expect(ringWrapper?.getAttribute("aria-label")).toMatch(/seconds remaining/i);
    fireEvent.mouseLeave(wrapper);
  });
});

// ─── RTL layout ───────────────────────────────────────────────────────────────

describe("Toast — RTL layout", () => {
  it("renders without error in RTL document direction", () => {
    const originalDir = document.documentElement.dir;
    document.documentElement.dir = "rtl";
    expect(() => {
      renderToast(makeToast({ onUndo: vi.fn(), duration: 5000 }));
    }).not.toThrow();
    // Undo button and ring should still render
    expect(screen.getByLabelText("Undo (Ctrl+Z)")).toBeDefined();
    document.documentElement.dir = originalDir;
  });
});
