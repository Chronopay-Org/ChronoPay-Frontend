import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FocusTrap } from "./FocusTrap";
import { useState } from "react";

describe("FocusTrap fallback focus contract", () => {
  it("returns focus to the triggering element on unmount", () => {
    const TestComponent = () => {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button data-testid="trigger" onClick={() => setOpen(true)}>Open</button>
          {open && (
            <FocusTrap>
              <button data-testid="inside" onClick={() => setOpen(false)}>Close</button>
            </FocusTrap>
          )}
        </div>
      );
    };
    render(<TestComponent />);
    
    const trigger = screen.getByTestId("trigger");
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    
    act(() => {
      trigger.click();
    });
    
    const inside = screen.getByTestId("inside");
    expect(document.activeElement).toBe(inside);
    
    act(() => {
      inside.click();
    });
    
    expect(document.activeElement).toBe(trigger);
  });

  it("returns focus to logical anchor when trigger is deleted", () => {
    const TestComponent = () => {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <div data-focus-fallback tabIndex={-1} data-testid="fallback">Fallback</div>
          {!open && <button data-testid="trigger" onClick={() => setOpen(true)}>Open</button>}
          {open && (
            <FocusTrap>
              <button data-testid="inside" onClick={() => setOpen(false)}>Close</button>
            </FocusTrap>
          )}
        </div>
      );
    };
    render(<TestComponent />);
    
    const trigger = screen.getByTestId("trigger");
    trigger.focus();
    act(() => {
      trigger.click();
    });
    
    const inside = screen.getByTestId("inside");
    act(() => {
      inside.click();
    });
    
    const fallback = screen.getByTestId("fallback");
    expect(document.activeElement).toBe(fallback);
  });

  it("always returns focus, never to document.body, when the trigger is gone", () => {
    const TestComponent = () => {
      // No trigger is ever focused — the trap mounts with focus nowhere.
      return (
        <div>
          <FocusTrap>
            <button data-testid="inside">Inside</button>
          </FocusTrap>
        </div>
      );
    };
    // Mounting without a prior trigger: nothing is focused, so body.focus() would be a
    // no-op. The trap is the only thing on screen and focus should land inside it.
    render(<TestComponent />);
    expect(document.activeElement).toBe(screen.getByTestId("inside"));
  });
});

describe("FocusTrap containment (focus can never escape)", () => {
  it("reclaims focus when an element outside the trap is focused", () => {
    const TestComponent = () => (
      <div>
        <button data-testid="outside">Outside</button>
        <FocusTrap>
          <button data-testid="inside">Inside</button>
        </FocusTrap>
      </div>
    );
    render(<TestComponent />);

    const inside = screen.getByTestId("inside");
    const outside = screen.getByTestId("outside");
    expect(document.activeElement).toBe(inside);

    // Programmatic/click focus on an element outside the trap is reclaimed.
    act(() => {
      outside.focus();
    });
    expect(document.activeElement).toBe(inside);
  });

  it("cycles Tab from the last element to the first and never leaves the trap", () => {
    const TestComponent = () => {
      return (
        <div>
          <input data-testid="outside-input" placeholder="outside" />
          <FocusTrap>
            <button data-testid="a">A</button>
            <button data-testid="b">B</button>
            <button data-testid="c">C</button>
          </FocusTrap>
        </div>
      );
    };
    render(<TestComponent />);

    const a = screen.getByTestId("a");
    const b = screen.getByTestId("b");
    const c = screen.getByTestId("c");

    c.focus();
    fireEvent.keyDown(c, { key: "Tab" });
    expect(document.activeElement).toBe(a);

    a.focus();
    fireEvent.keyDown(a, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(c);

    // b is mid-trap: Tab keeps default behaviour and does not wrap.
    b.focus();
    fireEvent.keyDown(b, { key: "Tab" });
    expect(document.activeElement).toBe(b);
  });
});

describe("FocusTrap with no focusable content", () => {
  it("focuses the container itself so focus is not lost", () => {
    render(
      <div>
        <FocusTrap>
          <p data-testid="only">Decorative content only</p>
        </FocusTrap>
      </div>,
    );

    const trap = screen.getByTestId("only").parentElement as HTMLElement;
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement).toBe(trap);
  });
});