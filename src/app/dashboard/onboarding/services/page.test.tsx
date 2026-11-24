import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ServicesOnboardingPage from "./page";
import { ToastProvider } from "@/hooks/use-toast";

const renderWithToast = (ui: React.ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

describe("ServicesOnboardingPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the demo shell and heading", () => {
    renderWithToast(<ServicesOnboardingPage />);
    expect(screen.getByText("Supplier onboarding demo")).toBeInTheDocument();
    // Use getAllByRole since there are multiple headings with the same text
    expect(screen.getAllByRole("heading", { name: "Services & pricing" }).length).toBeGreaterThan(0);
  });

  it("passes seed items to the services step", () => {
    renderWithToast(<ServicesOnboardingPage />);
    expect(screen.getByDisplayValue("Product strategy call")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Quarterly business review")).toBeInTheDocument();
  });

  it("simulates a save successfully", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithToast(<ServicesOnboardingPage />);

    const saveButton = screen.getByTestId("services-step-save");
    expect(saveButton).not.toHaveAttribute("aria-disabled", "true");

    // Click save
    await user.click(saveButton);

    // The save runs (button busy), then finishes and returns to idle
    await waitFor(() => {
      expect(saveButton).toHaveAttribute("data-state", "busy");
    });
    await waitFor(() => {
      expect(saveButton).toHaveAttribute("data-state", "idle");
    }, { timeout: 2500 });
  });

  it("handles validation and prevents saving invalid state", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithToast(<ServicesOnboardingPage />);

    // Break validation by clearing the title of the first item
    const firstTitleInput = screen.getAllByLabelText(/Service title/i)[0];
    await user.clear(firstTitleInput);

    const saveButton = screen.getByTestId("services-step-save");
    // Since ButtonLink uses an anchor, it sets aria-disabled="true"
    expect(saveButton).toHaveAttribute("aria-disabled", "true");
  });
});
