import "@testing-library/jest-dom";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Polyfill IntersectionObserver for test environment
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class MockIntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "0px";
    readonly thresholds: ReadonlyArray<number> = [0];

    constructor(
      private callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}

    observe(_target: Element): void {
      // Fire an initial entry with isIntersecting: true so sticky state is off by default
      this.callback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            target: _target,
            time: Date.now(),
          } as IntersectionObserverEntry,
        ],
        this,
      );
    }

    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

// Polyfill ResizeObserver for test environment
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class MockResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}

