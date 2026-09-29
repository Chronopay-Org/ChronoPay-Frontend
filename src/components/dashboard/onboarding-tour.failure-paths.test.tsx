/**
 * Focused regression coverage for the failure / empty-result paths of
 * `OnboardingTourStep` (issue #980).
 *
 * Branch evidence in `onboarding-tour.tsx`:
 *   - `measureTarget`  → `if (!el) return null;`                        (line 68)
 *   - `OnboardingTour` → `if (!open || !currentStep || !spotlight) return null;` (line 190)
 *
 * The third arm (`!spotlight`) is the interesting one: the tour stays fully
 * unmounted until the step's `data-tour-target` element has been measured, so a
 * missing target must never paint a cursor-less overlay. This suite also pins
 * the coach-mark placement boundaries and the keyboard/step-index contract.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OnboardingTour, DEFAULT_TOUR_STEPS, type OnboardingTourStep } from "./onboarding-tour";

const FIRST = DEFAULT_TOUR_STEPS[0];

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

const dialog = () => screen.queryByRole("dialog");
const spotlightRect = () => document.querySelector<SVGRectElement>('svg rect');
const coachMark = () => document.querySelector<HTMLElement>('[role="dialog"] div[style]');

function setup(props: Partial<React.ComponentProps<typeof OnboardingTour>> = {}) {
  const onComplete = vi.fn();
  const result = render(<OnboardingTour open onComplete={onComplete} {...props} />);
  return { ...result, onComplete };
}

describe("OnboardingTour failure paths (#980)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("missing spotlight: the `!spotlight` arm renders nothing", () => {
    it("stays unmounted while the step target is absent", () => {
      const { container } = setup();
      expect(container).toBeEmptyDOMElement();
      expect(dialog()).toBeNull();
      expect(spotlightRect()).toBeNull();
    });

    it("only matches an exact data-tour-target value", () => {
      mountTarget("wallet"); // DEFAULT_TOUR_STEPS[0].target is "wallet-card"
      const { container } = setup();
      expect(container).toBeEmptyDOMElement();
      expect(dialog()).toBeNull();
    });

    it("stays unmounted for an empty step list", () => {
      mountTarget(FIRST.target);
      const { container } = setup({ steps: [] });
      expect(container).toBeEmptyDOMElement();
      expect(document.body.textContent).not.toMatch(/Step \d+ of 0/);
    });

    it("stays unmounted while closed even with a valid target", () => {
      mountTarget(FIRST.target);
      const { container } = setup({ open: false });
      expect(container).toBeEmptyDOMElement();
    });

    it("mounts on the next scroll once the target appears", async () => {
      setup();
      expect(dialog()).toBeNull();

      mountTarget(FIRST.target);
      fireEvent(window, new Event("scroll"));

      await waitFor(() => expect(dialog()).toBeInTheDocument());
      expect(screen.getByText(FIRST.title)).toBeInTheDocument();
    });

    it("unmounts again when the measured target disappears", async () => {
      const el = mountTarget(FIRST.target);
      setup();
      await waitFor(() => expect(dialog()).toBeInTheDocument());

      el.remove();
      fireEvent(window, new Event("resize"));

      await waitFor(() => expect(dialog()).toBeNull());
    });
  });

  describe("spotlight geometry boundaries", () => {
    it("paints the padded rect for the measured element", async () => {
      mountTarget(FIRST.target);
      setup();

      await waitFor(() => expect(spotlightRect()).not.toBeNull());
      const rect = spotlightRect()!;
      expect(rect.getAttribute("x")).toBe("32"); // 40 - 8 pad, plus scrollX (0)
      expect(rect.getAttribute("y")).toBe("92"); // 100 - 8 pad, plus scrollY (0)
      expect(rect.getAttribute("width")).toBe("216");
      expect(rect.getAttribute("height")).toBe("96");
      expect(rect.getAttribute("rx")).toBe("8");
    });

    it("clamps a target above/left of the viewport to 0 without shrinking it", async () => {
      mountTarget(FIRST.target, { top: -200, left: -50 });
      setup();

      await waitFor(() => expect(spotlightRect()).not.toBeNull());
      const rect = spotlightRect()!;
      expect(rect.getAttribute("x")).toBe("0");
      expect(rect.getAttribute("y")).toBe("0");
      expect(rect.getAttribute("width")).toBe("216");
      expect(rect.getAttribute("height")).toBe("96");
    });
  });

  describe("coach-mark placement contract", () => {
    const stepAt = (position?: OnboardingTourStep["position"]): OnboardingTourStep[] => [
      { id: "only", target: "wallet-card", title: "Only step", body: "Body", position },
    ];

    beforeEach(() => mountTarget(FIRST.target));

    it("places the default coach mark below the spotlight", async () => {
      setup({ steps: stepAt() });
      await waitFor(() => expect(coachMark()).not.toBeNull());
      // 92 + 96 + 16 gap
      expect(coachMark()!.style.top).toBe("204px");
      expect(coachMark()!.style.left).toBe("32px");
      expect(coachMark()!.style.maxWidth).toBe("320px");
    });

    it("places the top coach mark above the spotlight and clamps at the viewport edge", async () => {
      setup({ steps: stepAt("top") });
      await waitFor(() => expect(coachMark()).not.toBeNull());
      // 92 - 300 - 16 is negative, so it clamps to the top edge.
      expect(coachMark()!.style.top).toBe("0px");
      expect(coachMark()!.style.left).toBe("32px");
      expect(coachMark()!.style.maxWidth).toBe("320px");
    });

    it("places the left coach mark beside the spotlight and clamps at the viewport edge", async () => {
      setup({ steps: stepAt("left") });
      await waitFor(() => expect(coachMark()).not.toBeNull());
      expect(coachMark()!.style.top).toBe("92px");
      expect(coachMark()!.style.left).toBe("0px");
      expect(coachMark()!.style.maxWidth).toBe("300px");
    });

    it("places the right coach mark after the spotlight without clamping", async () => {
      setup({ steps: stepAt("right") });
      await waitFor(() => expect(coachMark()).not.toBeNull());
      expect(coachMark()!.style.top).toBe("92px");
      expect(coachMark()!.style.left).toBe("264px"); // 32 + 216 + 16
      expect(coachMark()!.style.maxWidth).toBe("300px");
    });
  });

  describe("keyboard and step-index boundaries", () => {
    beforeEach(() => {
      for (const step of DEFAULT_TOUR_STEPS) mountTarget(step.target);
    });

    it("closes on Escape", () => {
      const { onComplete } = setup();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("does not react to keys it does not own", () => {
      const { onComplete } = setup();
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "PageDown" });
      expect(onComplete).not.toHaveBeenCalled();
      expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    });

    it("advances with ArrowRight and space, and retreats with ArrowLeft", () => {
      setup();
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: " " });
      expect(screen.getByText(/Step 3 of 3/)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
    });

    it("cannot step back past the first step", () => {
      setup();
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    });

    it("completes instead of advancing when ArrowRight is pressed on the last step", () => {
      const { onComplete } = setup();
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(screen.getByText(/Step 3 of 3/)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: " " });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("marks exactly one progress dot as current and moves the marker", async () => {
      setup();
      const dots = () =>
        screen.getAllByRole("button", { name: /Go to step/ }) as HTMLElement[];
      expect(dots()).toHaveLength(DEFAULT_TOUR_STEPS.length);
      expect(dots().filter((d) => d.getAttribute("aria-current") === "step")).toHaveLength(1);
      expect(dots()[0].getAttribute("aria-current")).toBe("step");

      fireEvent.click(dots()[2]);
      await waitFor(() => expect(screen.getByText(/Step 3 of 3/)).toBeInTheDocument());
      expect(dots()[0].getAttribute("aria-current")).toBeNull();
      expect(dots()[2].getAttribute("aria-current")).toBe("step");
    });

    it("shows Finish only on the last step and completes once clicked", async () => {
      const { onComplete } = setup();
      expect(screen.queryByText("Finish")).toBeNull();

      fireEvent.click(screen.getByText("Next"));
      fireEvent.click(screen.getByText("Next"));
      const finish = screen.getByText("Finish");

      fireEvent.click(finish);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
