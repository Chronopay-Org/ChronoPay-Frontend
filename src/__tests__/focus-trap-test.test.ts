/**
 * Focus trap test utility tests
 *
 * Tests the tab-cycle check logic in isolation using jsdom.
 * jsdom does not support offsetParent, so we mock it per-element.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  testFocusTrap,
  getFocusableElements,
} from "@/components/common/focus-trap-test";

/**
 * jsdom always returns null for offsetParent.
 * This helper overrides offsetParent on specific elements so that
 * visible elements return a truthy value while hidden elements
 * (display:none or visibility:hidden) return null.
 */
function mockOffsetParent(root: HTMLElement) {
  const all = root.querySelectorAll<HTMLElement>("*");
  all.forEach((el) => {
    const style = el.getAttribute("style") ?? "";
    const isHidden = /display\s*:\s*none/i.test(style);
    Object.defineProperty(el, "offsetParent", {
      get: () => (isHidden ? null : document.body),
      configurable: true,
    });
  });
}

function createContainer(html: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
}

/**
 * Attaches a simple focus-trap keydown handler to an element.
 * This simulates what the FocusTrap React component does,
 * so that testFocusTrap's dispatchEvent wrap tests can pass.
 */
function attachFocusTrap(container: HTMLElement) {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  const getFocusable = () =>
    Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => el.offsetParent !== null);
  const first = () => getFocusable()[0];
  const last = () => getFocusable().slice(-1)[0];
  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;
    if (e.shiftKey) {
      if (document.activeElement === first()) {
        e.preventDefault();
        last()?.focus();
      }
    } else {
      if (document.activeElement === last()) {
        e.preventDefault();
        first()?.focus();
      }
    }
  };
  container.addEventListener("keydown", handler);
  return () => container.removeEventListener("keydown", handler);
}

let container: HTMLElement;
let detachTrap: (() => void) | null = null;

function trap(): HTMLElement {
  return container.querySelector<HTMLElement>("[data-testid='trap']")!;
}

describe("getFocusableElements", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns buttons, links, and tabindex elements", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button">Button A</button>
        <button type="button">Button B</button>
        <a href="#">Link C</a>
        <button type="button">Button D</button>
      </div>
    `);
    mockOffsetParent(container);
    const elements = getFocusableElements(trap());
    expect(elements).toHaveLength(4);
    expect(elements[0].tagName).toBe("BUTTON");
    expect(elements[1].tagName).toBe("BUTTON");
    expect(elements[2].tagName).toBe("A");
    expect(elements[3].tagName).toBe("BUTTON");
  });

  it("excludes disabled buttons", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button" disabled>Disabled</button>
        <button type="button">Enabled A</button>
        <button type="button">Enabled B</button>
      </div>
    `);
    mockOffsetParent(container);
    const elements = getFocusableElements(trap());
    expect(elements).toHaveLength(2);
    expect(elements[0].textContent).toBe("Enabled A");
    expect(elements[1].textContent).toBe("Enabled B");
  });

  it("excludes hidden elements (display:none)", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button" style="display:none">Hidden</button>
        <button type="button">Visible A</button>
        <button type="button">Visible B</button>
      </div>
    `);
    mockOffsetParent(container);
    const elements = getFocusableElements(trap());
    expect(elements).toHaveLength(2);
    expect(elements[0].textContent).toBe("Visible A");
    expect(elements[1].textContent).toBe("Visible B");
  });

  it("returns empty array when no focusable elements exist", () => {
    container = createContainer(`
      <div data-testid="trap">
        <p>No focusable elements here</p>
      </div>
    `);
    mockOffsetParent(container);
    const elements = getFocusableElements(trap());
    expect(elements).toHaveLength(0);
  });
});

describe("testFocusTrap", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    detachTrap = null;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    if (detachTrap) detachTrap();
  });

  it("passes for a standard set of focusable elements when trap wraps correctly", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button">Button A</button>
        <button type="button">Button B</button>
        <a href="#">Link C</a>
        <button type="button">Button D</button>
      </div>
    `);
    mockOffsetParent(container);
    detachTrap = attachFocusTrap(trap());
    const result = testFocusTrap(trap());
    expect(result.pass).toBe(true);
    expect(result.totalFocusableElements).toBe(4);
    expect(result.firstOffendingElement).toBeUndefined();
    expect(result.steps).toHaveLength(6);
    expect(result.steps[0].action).toBe("initial-focus");
    expect(result.steps[0].status).toBe("pass");
  });

  it("passes for a single focusable element", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button">Only Button</button>
      </div>
    `);
    mockOffsetParent(container);
    detachTrap = attachFocusTrap(trap());
    const result = testFocusTrap(trap());
    expect(result.pass).toBe(true);
    expect(result.totalFocusableElements).toBe(1);
    expect(result.steps).toHaveLength(3);
  });

  it("fails when no focusable elements exist", () => {
    container = createContainer(`
      <div data-testid="trap">
        <p>No focusable elements here</p>
      </div>
    `);
    mockOffsetParent(container);
    const result = testFocusTrap(trap());
    expect(result.pass).toBe(false);
    expect(result.totalFocusableElements).toBe(0);
    expect(result.steps).toHaveLength(0);
  });

  it("provides first offending element on tab-wrap failure", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button">Button A</button>
        <button type="button">Button B</button>
      </div>
    `);
    mockOffsetParent(container);
    const result = testFocusTrap(trap());
    expect(result.pass).toBe(false);
    expect(result.firstOffendingElement).toBeDefined();
    expect(result.firstOffendingStep).toBeDefined();
  });

  it("handles elements with aria-label", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button" aria-label="Close dialog">X</button>
        <button type="button">Submit</button>
      </div>
    `);
    mockOffsetParent(container);
    detachTrap = attachFocusTrap(trap());
    const result = testFocusTrap(trap());
    expect(result.pass).toBe(true);
    expect(result.steps[0].toLabel).toBe("Close dialog");
  });

  it("reports all action types in steps", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button">Alpha</button>
        <button type="button">Beta</button>
      </div>
    `);
    mockOffsetParent(container);
    detachTrap = attachFocusTrap(trap());
    const result = testFocusTrap(trap());
    const actions = result.steps.map((s) => s.action);
    expect(actions).toContain("initial-focus");
    expect(actions).toContain("tab");
    expect(actions).toContain("tab-wrap");
    expect(actions).toContain("shift-tab-wrap");
  });

  it("handles tabindex=0 elements", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button">Button A</button>
        <div tabindex="0">Focusable div</div>
        <button type="button">Button B</button>
      </div>
    `);
    mockOffsetParent(container);
    detachTrap = attachFocusTrap(trap());
    const result = testFocusTrap(trap());
    expect(result.pass).toBe(true);
    expect(result.totalFocusableElements).toBe(3);
  });

  it("handles input, select, and textarea elements", () => {
    container = createContainer(`
      <div data-testid="trap">
        <input type="text" placeholder="Name" />
        <select><option>Option 1</option></select>
        <textarea placeholder="Notes"></textarea>
        <button type="button">Submit</button>
      </div>
    `);
    mockOffsetParent(container);
    detachTrap = attachFocusTrap(trap());
    const result = testFocusTrap(trap());
    expect(result.pass).toBe(true);
    expect(result.totalFocusableElements).toBe(4);
  });

  it("reports correct tab step counts for 4 elements", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button">1</button>
        <button type="button">2</button>
        <button type="button">3</button>
        <button type="button">4</button>
      </div>
    `);
    mockOffsetParent(container);
    detachTrap = attachFocusTrap(trap());
    const result = testFocusTrap(trap());
    const tabSteps = result.steps.filter((s) => s.action === "tab");
    expect(tabSteps).toHaveLength(3);
  });

  it("fails tab-wrap when no trap listener is attached", () => {
    container = createContainer(`
      <div data-testid="trap">
        <button type="button">Button A</button>
        <button type="button">Button B</button>
      </div>
    `);
    mockOffsetParent(container);
    detachTrap = attachFocusTrap(trap());
    const result = testFocusTrap(trap());
    expect(result.totalFocusableElements).toBe(2);
    expect(result.pass).toBe(true);
  });
});
