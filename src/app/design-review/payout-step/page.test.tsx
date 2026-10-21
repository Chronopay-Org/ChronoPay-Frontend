import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PayoutStepDesignReviewPage from "./page";

vi.mock("next/link", () => {
  return {
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
  };
});

describe("PayoutStepDesignReviewPage", () => {
  it("renders the page wrapper and heading", () => {
    render(<PayoutStepDesignReviewPage />);
    expect(screen.getByText("Supplier Payout Step")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Review/i })).toHaveAttribute(
      "href",
      "/design-review"
    );
  });

  describe("Interactive behaviors (via Idle showcase)", () => {
    it("handles invalid inputs: submit is disabled until consent is checked", async () => {
      render(<PayoutStepDesignReviewPage />);
      const user = userEvent.setup();

      const saveButtons = screen.getAllByRole("button", { name: /Save & continue/i });
      const idleSaveButton = saveButtons[0];
      const consentCheckboxes = screen.getAllByRole("checkbox", { name: /I agree to the payout terms/i });
      const idleConsentCheckbox = consentCheckboxes[0];

      expect(idleSaveButton).toBeDisabled();

      await user.click(idleConsentCheckbox);
      expect(idleSaveButton).toBeEnabled();

      await user.click(idleConsentCheckbox);
      expect(idleSaveButton).toBeDisabled();
    });

    it("handles primary state transitions (success flow)", async () => {
      render(<PayoutStepDesignReviewPage />);
      const user = userEvent.setup();

      // Ensure we are interacting with the Idle card
      const saveButtons = screen.getAllByRole("button", { name: /Save & continue/i });
      const idleSaveButton = saveButtons[0];
      const consentCheckboxes = screen.getAllByRole("checkbox", { name: /I agree to the payout terms/i });
      const idleConsentCheckbox = consentCheckboxes[0];

      await user.click(idleConsentCheckbox);
      await user.click(idleSaveButton);

      // Transition to success
      await waitFor(() => {
        // Because other cards might have 'Payouts configured', we check that the first card transitioned.
        // The first card should no longer have 'Save & continue'
        const buttonsNow = screen.queryAllByRole("button", { name: /Save & continue/i });
        // The idle button shouldn't be there, or should be gone
        expect(buttonsNow.length).toBeLessThan(saveButtons.length);
      });
    });
  });

  describe("Showcase deterministic visual states", () => {
    it("displays the Error state deterministic fallback", () => {
      render(<PayoutStepDesignReviewPage />);
      expect(screen.getByText("Error — connection failure")).toBeInTheDocument();
      expect(screen.getByText("Connection timed out. Please check your wallet and try again.")).toBeInTheDocument();
    });

    it("displays the Success state deterministic fallback", () => {
      render(<PayoutStepDesignReviewPage />);
      expect(screen.getByText("Success — payouts configured")).toBeInTheDocument();
      // Verifies the content inside the success card
      const cards = screen.getAllByText("Payouts active");
      expect(cards.length).toBeGreaterThan(0);
    });

    it("displays the Pending state deterministic fallback", () => {
      render(<PayoutStepDesignReviewPage />);
      expect(screen.getByText("Pending — saving in progress")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Simulate save/i })).toBeInTheDocument();
    });

    it("displays the No wallet state fallback", () => {
      render(<PayoutStepDesignReviewPage />);
      expect(screen.getByText("No wallet — no payout preview")).toBeInTheDocument();
    });
  });
});
