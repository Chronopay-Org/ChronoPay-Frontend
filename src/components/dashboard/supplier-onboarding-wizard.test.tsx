/**
 * supplier-onboarding-wizard.test.tsx
 *
 * Coverage targets (95%+):
 *  - Rendering: heading, progress text, rail steps, active step content
 *  - Per-step validation: Next blocked with inline alert until isComplete
 *  - Navigation: Next/Back, aria-current on the rail, Finish on last step
 *  - Optional steps: skip toggle unblocks Next without validation
 *  - Rail gating: steps beyond the furthest reached step are disabled
 *  - Session persistence: progress and skip state resume across remounts
 *  - Callbacks: onStepChange, onSkipToggle, onComplete
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SupplierOnboardingWizard,
  type SupplierOnboardingStep,
} from "./supplier-onboarding-wizard";

function buildSteps(overrides: Partial<Record<string, Partial<SupplierOnboardingStep>>> = {}): SupplierOnboardingStep[] {
  const base: SupplierOnboardingStep[] = [
    {
      id: "profile",
      title: "Business profile",
      description: "Tell buyers who you are.",
      isComplete: false,
      errorMessage: "Add a business name to continue.",
      content: <div>Profile step content</div>,
    },
    {
      id: "branding",
      title: "Storefront branding",
      description: "Add an optional tagline.",
      optional: true,
      isComplete: false,
      content: <div>Branding step content</div>,
    },
    {
      id: "review",
      title: "Review & submit",
      description: "Confirm your details.",
      isComplete: true,
      content: <div>Review step content</div>,
    },
  ];

  return base.map((step) => ({ ...step, ...(overrides[step.id] ?? {}) }));
}

function railButton(name: RegExp | string) {
  return screen.getByRole("button", { name });
}

beforeEach(() => {
  sessionStorage.clear();
});

describe("SupplierOnboardingWizard", () => {
  it("renders the heading and step 1 of N progress text", () => {
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-1" />);
    expect(screen.getByRole("heading", { name: /supplier onboarding/i })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("renders all rail step titles", () => {
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-2" />);
    const nav = screen.getByRole("navigation", { name: /onboarding steps/i });
    expect(within(nav).getByText("Business profile")).toBeInTheDocument();
    expect(within(nav).getByText("Storefront branding")).toBeInTheDocument();
    expect(within(nav).getByText("Review & submit")).toBeInTheDocument();
  });

  it("renders the active step's content", () => {
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-3" />);
    expect(screen.getByText("Profile step content")).toBeInTheDocument();
  });

  it("marks the current rail step with aria-current='step'", () => {
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-4" />);
    const current = railButton(/Business profile/i);
    expect(current).toHaveAttribute("aria-current", "step");
    const next = railButton(/Storefront branding/i);
    expect(next).not.toHaveAttribute("aria-current");
  });

  it("disables rail steps beyond the furthest reached step", () => {
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-5" />);
    expect(railButton(/Storefront branding/i)).toBeDisabled();
    expect(railButton(/Review & submit/i)).toBeDisabled();
  });

  it("blocks Next and shows an inline alert when the step is incomplete", async () => {
    const user = userEvent.setup();
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-6" />);

    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Add a business name to continue.");
    // still on step 1
    expect(screen.getByText("Profile step content")).toBeInTheDocument();
  });

  it("advances to the next step once isComplete becomes true", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SupplierOnboardingWizard steps={buildSteps()} storageKey="t-7" />,
    );

    rerender(
      <SupplierOnboardingWizard
        steps={buildSteps({ profile: { isComplete: true } })}
        storageKey="t-7"
      />,
    );

    await user.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Branding step content")).toBeInTheDocument();
  });

  it("calls onStepChange with the new step id on navigation", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(
      <SupplierOnboardingWizard
        steps={buildSteps({ profile: { isComplete: true } })}
        storageKey="t-8"
        onStepChange={onStepChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(onStepChange).toHaveBeenCalledWith("branding");
  });

  it("navigates back to the previous step", async () => {
    const user = userEvent.setup();
    render(
      <SupplierOnboardingWizard
        steps={buildSteps({ profile: { isComplete: true } })}
        storageKey="t-9"
      />,
    );

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Profile step content")).toBeInTheDocument();
  });

  it("disables Back on the first step", () => {
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-10" />);
    expect(screen.getByRole("button", { name: /^back$/i })).toBeDisabled();
  });

  it("shows a skip toggle for optional steps and unblocks Next when skipped", async () => {
    const user = userEvent.setup();
    const onSkipToggle = vi.fn();
    render(
      <SupplierOnboardingWizard
        steps={buildSteps({ profile: { isComplete: true } })}
        storageKey="t-11"
        onSkipToggle={onSkipToggle}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();

    const skipSwitch = screen.getByRole("switch", { name: /skip this step for now/i });
    expect(skipSwitch).toHaveAttribute("aria-checked", "false");

    await user.click(skipSwitch);
    expect(skipSwitch).toHaveAttribute("aria-checked", "true");
    expect(onSkipToggle).toHaveBeenCalledWith("branding", true);

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
  });

  it("does not render a skip toggle for required steps", () => {
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-12" />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("labels the Next button 'Finish' on the last step and calls onComplete", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <SupplierOnboardingWizard
        steps={buildSteps({ profile: { isComplete: true }, branding: { isComplete: true } })}
        storageKey="t-13"
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    await user.click(screen.getByRole("button", { name: /^next$/i }));

    const finishBtn = screen.getByRole("button", { name: /^finish$/i });
    expect(finishBtn).toBeInTheDocument();

    await user.click(finishBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("persists and restores step progress across remounts via sessionStorage", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <SupplierOnboardingWizard
        steps={buildSteps({ profile: { isComplete: true } })}
        storageKey="t-14"
      />,
    );

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    unmount();

    render(
      <SupplierOnboardingWizard
        steps={buildSteps({ profile: { isComplete: true } })}
        storageKey="t-14"
      />,
    );
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });

  it("re-enables a previously reached rail step and allows clicking back to it", async () => {
    const user = userEvent.setup();
    render(
      <SupplierOnboardingWizard
        steps={buildSteps({ profile: { isComplete: true } })}
        storageKey="t-15"
      />,
    );

    await user.click(screen.getByRole("button", { name: /^next$/i }));
    const profileRailBtn = railButton(/Business profile/i);
    expect(profileRailBtn).not.toBeDisabled();

    await user.click(profileRailBtn);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("renders a polite live-region announcement for the current step", () => {
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-16" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Step 1 of 3: Business profile");
  });

  it("exposes progress via a progressbar with the correct aria attributes", () => {
    render(<SupplierOnboardingWizard steps={buildSteps()} storageKey="t-17" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "3");
  });

  it("shows the Optional label on optional step titles", async () => {
    const user = userEvent.setup();
    render(
      <SupplierOnboardingWizard
        steps={buildSteps({ profile: { isComplete: true } })}
        storageKey="t-18"
      />,
    );
    await user.click(screen.getByRole("button", { name: /^next$/i }));
    const heading = screen.getByRole("heading", { name: /storefront branding/i });
    expect(within(heading).getByText("Optional")).toBeInTheDocument();
  });

  it("uses a custom heading when provided", () => {
    render(
      <SupplierOnboardingWizard
        steps={buildSteps()}
        storageKey="t-19"
        heading="Become a ChronoPay supplier"
      />,
    );
    expect(
      screen.getByRole("heading", { name: /become a chronopay supplier/i }),
    ).toBeInTheDocument();
  });
});
