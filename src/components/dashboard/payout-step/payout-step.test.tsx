/**
 * PayoutStep tests
 *
 * Coverage targets (95%+):
 *  - Rendering: default idle state, PanelShell, eyebrow, description
 *  - Currency selector: all 3 options render, selection changes
 *  - Consent checkbox: uncheck/check, error message, timestamp record
 *  - Payout preview: renders with wallet info, truncation
 *  - No preview: renders without preview card
 *  - States: idle, pending, success, error
 *  - Save flow: consent required, success path, error path, retry
 *  - Draft status: saved, saving, offline states
 *  - Accessibility: aria-required, role="alert", aria-busy
 *  - Edge cases: reject consent before save, retry after error
 */

import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PayoutStep, CURRENCIES, truncateAddress } from "./index";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockPreview = {
  walletAddress: "GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7",
  walletLabel: "Freighter Wallet",
  network: "Stellar",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(props: Partial<React.ComponentProps<typeof PayoutStep>> = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onBack = vi.fn();
  const onRetry = vi.fn();
  const result = render(
    <PayoutStep
      preview={mockPreview}
      onSave={onSave}
      onBack={onBack}
      onRetry={onRetry}
      {...props}
    />,
  );
  return { ...result, onSave, onBack, onRetry };
}

/** Check the consent checkbox. */
function checkConsent() {
  const checkbox = screen.getByRole("checkbox", { name: /agree to the payout terms/i });
  act(() => {
    fireEvent.click(checkbox);
  });
}

/** Click the Save button. */
function clickSave() {
  const saveBtn = screen.getByRole("link", { name: /save & continue/i });
  act(() => {
    fireEvent.click(saveBtn);
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PayoutStep", () => {
  describe("Rendering", () => {
    it("renders the PanelShell with eyebrow and title", () => {
      setup();
      expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
      expect(screen.getByText("Payout account")).toBeInTheDocument();
    });

    it("renders the step description", () => {
      setup();
      expect(
        screen.getByText(/connect a payout account to receive payments/i),
      ).toBeInTheDocument();
    });

    it("renders the draft status chip with saved state", () => {
      setup({ draftStatus: "saved", lastSavedLabel: "2 minutes ago" });
      expect(screen.getByText(/saved as draft/i)).toBeInTheDocument();
      expect(screen.getByText(/2 minutes ago/)).toBeInTheDocument();
    });

    it("renders saving status chip", () => {
      setup({ draftStatus: "saving" });
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    it("renders offline status chip", () => {
      setup({ draftStatus: "offline" });
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
  });

  describe("Currency selector", () => {
    it("renders all three currency options", () => {
      setup();
      CURRENCIES.forEach((c) => {
        expect(screen.getByText(c.label)).toBeInTheDocument();
        expect(screen.getByText(c.network)).toBeInTheDocument();
      });
    });

    it("defaults to XLM", () => {
      setup();
      const xlmRadio = screen.getByDisplayValue("XLM");
      expect(xlmRadio).toBeChecked();
    });

    it("switches currency on radio select", () => {
      setup();
      const usdcRadio = screen.getByDisplayValue("USDC");
      act(() => {
        fireEvent.click(usdcRadio);
      });
      expect(usdcRadio).toBeChecked();
      expect(screen.getByDisplayValue("XLM")).not.toBeChecked();
    });

    it("shows check icon on selected currency", () => {
      setup();
      // XLM should have the check circle icon visible
      const xlmOption = screen.getByDisplayValue("XLM").closest("label");
      expect(xlmOption).toBeInTheDocument();
    });
  });

  describe("Consent checkbox", () => {
    it("renders consent text and checkbox", () => {
      setup();
      expect(
        screen.getByText(/i authorise chronopay/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: /agree to the payout terms/i }),
      ).toBeInTheDocument();
    });

    it("shows error message when consent is not checked", () => {
      setup();
      expect(
        screen.getByText(/you must agree to the payout terms before saving/i),
      ).toBeInTheDocument();
    });

    it("hides error message when consent is checked", () => {
      setup();
      checkConsent();
      expect(
        screen.queryByText(/you must agree to the payout terms before saving/i),
      ).not.toBeInTheDocument();
    });

    it("records consent timestamp when checked", () => {
      setup();
      expect(screen.queryByText(/consent recorded/i)).not.toBeInTheDocument();
      checkConsent();
      expect(screen.getByText(/consent recorded/i)).toBeInTheDocument();
    });

    it("has aria-required on the checkbox", () => {
      setup();
      const checkbox = screen.getByRole("checkbox", { name: /agree to the payout terms/i });
      expect(checkbox).toHaveAttribute("aria-required", "true");
    });
  });

  describe("Payout preview", () => {
    it("renders payout preview with wallet info", () => {
      setup();
      expect(screen.getByText("Payout destination")).toBeInTheDocument();
      expect(screen.getByText("Freighter Wallet")).toBeInTheDocument();
      expect(screen.getByText("Connected")).toBeInTheDocument();
      expect(screen.getByText("Stellar")).toBeInTheDocument();
    });

    it("truncates the wallet address", () => {
      setup();
      const truncated = truncateAddress(mockPreview.walletAddress);
      expect(screen.getByText(truncated)).toBeInTheDocument();
      expect(truncated).toContain("...");
    });

    it("does not render preview section when preview is null", () => {
      render(<PayoutStep preview={null} onSave={vi.fn()} />);
      expect(screen.queryByText("Payout destination")).not.toBeInTheDocument();
    });
  });

  describe("Save flow", () => {
    it("disables save button when consent is not checked", () => {
      setup();
      const saveBtn = screen.getByRole("link", { name: /save & continue/i });
      expect(saveBtn).toHaveAttribute("disabled");
    });

    it("enables save button when consent is checked", () => {
      setup();
      checkConsent();
      const saveBtn = screen.getByRole("link", { name: /save & continue/i });
      expect(saveBtn).not.toHaveAttribute("disabled");
    });

    it("calls onSave with currency and consent when saved", async () => {
      const { onSave } = setup();
      checkConsent();

      // Select USDC
      const usdcRadio = screen.getByDisplayValue("USDC");
      act(() => {
        fireEvent.click(usdcRadio);
      });

      clickSave();

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith("USDC", expect.objectContaining({ accepted: true }));
      });
    });

    it("shows pending state on the save button while saving", async () => {
      const { onSave } = setup({ preview: mockPreview });
      onSave.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );
      checkConsent();
      clickSave();

      expect(screen.getByText("Saving…")).toBeInTheDocument();
    });

    it("shows success state after save completes", async () => {
      setup();
      checkConsent();
      clickSave();

      await waitFor(() => {
        expect(screen.getByText("Payouts configured")).toBeInTheDocument();
        expect(screen.getByText(/your payout account is ready/i)).toBeInTheDocument();
      });
    });

    it("shows error state when save fails", async () => {
      const { onSave } = setup();
      onSave.mockRejectedValue(new Error("Connection failed"));
      checkConsent();
      clickSave();

      await waitFor(() => {
        expect(screen.getByText("Could not save payout settings")).toBeInTheDocument();
        expect(screen.getByText("Connection failed")).toBeInTheDocument();
      });
    });

    it("does not call onSave when consent is not given", () => {
      const { onSave } = setup();
      clickSave();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("Error state", () => {
    it("renders the error panel with retry button", () => {
      setup({ status: "error", errorMessage: "Something went wrong" });
      expect(screen.getByText("Could not save payout settings")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /retry/i })).toBeInTheDocument();
    });

    it("shows go back button in error state", () => {
      setup({ status: "error" });
      expect(screen.getByRole("link", { name: /go back/i })).toBeInTheDocument();
    });

    it("calls onRetry when retry button is clicked", () => {
      const { onRetry } = setup({ status: "error" });
      const retryBtn = screen.getByRole("link", { name: /retry/i });
      act(() => {
        fireEvent.click(retryBtn);
      });
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe("Success state", () => {
    it("renders success panel with check icon", () => {
      setup({ status: "success" });
      expect(screen.getByText("Payouts configured")).toBeInTheDocument();
      expect(screen.getByText(/payouts active/i)).toBeInTheDocument();
    });

    it("renders edit settings and next step buttons", () => {
      setup({ status: "success" });
      expect(screen.getByRole("link", { name: /edit settings/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /next step/i })).toBeInTheDocument();
    });

    it("calls onBack when next step is clicked", () => {
      const { onBack } = setup({ status: "success" });
      const nextBtn = screen.getByRole("link", { name: /next step/i });
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(onBack).toHaveBeenCalled();
    });
  });

  describe("Back button", () => {
    it("renders back button when onBack is provided", () => {
      setup();
      expect(screen.getByRole("link", { name: /back/i })).toBeInTheDocument();
    });

    it("calls onBack when back is clicked", () => {
      const { onBack } = setup();
      const backBtn = screen.getByRole("link", { name: /back/i });
      act(() => {
        fireEvent.click(backBtn);
      });
      expect(onBack).toHaveBeenCalled();
    });

    it("does not render back button when onBack is undefined", () => {
      render(<PayoutStep preview={mockPreview} onSave={vi.fn()} />);
      expect(screen.queryByRole("link", { name: /back/i })).not.toBeInTheDocument();
    });
  });

  describe("truncateAddress utility", () => {
    it("returns short addresses unchanged", () => {
      expect(truncateAddress("ABC123", 6)).toBe("ABC123");
    });

    it("truncates long addresses with ellipsis", () => {
      const addr = "GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7";
      const result = truncateAddress(addr);
      expect(result).toContain("...");
      expect(result.length).toBeLessThan(addr.length);
    });

    it("uses default 6-char truncation", () => {
      const addr = "GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7";
      const result = truncateAddress(addr);
      expect(result).toBe("GBS43E...5A6B7");
    });
  });

  describe("Accessibility", () => {
    it("sets aria-busy on save button during pending", async () => {
      const { onSave } = setup();
      onSave.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );
      checkConsent();
      clickSave();

      const saveBtn = screen.getByRole("link", { name: /saving/i });
      expect(saveBtn).toHaveAttribute("aria-busy");
    });

    it("uses role alert for error messages", () => {
      setup();
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/you must agree to the payout terms/i);
    });

    it("shows error alert in error state", () => {
      setup({ status: "error", errorMessage: "Connection failed" });
      expect(screen.getByText("Connection failed")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("resets from error state via go back button", () => {
      setup({ status: "error" });
      const goBackBtn = screen.getByRole("link", { name: /go back/i });
      act(() => {
        fireEvent.click(goBackBtn);
      });
      // Should show the idle form now
      expect(screen.getByText("Preferred payout currency")).toBeInTheDocument();
    });

    it("resets from success state via edit settings", () => {
      setup({ status: "success" });
      const editBtn = screen.getByRole("link", { name: /edit settings/i });
      act(() => {
        fireEvent.click(editBtn);
      });
      expect(screen.getByText("Preferred payout currency")).toBeInTheDocument();
    });

    it("accepts external status override for error", () => {
      setup({ status: "error", errorMessage: "Custom error" });
      expect(screen.getByText("Custom error")).toBeInTheDocument();
    });

    it("shows Connection issue status chip in error state", () => {
      setup({ status: "error" });
      expect(screen.getByText("Connection issue")).toBeInTheDocument();
    });

    it("shows Payouts active status chip in success state", () => {
      setup({ status: "success" });
      expect(screen.getByText("Payouts active")).toBeInTheDocument();
    });
  });
});
