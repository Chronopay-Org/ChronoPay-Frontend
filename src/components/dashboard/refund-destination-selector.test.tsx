/**
 * RefundDestinationSelector tests
 *
 * Coverage targets (95%+):
 *  - Default render with PanelShell chrome
 *  - Bare mode heading / description
 *  - Two destination cards (wallet + card)
 *  - Recommended badge on the default (wallet)
 *  - Selection + aria-checked / roving tabIndex
 *  - Keyboard: ArrowRight/Left, ArrowDown/Up, Home/End
 *  - LiveRegion announces default recommendation on mount
 *  - Confirm button opens modal
 *  - Modal: displays destination details, confirm/cancel actions
 *  - Modal: Escape closes, FocusTrap behavior
 *  - onConfirm callback with correct payload
 *  - Custom destinations override
 *  - Disabled confirm button after submission
 *  - Tooltips for ETA and fees present on cards
 *  - Dark mode / light mode via variables (no explicit test needed — CSS-only)
 *  - RTL support via logical properties (no explicit test needed — CSS-only)
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  RefundDestinationSelector,
  type RefundDestinationSelectorProps,
} from "./refund-destination-selector";
import type { RefundDestinationSubmission } from "./types";

function setup(
  props: Partial<RefundDestinationSelectorProps> = {},
) {
  const onConfirm = vi.fn();
  const result = render(
    <RefundDestinationSelector onConfirm={onConfirm} {...props} />,
  );
  return { ...result, onConfirm };
}

describe("RefundDestinationSelector", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("initial render", () => {
    it("renders the default title inside PanelShell", () => {
      setup();
      expect(
        screen.getByRole("heading", { name: "Refund destination" }),
      ).toBeInTheDocument();
    });

    it("renders both destination cards (wallet + card)", () => {
      setup();
      expect(
        screen.getByRole("radio", { name: /ChronoPay Wallet/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Original Card/i }),
      ).toBeInTheDocument();
    });

    it("exposes a radiogroup labelled Select destination", () => {
      setup();
      expect(
        screen.getByRole("radiogroup", { name: "Select destination" }),
      ).toBeInTheDocument();
    });

    it("marks the recommended (wallet) card as aria-checked by default", () => {
      setup();
      const walletRadio = screen.getByRole("radio", {
        name: /ChronoPay Wallet/i,
      });
      expect(walletRadio).toHaveAttribute("aria-checked", "true");

      const cardRadio = screen.getByRole("radio", { name: /Original Card/i });
      expect(cardRadio).toHaveAttribute("aria-checked", "false");
    });

    it("shows the confirm button as enabled initially", () => {
      setup();
      expect(
        screen.getByRole("button", { name: "Confirm refund destination" }),
      ).not.toBeDisabled();
    });

    it("displays ETA and fee details on each card", () => {
      setup();
      expect(screen.getByText("Within minutes")).toBeInTheDocument();
      expect(screen.getByText("No fees")).toBeInTheDocument();
      expect(screen.getByText("3–10 business days")).toBeInTheDocument();
      expect(screen.getByText("Card network fees may apply")).toBeInTheDocument();
    });

    it("shows Recommended badge on the wallet card", () => {
      setup();
      expect(screen.getByText("Recommended")).toBeInTheDocument();
    });

    it("renders tooltip triggers for ETA and fees on each card", () => {
      setup();
      // Each card has 2 tooltips (ETA + fees) = 4 total tooltip triggers
      const etaTooltips = screen.getAllByLabelText(/ETA info/i);
      const feeTooltips = screen.getAllByLabelText(/Fee info/i);
      expect(etaTooltips.length).toBe(2);
      expect(feeTooltips.length).toBe(2);
    });
  });

  describe("bare mode", () => {
    it("renders title and description without PanelShell chrome", () => {
      setup({
        bare: true,
        title: "Where to send refund",
        description: "Pick wallet or card.",
      });
      expect(
        screen.getByRole("heading", { name: "Where to send refund" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Pick wallet or card.")).toBeInTheDocument();

      // PanelShell eyebrow should NOT be rendered in bare mode
      expect(screen.queryByText("Payout")).not.toBeInTheDocument();
    });
  });

  describe("selection", () => {
    it("marks the chosen card as aria-checked when clicked", () => {
      setup();
      const cardRadio = screen.getByRole("radio", { name: /Original Card/i });
      fireEvent.click(cardRadio);
      expect(cardRadio).toHaveAttribute("aria-checked", "true");

      const walletRadio = screen.getByRole("radio", {
        name: /ChronoPay Wallet/i,
      });
      expect(walletRadio).toHaveAttribute("aria-checked", "false");
    });

    it("announces the selected destination via LiveRegion", async () => {
      setup();
      const cardRadio = screen.getByRole("radio", { name: /Original Card/i });
      fireEvent.click(cardRadio);

      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        const status = screen.getByRole("status");
        expect(status.textContent).toContain("Selected: Original Card");
        expect(status.textContent).toContain("3–10 business days");
        expect(status.textContent).toContain("Card network fees may apply");
      });
    });

    it("announces the default (recommended) destination on mount", async () => {
      setup();
      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        const status = screen.getByRole("status");
        expect(status.textContent).toContain("Default refund destination:");
        expect(status.textContent).toContain("ChronoPay Wallet");
        expect(status.textContent).toContain("(recommended)");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("moves selection with ArrowRight", () => {
      setup();
      const walletRadio = screen.getByRole("radio", {
        name: /ChronoPay Wallet/i,
      });
      walletRadio.focus();
      fireEvent.keyDown(walletRadio, { key: "ArrowRight" });
      expect(
        screen.getByRole("radio", { name: /Original Card/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("moves selection with ArrowDown", () => {
      setup();
      const walletRadio = screen.getByRole("radio", {
        name: /ChronoPay Wallet/i,
      });
      walletRadio.focus();
      fireEvent.keyDown(walletRadio, { key: "ArrowDown" });
      expect(
        screen.getByRole("radio", { name: /Original Card/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("wraps from card back to wallet with ArrowRight", () => {
      setup();
      // Select card first
      const cardRadio = screen.getByRole("radio", { name: /Original Card/i });
      fireEvent.click(cardRadio);
      fireEvent.keyDown(cardRadio, { key: "ArrowRight" });
      expect(
        screen.getByRole("radio", { name: /ChronoPay Wallet/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("moves selection with ArrowLeft", () => {
      setup();
      const cardRadio = screen.getByRole("radio", { name: /Original Card/i });
      fireEvent.click(cardRadio);
      fireEvent.keyDown(cardRadio, { key: "ArrowLeft" });
      expect(
        screen.getByRole("radio", { name: /ChronoPay Wallet/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("moves selection with ArrowUp", () => {
      setup();
      const cardRadio = screen.getByRole("radio", { name: /Original Card/i });
      fireEvent.click(cardRadio);
      fireEvent.keyDown(cardRadio, { key: "ArrowUp" });
      expect(
        screen.getByRole("radio", { name: /ChronoPay Wallet/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("jumps to Home and End", () => {
      setup();
      const cardRadio = screen.getByRole("radio", { name: /Original Card/i });
      fireEvent.click(cardRadio);

      fireEvent.keyDown(cardRadio, { key: "Home" });
      expect(
        screen.getByRole("radio", { name: /ChronoPay Wallet/i }),
      ).toHaveAttribute("aria-checked", "true");

      const walletRadio = screen.getByRole("radio", {
        name: /ChronoPay Wallet/i,
      });
      fireEvent.keyDown(walletRadio, { key: "End" });
      expect(
        screen.getByRole("radio", { name: /Original Card/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("ignores unrelated keys", () => {
      setup();
      const walletRadio = screen.getByRole("radio", {
        name: /ChronoPay Wallet/i,
      });
      fireEvent.keyDown(walletRadio, { key: "a" });
      expect(walletRadio).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("confirmation modal", () => {
    it("opens modal when confirm button is clicked", async () => {
      setup();
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm refund destination" }),
      );
      await waitFor(() => {
        expect(
          screen.getByRole("dialog", { name: "Confirm refund destination" }),
        ).toBeInTheDocument();
      });
    });

    it("displays the selected destination details in the modal", async () => {
      setup();
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm refund destination" }),
      );
      await waitFor(() => {
        expect(screen.getByText("Within minutes")).toBeInTheDocument();
        expect(screen.getByText("No fees")).toBeInTheDocument();
        expect(screen.getByText("Recommended")).toBeInTheDocument();
      });
    });

    it("calls onConfirm with correct payload when modal confirm is clicked", async () => {
      const { onConfirm } = setup();

      // select the card option
      fireEvent.click(screen.getByRole("radio", { name: /Original Card/i }));
      // open modal
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm refund destination" }),
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", { name: /Confirm refund to Original Card/i }),
      );

      expect(onConfirm).toHaveBeenCalledTimes(1);
      const payload = onConfirm.mock.calls[0][0] as RefundDestinationSubmission;
      expect(payload.destination).toBe("card");
      expect(payload.option.id).toBe("card");
      expect(payload.option.label).toBe("Original Card");
    });

    it("closes modal when Cancel is clicked", async () => {
      setup();
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm refund destination" }),
      );
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes modal when Escape is pressed", async () => {
      setup();
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm refund destination" }),
      );
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes modal via X close button", async () => {
      setup();
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm refund destination" }),
      );
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Close confirmation" }));
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("disables confirm button and changes label after submission", async () => {
      setup();
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm refund destination" }),
      );
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", { name: /Confirm refund to ChronoPay Wallet/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Refund confirmed" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Refund confirmed" }),
        ).toBeDisabled();
      });
    });
  });

  describe("customization", () => {
    it("renders a custom destination list", () => {
      setup({
        destinations: [
          {
            id: "wallet",
            label: "My Wallet",
            description: "Fast and free refund",
            eta: "Instant",
            fee: "Free",
            icon: "Wallet",
            recommended: true,
            badge: "Best choice",
          },
          {
            id: "card",
            label: "Visa ending 4242",
            description: "Back to your card",
            eta: "5–7 days",
            fee: "2% processing",
            icon: "CreditCard",
          },
        ],
      });

      expect(
        screen.getByRole("radio", { name: /My Wallet/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Visa ending 4242/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Best choice")).toBeInTheDocument();
      expect(screen.getByText("Instant")).toBeInTheDocument();
      expect(screen.getByText("5–7 days")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("works when card is selected and confirmed", async () => {
      const { onConfirm } = setup();

      // Select card
      fireEvent.click(screen.getByRole("radio", { name: /Original Card/i }));
      // Confirm via modal
      fireEvent.click(
        screen.getByRole("button", { name: "Confirm refund destination" }),
      );
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      fireEvent.click(
        screen.getByRole("button", { name: /Confirm refund to Original Card/i }),
      );

      // Verify announced message
      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        const status = screen.getByRole("status");
        expect(status.textContent).toContain("Refund confirmed: Original Card");
      });

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
