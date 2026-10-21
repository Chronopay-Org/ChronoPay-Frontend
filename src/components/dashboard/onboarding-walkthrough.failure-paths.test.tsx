/**
 * Focused regression coverage for the failure / empty-result paths of
 * `OnboardingWalkthrough` (issue #981).
 *
 * Branch evidence in `onboarding-walkthrough.tsx`:
 *   - `measureTarget`      → `if (!el) return null;`            (line 72)
 *   - `OnboardingWalkthrough` → `if (!open || !step) return null;` (line 161)
 *
 * The contract is: a walkthrough with no current step, or with a target that
 * is not in the DOM, renders **nothing at all** (never a half-drawn overlay),
 * and a target that is missing when it opens is picked up again on the next
 * scroll/resize once it appears. This suite pins that, the spotlight
 * geometry/clamping boundaries, and the reduced-motion scroll branch.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OnboardingWalkthrough, DEFAULT_WALKTHROUGH_STEPS } from "./onboarding-walkthrough";

const SPOTLIGHT_SELECTOR = ".ring-cyan-300\\/80";

function spotlight(): HTMLElement | null {
  return document.querySelector<HTMLElement>(SPOTLIGHT_SELECTOR);
}

function mountTarget(target: string, rect?: Partial<DOMRect>): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("data-tour-target", target);
  const full: DOMRect = {
    top: 100,
    left: 40,
    width: 200,
    height: 80,
    right: 240,
    bottom: 180,
    x: 40,
    y: 100,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect;
  el.getBoundingClientRect = () => full;
  document.body.appendChild(el);
  return el;
}

function setup(props: Partial<React.ComponentProps<typeof OnboardingWalkthrough>> = {}) {
  const onSkip = vi.fn();
  const onComplete = vi.fn();
  const onClearSamples = vi.fn();
  const result = render(
    <OnboardingWalkthrough
      open
      onSkip={onSkip}
      onComplete={onComplete}
      onClearSamples={onClearSamples}
      {...props}
    />,
  );
  return { ...result, onSkip, onComplete, onClearSamples };
}

describe("OnboardingWalkthrough failure paths (#981)", () => {
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView as unknown as () => void;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("empty step list: the `!step` branch renders nothing", () => {
    it("renders nothing when open with no steps", () => {
      const { container } = setup({ steps: [] });
      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("renders nothing when closed with no steps", () => {
      const { container } = setup({ steps: [], open: false });
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when closed with steps", () => {
      const { container } = setup({ open: false });
      expect(container).toBeEmptyDOMElement();
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("renders the dialog again as soon as steps are supplied", () => {
      const { rerender, container, onSkip, onComplete, onClearSamples } = setup({ steps: [] });
      expect(container).toBeEmptyDOMElement();

      rerender(
        <OnboardingWalkthrough
          open
          steps={DEFAULT_WALKTHROUGH_STEPS}
          onSkip={onSkip}
          onComplete={onComplete}
          onClearSamples={onClearSamples}
        />,
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not render an empty-list footer (no step counter) when there are no steps", () => {
      setup({ steps: [] });
      expect(document.body.textContent).not.toMatch(/Walkthrough · 0\/0/);
      expect(document.body.textContent).not.toMatch(/Step 1 of 0/);
    });
  });

  describe("missing target: `measureTarget` returns null", () => {
    it("mounts the dialog with no spotlight and no scroll attempt", () => {
      setup(); // no targets mounted at all
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(spotlight()).toBeNull();
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("only matches an exact data-tour-target value", () => {
      mountTarget("metrics-extra"); // prefix of the first step's target
      setup();
      expect(spotlight()).toBeNull();
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("picks the target up on the next resize after it appears", async () => {
      setup({ steps: [DEFAULT_WALKTHROUGH_STEPS[0]] });
      expect(spotlight()).toBeNull();

      mountTarget("metrics");
      fireEvent(window, new Event("resize"));

      await waitFor(() => expect(spotlight()).not.toBeNull());
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
    });

    it("drops the spotlight again when the measured target is removed", async () => {
      const el = mountTarget(DEFAULT_WALKTHROUGH_STEPS[0].target);
      setup({ steps: [DEFAULT_WALKTHROUGH_STEPS[0]] });
      await waitFor(() => expect(spotlight()).not.toBeNull());

      el.remove();
      fireEvent(window, new Event("resize"));
      await waitFor(() => expect(spotlight()).toBeNull());
    });
  });

  describe("spotlight geometry boundaries", () => {
    it("pads the highlighted rect by 8px on every side and scrolls it into view", async () => {
      mountTarget(DEFAULT_WALKTHROUGH_STEPS[0].target);
      setup({ steps: [DEFAULT_WALKTHROUGH_STEPS[0]] });

      await waitFor(() => expect(spotlight()).not.toBeNull());
      const style = spotlight()!.style;
      expect(style.top).toBe("92px"); // 100 - 8
      expect(style.left).toBe("32px"); // 40 - 8
      expect(style.width).toBe("216px"); // 200 + 16
      expect(style.height).toBe("96px"); // 80 + 16
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
    });

    it("clamps a target that sits above/left of the viewport to 0", async () => {
      mountTarget(DEFAULT_WALKTHROUGH_STEPS[0].target, { top: -120, left: -30 });
      setup({ steps: [DEFAULT_WALKTHROUGH_STEPS[0]] });

      await waitFor(() => expect(spotlight()).not.toBeNull());
      const style = spotlight()!.style;
      expect(style.top).toBe("0px");
      expect(style.left).toBe("0px");
      // Size still reflects the real element, not the clamped origin.
      expect(style.width).toBe("216px");
      expect(style.height).toBe("96px");
    });

    it("uses instant scrolling when the user prefers reduced motion", async () => {
      mountTarget(DEFAULT_WALKTHROUGH_STEPS[0].target);
      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList);

      setup({ steps: [DEFAULT_WALKTHROUGH_STEPS[0]] });

      await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "auto" });
    });

    it("falls back to smooth scrolling when matchMedia is unavailable", async () => {
      mountTarget(DEFAULT_WALKTHROUGH_STEPS[0].target);
      const original = window.matchMedia;
      Object.defineProperty(window, "matchMedia", {
        value: undefined,
        configurable: true,
        writable: true,
      });
      try {
        setup({ steps: [DEFAULT_WALKTHROUGH_STEPS[0]] });
        await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
        expect(scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
      } finally {
        Object.defineProperty(window, "matchMedia", {
          value: original,
          configurable: true,
          writable: true,
        });
      }
    });
  });

  describe("scroll lock is restored on every exit path", () => {
    it("locks the body while open and restores the previous value on unmount", () => {
      document.body.style.overflow = "scroll";
      const { unmount } = setup({ steps: [DEFAULT_WALKTHROUGH_STEPS[0]] });
      expect(document.body.style.overflow).toBe("hidden");

      unmount();
      expect(document.body.style.overflow).toBe("scroll");
      document.body.style.overflow = "";
    });

    it("does not touch the body when the walkthrough is closed", () => {
      document.body.style.overflow = "auto";
      setup({ open: false });
      expect(document.body.style.overflow).toBe("auto");
      document.body.style.overflow = "";
    });
  });

  describe("step navigation boundaries", () => {
    beforeEach(() => mountTarget(DEFAULT_WALKTHROUGH_STEPS[0].target));

    it("hides Back on the first step and clamps Next on the last step", () => {
      setup();
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();

      // Walk to the final step and keep pressing Next: the counter must stay put.
      const last = DEFAULT_WALKTHROUGH_STEPS.length;
      for (let i = 2; i < last; i++) {
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
      }
      expect(screen.getByText(new RegExp(`Walkthrough · ${last}/${last}`))).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Clear samples" })).toBeInTheDocument();
    });

    it("cannot go back past the first step", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      fireEvent.click(screen.getByRole("button", { name: "Back" }));

      // Back to the first step: the Back control is removed, not disabled.
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
      expect(screen.getByText(/Walkthrough · 1\/3/)).toBeInTheDocument();

      // And Next still advances normally afterwards.
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(screen.getByText(/Walkthrough · 2\/3/)).toBeInTheDocument();
    });
  });
});
