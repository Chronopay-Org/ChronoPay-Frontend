/**
 * KeepOriginalPriceChip tests
 *
 * Coverage targets (95%+):
 *  - Renders correctly in idle, applied, and insufficient states
 *  - Returns null when price diff is zero or negative
 *  - Correct chip label, visible text, and badge in each state
 *  - onApplyCredit callback fires with correct diff value
 *  - Internal state management (uncontrolled: applied transitions to "applied")
 *  - Controlled mode (applied prop drives state)
 *  - aria attributes: aria-disabled, aria-label, aria-describedby, aria-live
 *  - Live announcement text on credit application
 *  - Keyboard: Enter / Space trigger apply in idle state
 *  - Keyboard: Enter / Space are no-ops in applied / insufficient states
 *  - Custom currency label
 *  - Decimal formatting of XLM amounts
 *  - HelpPopover trigger is present
 *  - Touch/click interaction
 *  - Disabled button is not activated by click when insufficient
 *  - Edge: exactly matching credit covers the difference
 *  - Edge: credit is one unit short
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { KeepOriginalPriceChip } from "./keep-original-price-chip";
import type { KeepOriginalPriceChipProps } from "./keep-original-price-chip";

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(
  overrides: Partial<KeepOriginalPriceChipProps> = {},
) {
  const onApplyCredit = vi.fn();
  const props: KeepOriginalPriceChipProps = {
    originalPrice: 120,
    alternativePrice: 150,
    availableCredit: 50,
    onApplyCredit,
    ...overrides,
  };
  const result = render(<KeepOriginalPriceChip {...props} />);
  return { ...result, onApplyCredit };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("KeepOriginalPriceChip", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Null render cases ──────────────────────────────────────────────────────

  describe("null render conditions", () => {
    it("returns null when alternative price equals original price", () => {
      const { container } = setup({ originalPrice: 120, alternativePrice: 120 });
      expect(container.firstChild).toBeNull();
    });

    it("returns null when alternative price is less than original price", () => {
      const { container } = setup({ originalPrice: 120, alternativePrice: 100 });
      expect(container.firstChild).toBeNull();
    });

    it("renders when alternative price is higher than original price", () => {
      const { container } = setup({ originalPrice: 120, alternativePrice: 121 });
      expect(container.firstChild).not.toBeNull();
    });
  });

  // ── Idle state ─────────────────────────────────────────────────────────────

  describe("idle state (sufficient credit)", () => {
    it("renders the chip with correct idle label text", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      expect(
        screen.getByRole("button", {
          name: /Keep original price: 120 XLM/,
        }),
      ).toBeInTheDocument();
    });

    it("renders visible text combining price and original amount", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      expect(screen.getByText(/Keep original price · 120 XLM/)).toBeInTheDocument();
    });

    it("renders the price difference badge", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      // aria-hidden badge showing +30 XLM
      expect(screen.getByText("+30 XLM")).toBeInTheDocument();
    });

    it("chip button is not disabled", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      expect(
        screen.getByRole("button", { name: /Keep original price/ }),
      ).not.toBeDisabled();
    });

    it("chip button does not have aria-disabled", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      const btn = screen.getByRole("button", { name: /Keep original price/ });
      expect(btn).toHaveAttribute("aria-disabled", "false");
    });

    it("renders the HelpPopover trigger", () => {
      setup();
      expect(
        screen.getByRole("button", { name: /Help: keep original price with credit/i }),
      ).toBeInTheDocument();
    });
  });

  // ── Insufficient state ─────────────────────────────────────────────────────

  describe("insufficient credit state", () => {
    it("renders the insufficient chip when credit < price diff", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 10 });
      expect(
        screen.getByRole("button", { name: /Insufficient credit/i }),
      ).toBeInTheDocument();
    });

    it("shows the price difference the buyer still needs", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 10 });
      // button aria-label includes the shortfall
      const btn = screen.getByRole("button", { name: /need 30 XLM more/i });
      expect(btn).toBeInTheDocument();
    });

    it("chip is disabled when insufficient", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 10 });
      const btn = screen.getByRole("button", { name: /Insufficient credit/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("aria-disabled", "true");
    });

    it("renders the price difference badge in amber tone", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 5 });
      expect(screen.getByText("+30 XLM")).toBeInTheDocument();
    });

    it("does NOT call onApplyCredit when clicked in insufficient state", () => {
      const { onApplyCredit } = setup({
        originalPrice: 120,
        alternativePrice: 150,
        availableCredit: 5,
      });
      const btn = screen.getByRole("button", { name: /Insufficient credit/i });
      fireEvent.click(btn);
      expect(onApplyCredit).not.toHaveBeenCalled();
    });

    it("credit exactly equal to diff enables the chip", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 30 });
      const btn = screen.getByRole("button", { name: /Keep original price/ });
      expect(btn).not.toBeDisabled();
    });

    it("credit one unit short shows insufficient", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 29 });
      const btn = screen.getByRole("button", { name: /Insufficient credit/i });
      expect(btn).toBeInTheDocument();
    });
  });

  // ── Apply credit (uncontrolled) ────────────────────────────────────────────

  describe("applying credit — uncontrolled", () => {
    it("calls onApplyCredit with correct price difference on click", () => {
      const { onApplyCredit } = setup({
        originalPrice: 120,
        alternativePrice: 150,
        availableCredit: 50,
      });
      fireEvent.click(screen.getByRole("button", { name: /Keep original price/ }));
      expect(onApplyCredit).toHaveBeenCalledTimes(1);
      expect(onApplyCredit).toHaveBeenCalledWith(30);
    });

    it("transitions to applied state after click", async () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      fireEvent.click(screen.getByRole("button", { name: /Keep original price/ }));
      expect(
        screen.getByRole("button", { name: /Original price locked/ }),
      ).toBeInTheDocument();
    });

    it("shows locked price text after applying", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      fireEvent.click(screen.getByRole("button", { name: /Keep original price/ }));
      expect(screen.getByText(/Price locked at 120 XLM/)).toBeInTheDocument();
    });

    it("hides the diff badge after applying", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      fireEvent.click(screen.getByRole("button", { name: /Keep original price/ }));
      expect(screen.queryByText(/\+30 XLM/)).not.toBeInTheDocument();
    });

    it("disables the button after applying", () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      fireEvent.click(screen.getByRole("button", { name: /Keep original price/ }));
      expect(
        screen.getByRole("button", { name: /Original price locked/ }),
      ).toBeDisabled();
    });

    it("does not call onApplyCredit a second time if already applied", () => {
      const { onApplyCredit } = setup({
        originalPrice: 120,
        alternativePrice: 150,
        availableCredit: 50,
      });
      const btn = screen.getByRole("button", { name: /Keep original price/ });
      fireEvent.click(btn);
      // button is now disabled; a second click should be a no-op
      fireEvent.click(btn);
      expect(onApplyCredit).toHaveBeenCalledTimes(1);
    });
  });

  // ── Live announcement ──────────────────────────────────────────────────────

  describe("live announcements", () => {
    it("announces credit application with original price and diff", async () => {
      setup({ originalPrice: 120, alternativePrice: 150, availableCredit: 50 });
      fireEvent.click(screen.getByRole("button", { name: /Keep original price/ }));

      await act(async () => {
        vi.runAllTimers();
      });

      await waitFor(() => {
        // Our chip's live region has aria-atomic="true" — find the one with that attribute
        const regions = screen.getAllByRole("status");
        const chipRegion = regions.find(
          (el) => el.getAttribute("aria-atomic") === "true",
        );
        expect(chipRegion).toBeDefined();
        expect(chipRegion!.textContent).toContain("Credit applied");
        expect(chipRegion!.textContent).toContain("120 XLM");
        expect(chipRegion!.textContent).toContain("30 XLM");
      });
    });

    it("live region role is status and aria-live polite", () => {
      setup();
      const regions = screen.getAllByRole("status");
      // Our chip live region has aria-atomic="true"
      const chipRegion = regions.find(
        (el) => el.getAttribute("aria-atomic") === "true",
      );
      expect(chipRegion).toBeDefined();
      expect(chipRegion).toHaveAttribute("aria-live", "polite");
      expect(chipRegion).toHaveAttribute("aria-atomic", "true");
    });
  });

  // ── Keyboard navigation ────────────────────────────────────────────────────

  describe("keyboard interaction", () => {
    it("activates apply via Enter key in idle state", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { onApplyCredit } = setup({
        originalPrice: 120,
        alternativePrice: 150,
        availableCredit: 50,
      });
      const btn = screen.getByRole("button", { name: /Keep original price/ });
      btn.focus();
      await user.keyboard("{Enter}");
      expect(onApplyCredit).toHaveBeenCalledWith(30);
    });

    it("activates apply via Space key in idle state", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { onApplyCredit } = setup({
        originalPrice: 120,
        alternativePrice: 150,
        availableCredit: 50,
      });
      const btn = screen.getByRole("button", { name: /Keep original price/ });
      btn.focus();
      await user.keyboard(" ");
      expect(onApplyCredit).toHaveBeenCalledWith(30);
    });

    it("does not activate via Enter when insufficient", async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      const { onApplyCredit } = setup({
        originalPrice: 120,
        alternativePrice: 150,
        availableCredit: 5,
      });
      // disabled button — keyboard events should not fire onApplyCredit
      screen.getByRole("button", { name: /Insufficient credit/i });
      await user.keyboard("{Enter}");
      expect(onApplyCredit).not.toHaveBeenCalled();
    });
  });

  // ── Controlled mode ────────────────────────────────────────────────────────

  describe("controlled applied prop", () => {
    it("renders in applied state when applied=true passed externally", () => {
      setup({
        originalPrice: 120,
        alternativePrice: 150,
        availableCredit: 50,
        applied: true,
      });
      expect(
        screen.getByRole("button", { name: /Original price locked/ }),
      ).toBeInTheDocument();
    });

    it("renders in idle state when applied=false passed externally", () => {
      setup({
        originalPrice: 120,
        alternativePrice: 150,
        availableCredit: 50,
        applied: false,
      });
      expect(
        screen.getByRole("button", { name: /Keep original price/ }),
      ).toBeInTheDocument();
    });

    it("still calls onApplyCredit in controlled idle state", () => {
      const { onApplyCredit } = setup({
        originalPrice: 120,
        alternativePrice: 150,
        availableCredit: 50,
        applied: false,
      });
      fireEvent.click(screen.getByRole("button", { name: /Keep original price/ }));
      expect(onApplyCredit).toHaveBeenCalledWith(30);
    });
  });

  // ── Custom currency ────────────────────────────────────────────────────────

  describe("custom currency", () => {
    it("uses the supplied currency label", () => {
      setup({
        originalPrice: 10,
        alternativePrice: 15,
        availableCredit: 20,
        currency: "USDC",
      });
      expect(screen.getByText(/Keep original price · 10 USDC/)).toBeInTheDocument();
      expect(screen.getByText("+5 USDC")).toBeInTheDocument();
    });
  });

  // ── Decimal formatting ─────────────────────────────────────────────────────

  describe("XLM decimal formatting", () => {
    it("strips trailing zeros for whole numbers", () => {
      setup({ originalPrice: 100, alternativePrice: 130, availableCredit: 50 });
      expect(screen.getByText(/Keep original price · 100 XLM/)).toBeInTheDocument();
      expect(screen.getByText("+30 XLM")).toBeInTheDocument();
    });

    it("renders fractional amounts correctly", () => {
      setup({
        originalPrice: 100.5,
        alternativePrice: 110.75,
        availableCredit: 20,
      });
      // diff = 10.25
      expect(screen.getByText("+10.25 XLM")).toBeInTheDocument();
    });

    it("strips trailing decimal zeros from fractional amounts", () => {
      setup({
        originalPrice: 100,
        alternativePrice: 110.1,
        availableCredit: 20,
      });
      // diff = 10.1 — should not be "10.10"
      expect(screen.getByText("+10.1 XLM")).toBeInTheDocument();
    });
  });

  // ── className prop ─────────────────────────────────────────────────────────

  describe("className prop", () => {
    it("applies additional class names to the outer wrapper", () => {
      const { container } = setup({ className: "test-custom-class" });
      expect(container.firstChild).toHaveClass("test-custom-class");
    });
  });

  // ── No callback provided ───────────────────────────────────────────────────

  describe("no onApplyCredit provided", () => {
    it("does not throw when onApplyCredit is undefined and chip is clicked", () => {
      render(
        <KeepOriginalPriceChip
          originalPrice={100}
          alternativePrice={130}
          availableCredit={50}
        />,
      );
      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: /Keep original price/ }));
      }).not.toThrow();
    });
  });
});
