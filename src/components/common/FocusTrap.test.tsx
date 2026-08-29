import { render, screen, act } from "@testing-library/react";
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
});
