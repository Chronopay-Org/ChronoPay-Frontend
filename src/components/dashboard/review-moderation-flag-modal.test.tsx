import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReviewModerationFlagModal } from "./review-moderation-flag-modal";
import { ToastProvider } from "@/hooks/use-toast";

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("ReviewModerationFlagModal", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders the modal dialog and the available reason options", () => {
    renderWithProviders(<ReviewModerationFlagModal isOpen onClose={() => undefined} />);

    expect(screen.getByRole("dialog", { name: /flag this review/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Spam or scam/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Harassment or abuse/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Something else/i)).toBeInTheDocument();
  });

  it("submits a report when a reason is selected and shows a confirmation toast", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewModerationFlagModal isOpen onClose={() => undefined} reviewId="review-42" />);

    await user.click(screen.getByLabelText(/Misleading review/i));
    await user.type(screen.getByLabelText(/Additional context/i), "The review contains a false claim.");
    await user.click(screen.getByRole("button", { name: /submit report/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows a specific message for already-flagged reviews", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ReviewModerationFlagModal isOpen onClose={() => undefined} isAlreadyFlagged />,
    );

    await user.click(screen.getByRole("button", { name: /submit report/i }));
    expect(screen.getByText(/already being reviewed/i)).toBeInTheDocument();
  });

  it("supports closing with Escape and the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<ReviewModerationFlagModal isOpen onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /close moderation dialog/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("does not submit without a selected reason", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReviewModerationFlagModal isOpen onClose={() => undefined} />);

    await user.click(screen.getByRole("button", { name: /submit report/i }));
    expect(screen.getByText(/Choose a reason before submitting the report/i)).toBeInTheDocument();
  });
});
