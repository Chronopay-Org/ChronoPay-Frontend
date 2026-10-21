import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrderSummaryDrawer } from "./order-summary-drawer";

const TABLET_QUERY = "(min-width: 768px) and (max-width: 1279px)";

type MediaListener = (event: { matches: boolean }) => void;

/** matchMedia stub captured from the global test setup (src/__tests__/setup.ts). */
const originalMatchMedia = window.matchMedia;

/**
 * Controllable matchMedia stub. The global setup always answers
 * `matches: false`, so tests that exercise the tablet layout call
 * `setTabletLayout(...)` and drive `change` events through the same listener
 * channel the component subscribes to in production.
 */
function installMatchMediaStub() {
  const listeners = new Set<MediaListener>();
  let matches = false;

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: TABLET_QUERY,
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: MediaListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: MediaListener) => {
      listeners.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  };

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      if (query !== TABLET_QUERY) {
        return {
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      }
      return mediaQueryList;
    }),
  });

  const setTabletLayout = (next: boolean) => {
    if (matches === next) return;
    matches = next;
    listeners.forEach((listener) => listener({ matches: next }));
  };

  return { setTabletLayout, mediaQueryList };
}

function renderDrawer(props: { title?: string; description?: string } = {}) {
  return render(
    <OrderSummaryDrawer
      title={props.title ?? "Order summary"}
      description={props.description ?? "Review costs and confirm your booking."}
    >
      <div>Summary content</div>
    </OrderSummaryDrawer>,
  );
}

function openDrawer() {
  const trigger = screen.getByRole("button", { name: /review order/i });
  // Focus before opening so FocusTrap captures the trigger as its restore
  // target — this keeps focus assertions deterministic after the panel unmounts.
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = screen.getByRole("dialog", { name: /order summary/i });
  return { trigger, dialog };
}

/** Wraps layout flips in act() because they fire React state updates outside events. */
function setTabletLayout(next: boolean, stub = matchMediaStub) {
  act(() => {
    stub.setTabletLayout(next);
  });
}

let matchMediaStub: ReturnType<typeof installMatchMediaStub>;

beforeEach(() => {
  matchMediaStub = installMatchMediaStub();
});

afterEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
  vi.restoreAllMocks();
  document.body.style.overflow = "";
});

describe("OrderSummaryDrawer", () => {
  describe("media-query effect guard (line 36: `return undefined;`)", () => {
    it("renders the inline fallback layout without subscribing when window.matchMedia is unavailable", () => {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: undefined,
      });
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      renderDrawer();

      // Failure path: the effect takes the `return undefined;` bail-out —
      // no media query is created and nothing is ever subscribed to window
      // (the keydown channel only exists while the drawer is open).
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );

      // The component degrades gracefully to the always-visible layout
      // instead of crashing, so the content contract still holds.
      expect(screen.getByText("Summary content")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /review order/i }),
      ).not.toBeInTheDocument();
    });

    it("renders the inline fallback layout when window.matchMedia exists but is not callable", () => {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: 42,
      });

      renderDrawer();

      // The `typeof window.matchMedia !== "function"` half of the same guard
      // must route to the identical bail-out.
      expect(screen.getByText("Summary content")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /review order/i }),
      ).not.toBeInTheDocument();
    });

    it("keeps the inline layout stable when resize events fire while the guard is active", () => {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      renderDrawer();
      fireEvent.resize(window);

      // Regression guard: with the media-query channel dead, stray viewport
      // notifications must not change the rendered contract.
      expect(screen.getByText("Summary content")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /review order/i }),
      ).not.toBeInTheDocument();
    });

    it("switches to the drawer layout when the media query reports a tablet viewport", () => {
      setTabletLayout(true);

      renderDrawer();

      // Normal path of the same effect: the subscription is what moves the
      // component between the inline and drawer layouts.
      const trigger = screen.getByRole("button", { name: /review order/i });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText("Summary content")).not.toBeInTheDocument();
    });

    it("closes the drawer and restores body scroll when the viewport leaves the tablet range", () => {
      document.body.style.overflow = "auto";
      setTabletLayout(true);

      renderDrawer();
      openDrawer();
      expect(document.body.style.overflow).toBe("hidden");

      setTabletLayout(false);

      // The same handleChange that closes the drawer also resets drag state
      // and tears down the scroll lock via effect cleanup.
      expect(
        screen.queryByRole("dialog", { name: /order summary/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Summary content")).toBeInTheDocument();
      expect(document.body.style.overflow).toBe("auto");
    });

    it("unsubscribes from the media query on unmount", () => {
      setTabletLayout(true);
      const { unmount } = renderDrawer();

      const { mediaQueryList } = matchMediaStub;
      expect(mediaQueryList.addEventListener).toHaveBeenCalledTimes(1);
      expect(mediaQueryList.removeEventListener).not.toHaveBeenCalled();

      unmount();

      // Effect cleanup must remove exactly the listener the effect added.
      expect(mediaQueryList.removeEventListener).toHaveBeenCalledTimes(1);
      expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
        "change",
        mediaQueryList.addEventListener.mock.calls[0]![1],
      );
    });
  });

  describe("scroll-lock effect guard (line 64: `return undefined;`)", () => {
    it("does not lock body scroll or attach a window keydown listener while the drawer is closed", () => {
      setTabletLayout(true);
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      renderDrawer();

      // Empty-result path: with isOpen === false the effect returns
      // undefined immediately — body overflow stays untouched and no Escape
      // handler is ever registered.
      expect(document.body.style.overflow).toBe("");
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
      // The drawer trigger renders but children stay unmounted while closed.
      expect(screen.getByRole("button", { name: /review order/i })).toBeInTheDocument();
      expect(screen.queryByText("Summary content")).not.toBeInTheDocument();
    });

    it("treats Escape pressed while the drawer is closed as a no-op", () => {
      setTabletLayout(true);
      renderDrawer();

      fireEvent.keyDown(window, { key: "Escape" });

      expect(document.body.style.overflow).toBe("");
      expect(
        screen.queryByRole("dialog", { name: /order summary/i }),
      ).not.toBeInTheDocument();
    });

    it("locks body scroll only while open and restores the previous value on close", () => {
      document.body.style.overflow = "auto";
      setTabletLayout(true);
      renderDrawer();
      openDrawer();

      expect(document.body.style.overflow).toBe("hidden");

      fireEvent.keyDown(window, { key: "Escape" });

      expect(document.body.style.overflow).toBe("auto");
      expect(
        screen.queryByRole("dialog", { name: /order summary/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("drawer open/close interactions (normal path)", () => {
    it("opens the editable drawer on tablet breakpoints", () => {
      setTabletLayout(true);

      renderDrawer();
      const { trigger, dialog } = openDrawer();

      expect(dialog).toBeInTheDocument();
      expect(screen.getByText("Summary content")).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(dialog).toHaveAttribute("id", trigger.getAttribute("aria-controls")!);
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("closes the drawer on Escape and restores focus to the trigger", () => {
      setTabletLayout(true);
      renderDrawer();
      const { trigger } = openDrawer();
      trigger.focus();

      fireEvent.keyDown(window, { key: "Escape" });

      expect(
        screen.queryByRole("dialog", { name: /order summary/i }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it("closes the drawer when the backdrop is clicked and restores focus to the trigger", () => {
      setTabletLayout(true);
      renderDrawer();
      const { trigger } = openDrawer();

      fireEvent.click(screen.getByRole("presentation"));

      expect(
        screen.queryByRole("dialog", { name: /order summary/i }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
    it("shows the inline content on non-tablet viewports with no trigger or drawer", () => {
      setTabletLayout(false);

      renderDrawer();

      expect(screen.queryByRole("button", { name: /review order/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Summary content")).toBeVisible();
    });
  });

  describe("drag-to-dismiss boundary inputs", () => {
    // The children render directly inside the scroll region that owns the
    // pointer handlers.
    const dragRegion = () =>
      screen.getByText("Summary content").parentElement as HTMLElement;

    it("keeps the drawer open when the drag distance is exactly at the 80px threshold", () => {
      setTabletLayout(true);
      renderDrawer();
      openDrawer();

      const region = dragRegion();
      fireEvent.pointerDown(region, { clientY: 0 });
      fireEvent.pointerMove(region, { clientY: 80 });
      fireEvent.pointerUp(region);

      // Boundary: only strictly greater than 80px dismisses.
      expect(screen.getByRole("dialog", { name: /order summary/i })).toBeInTheDocument();
    });

    it("closes the drawer when the drag distance passes the 80px threshold", () => {
      setTabletLayout(true);
      renderDrawer();
      const { trigger } = openDrawer();

      const region = dragRegion();
      fireEvent.pointerDown(region, { clientY: 0 });
      fireEvent.pointerMove(region, { clientY: 120 });
      fireEvent.pointerUp(region);

      expect(
        screen.queryByRole("dialog", { name: /order summary/i }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(document.body.style.overflow).toBe("");
    });

    it("ignores upward drags so the drawer cannot be dismissed by pulling down-to-refresh style gestures", () => {
      setTabletLayout(true);
      renderDrawer();
      openDrawer();

      const region = dragRegion();
      fireEvent.pointerDown(region, { clientY: 0 });
      fireEvent.pointerMove(region, { clientY: -60 });
      fireEvent.pointerUp(region);

      expect(screen.getByRole("dialog", { name: /order summary/i })).toBeInTheDocument();
    });
  });
});
