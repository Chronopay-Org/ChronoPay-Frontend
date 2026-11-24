/**
 * Focused behavior coverage for the PayoutCurrency / PayoutConsent /
 * PayoutPreview contracts exposed by
 * src/components/dashboard/payout-step/index.tsx.
 *
 * The sibling `payout-step.test.tsx` covers the PayoutStep render/save flows.
 * This suite pins the named public contracts those flows depend on:
 *  - the `CURRENCIES` metadata table and its exhaustiveness over PayoutCurrency
 *  - the `initialCurrency` prop (default + override) and the preview currency chip
 *  - the exact shape of the PayoutConsent object handed to `onSave`
 *  - consent toggling back off (acceptedAt reset, save blocked again)
 *  - `truncateAddress` boundary inputs
 *  - PayoutPreview edge cases (null preview, empty wallet address)
 */

import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  PayoutStep,
  CURRENCIES,
  truncateAddress,
  type PayoutCurrency,
  type PayoutConsent,
  type PayoutPreview,
} from "./index";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockPreview: PayoutPreview = {
  walletAddress: "GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7",
  walletLabel: "Freighter Wallet",
  network: "Stellar",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(props: Partial<React.ComponentProps<typeof PayoutStep>> = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const result = render(<PayoutStep preview={mockPreview} onSave={onSave} {...props} />);
  return { ...result, onSave };
}

const consentCheckbox = () =>
  screen.getByRole("checkbox", { name: /agree to the payout terms/i });

function click(element: HTMLElement) {
  act(() => {
    fireEvent.click(element);
  });
}

function clickSave() {
  click(screen.getByRole("link", { name: /save & continue/i }));
}

const previewEl = (container: HTMLElement) =>
  container.querySelector('[aria-label="Payout destination preview"]');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PayoutCurrency", () => {
  it("exposes exactly the XLM / USDC / EURC options", () => {
    expect(CURRENCIES.map((c) => c.value)).toEqual(["XLM", "USDC", "EURC"]);
    expect(new Set(CURRENCIES.map((c) => c.value)).size).toBe(CURRENCIES.length);
  });

  it("keeps CURRENCIES exhaustive over the PayoutCurrency union", () => {
    // Compile-time exhaustiveness guard: a new union member without a
    // CURRENCIES entry fails `tsc`, and the runtime check below fails vitest.
    const allCurrencies: Record<PayoutCurrency, true> = { XLM: true, USDC: true, EURC: true };

    expect(CURRENCIES.map((c) => c.value).sort()).toEqual(
      Object.keys(allCurrencies).sort(),
    );
  });

  it("documents every option with a Stellar network label and a description", () => {
    for (const currency of CURRENCIES) {
      expect(currency.network).toBe("Stellar");
      expect(currency.label.trim().length).toBeGreaterThan(0);
      expect(currency.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("defaults to XLM and renders its full label", () => {
    setup();

    expect(screen.getByDisplayValue("XLM")).toBeChecked();
    expect(screen.getByText("XLM (Lumens)")).toBeInTheDocument();
  });

  it("honours the initialCurrency override", () => {
    setup({ initialCurrency: "USDC" });

    expect(screen.getByDisplayValue("USDC")).toBeChecked();
    expect(screen.getByDisplayValue("XLM")).not.toBeChecked();
  });

  it("reflects the selected currency in the payout preview chip", () => {
    const { container } = setup({ initialCurrency: "EURC" });

    expect(previewEl(container)?.textContent).toContain("EURC");

    click(screen.getByDisplayValue("XLM"));
    expect(previewEl(container)?.textContent).toContain("XLM (Lumens)");
    expect(previewEl(container)?.textContent).not.toContain("EURC");
  });
});

describe("PayoutConsent", () => {
  it("hands onSave an accepted consent carrying a real timestamp", async () => {
    const before = Date.now();
    const { onSave } = setup();

    click(consentCheckbox());
    click(screen.getByDisplayValue("USDC"));
    clickSave();

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    const [currency, consent] = onSave.mock.calls[0] as [PayoutCurrency, PayoutConsent];
    expect(currency).toBe("USDC");
    expect(consent.accepted).toBe(true);
    expect(consent.acceptedAt).toBeInstanceOf(Date);
    const recordedAt = (consent.acceptedAt as Date).getTime();
    expect(Number.isNaN(recordedAt)).toBe(false);
    expect(recordedAt).toBeGreaterThanOrEqual(before);
  });

  it("resets acceptedAt and blocks saving again when consent is withdrawn", () => {
    const { onSave } = setup();

    click(consentCheckbox());
    expect(screen.getByText(/consent recorded/i)).toBeInTheDocument();

    click(consentCheckbox());
    expect(screen.queryByText(/consent recorded/i)).not.toBeInTheDocument();

    clickSave();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /you must agree to the payout terms before saving/i,
    );
  });

  it("requires consent for every currency, including the initial override", () => {
    const { onSave } = setup({ initialCurrency: "EURC" });

    clickSave();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /you must agree to the payout terms before saving/i,
    );
  });
});

describe("PayoutPreview", () => {
  it("omits the preview section entirely when preview is null", () => {
    const { container } = setup({ preview: null });
    expect(previewEl(container)).toBeNull();
  });

  it("renders every preview field and the truncated address", () => {
    const { container } = setup();
    const preview = previewEl(container);

    expect(preview).not.toBeNull();
    expect(preview?.textContent).toContain(mockPreview.walletLabel);
    expect(preview?.textContent).toContain(mockPreview.network);
    expect(preview?.textContent).toContain("Connected");
    expect(preview?.textContent).toContain(truncateAddress(mockPreview.walletAddress));
  });

  it("handles an empty wallet address deterministically", () => {
    const { container } = setup({ preview: { ...mockPreview, walletAddress: "" } });

    const preview = previewEl(container);
    expect(preview).not.toBeNull();
    expect(preview?.textContent).toContain(mockPreview.walletLabel);
    // truncateAddress("") is "" — no ellipsis leaks into the DOM.
    expect(preview?.textContent).not.toContain("...");
  });
});

describe("truncateAddress boundaries", () => {
  it("leaves addresses at the exact threshold length untouched", () => {
    const threshold = "A".repeat(6 * 2 + 3); // 15
    expect(truncateAddress(threshold)).toBe(threshold);
  });

  it("truncates one character past the threshold", () => {
    const over = "A".repeat(6 * 2 + 4); // 16
    const result = truncateAddress(over);
    expect(result).toBe("AAAAAA...AAAAAA");
    expect(result.length).toBe(15);
  });

  it("returns empty strings unchanged and degrades to a bare ellipsis", () => {
    expect(truncateAddress("")).toBe("");
    expect(truncateAddress("ABCD", 0)).toBe("...");
    expect(truncateAddress("ABC", 0)).toBe("ABC");
  });

  it("supports custom truncation widths", () => {
    expect(truncateAddress("ABCDEFGHIJ", 2)).toBe("AB...IJ");
    expect(truncateAddress("ABCDEFGHIJ", 10)).toBe("ABCDEFGHIJ");
  });
});
