/**
 * OnboardingWalkthrough tests
 *
 * Coverage targets (95%+):
 *  - Closed when open=false
 *  - Dialog semantics + step announcement
 *  - Next / Back navigation
 *  - Skip via button, Escape, and backdrop
 *  - Final Clear samples CTA clears + completes
 *  - Focus trap Tab cycling
 *  - Custom steps
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  OnboardingWalkthrough,
  DEFAULT_WALKTHROUGH_STEPS,
} from "./onboarding-walkthrough";

function mountTargets() {
  for (const step of DEFAULT_WALKTHROUGH_STEPS) {
    const el = document.createElement("div");
    el.setAttribute("data-tour-target", step.target);
    el.textContent = step.target;
    document.body.appendChild(el);
  }
}

function setup(
  props: Partial<React.ComponentProps<typeof OnboardingWalkthrough>> = {},
) {
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

describe("OnboardingWalkthrough", () => {
  beforeEach(() => {
    mountTargets();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = setup({ open: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("opens as a modal dialog on the first step", async () => {
    setup();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: DEFAULT_WALKTHROUGH_STEPS[0].title }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
    });
  });

  it("advances with Next and retreats with Back", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByRole("heading", { name: DEFAULT_WALKTHROUGH_STEPS[1].title }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("heading", { name: DEFAULT_WALKTHROUGH_STEPS[0].title }),
    ).toBeInTheDocument();
  });

  it("skips the tour from the skip control", () => {
    const { onSkip } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("skips on Escape and backdrop click", () => {
    const { onSkip } = setup();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onSkip).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("walkthrough-backdrop"));
    expect(onSkip).toHaveBeenCalledTimes(2);
  });

  it("clears samples and completes on the final CTA", () => {
    const { onClearSamples, onComplete } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear samples" }));
    expect(onClearSamples).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("accepts custom steps", () => {
    setup({
      steps: [
        {
          id: "only",
          target: "metrics",
          title: "Only step",
          body: "Single coach mark.",
        },
      ],
    });
    expect(screen.getByRole("heading", { name: "Only step" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear samples" }),
    ).toBeInTheDocument();
  });

  it("traps focus with Tab and Shift+Tab inside the dialog", () => {
    setup();
    const dialog = screen.getByRole("dialog");
    const buttons = within(dialog).getAllByRole("button");
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("renders without a spotlight when the target is missing", () => {
    setup({
      steps: [
        {
          id: "missing",
          target: "does-not-exist",
          title: "Missing target",
          body: "No spotlight region.",
        },
      ],
    });
    expect(
      screen.getByRole("heading", { name: "Missing target" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".ring-cyan-300\\/80")).toBeNull();
  });

  it("skips via the icon close button", () => {
    const { onSkip } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Skip walkthrough" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
