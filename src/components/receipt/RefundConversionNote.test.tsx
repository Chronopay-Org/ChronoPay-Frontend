/**
 * Tests for RefundConversionNote and its integration into Receipt.
 *
 * Coverage targets: 95%+ lines/functions/statements, 90%+ branches.
 *
 * Scenarios covered:
 *  - No conversion → renders nothing
 *  - Normal (fresh) rate → shows rate, source tooltip, no stale warning
 *  - Stale rate via `isStale: true` flag → stale badge shown
 *  - Stale rate auto-derived from old `fetchedAt` → stale badge shown
 *  - Fresh rate (isStale: false override) → no stale badge even if timestamp is old
 *  - referenceId present → truncated display + copy button
 *  - referenceId short (≤12 chars) → shown without truncation
 *  - referenceId absent → copy button absent
 *  - Tooltip trigger opens/closes tooltip content
 *  - Receipt without refundConversion → note absent
 *  - Receipt with refundConversion → note present
 *  - RTL: wrapper carries ltr:/rtl: classes
 *  - Accessibility: role="note", aria-label, data-value, alert for stale
 *  - formatFetchedAt happy path and error/unknown input fallback
 *  - isRateStale: explicit true, explicit false, derived stale, derived fresh, bad date
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  RefundConversionNote,
  isRateStale,
  formatFetchedAt,
} from "./RefundConversionNote";
import { Receipt } from "./Receipt";
import type { RefundConversionRate, ReceiptData } from "./types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const NOW_ISO = "2026-04-01T10:04:00Z";
const OLD_ISO = "2026-04-01T09:50:00Z"; // 14 min before NOW — stale
const FRESH_ISO = "2026-04-01T10:03:00Z"; // 1 min before NOW — fresh

const freshConversion: RefundConversionRate = {
  fromCurrency: "XLM",
  toCurrency: "USD",
  rate: "0.1042",
  source: "Stellar DEX USDC/XLM",
  fetchedAt: FRESH_ISO,
  referenceId: "RATE-REF-001",
};

const staleConversionFlag: RefundConversionRate = {
  ...freshConversion,
  isStale: true,
};

const staleConversionDerived: RefundConversionRate = {
  ...freshConversion,
  fetchedAt: OLD_ISO,
};

const noRefConversion: RefundConversionRate = {
  fromCurrency: "XLM",
  toCurrency: "EUR",
  rate: "0.0958",
  source: "ECB XLM/EUR mid-market",
  fetchedAt: FRESH_ISO,
};

const shortRefConversion: RefundConversionRate = {
  ...freshConversion,
  referenceId: "SHORT",
};

const baseReceipt: ReceiptData = {
  id: "slot-test",
  assetCode: "CHRONO-SLOT-1",
  title: "Test slot",
  status: "settled",
  settledAt: "Apr 1, 2026 · 10:04 UTC",
  buyer: { name: "Alice", role: "Buyer", address: "GABC" },
  seller: { name: "Bob", role: "Seller", address: "GXYZ" },
  lineItems: [{ label: "Token subtotal", value: "180.00 XLM" }],
  net: "180.00 XLM",
  total: "182.70 XLM",
  txHash: "abc123",
  escrowContract: "GESC",
  trace: [{ label: "Initiated", status: "complete" }],
  explorerBaseUrl: "https://stellar.expert/explorer/public/tx",
};

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  // Pin Date.now() so stale-threshold derivation is deterministic.
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_ISO));

  // Suppress navigator.clipboard errors in jsdom.
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });

  // CopyButton reads window.matchMedia for prefers-reduced-motion; mock it.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
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

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── isRateStale() unit tests ─────────────────────────────────────────────────

describe("isRateStale()", () => {
  it("returns true when isStale flag is explicitly true", () => {
    expect(isRateStale({ ...freshConversion, isStale: true })).toBe(true);
  });

  it("returns false when isStale flag is explicitly false (overrides old timestamp)", () => {
    expect(isRateStale({ ...staleConversionDerived, isStale: false })).toBe(false);
  });

  it("returns true when fetchedAt is >10 min old and isStale is undefined", () => {
    expect(isRateStale(staleConversionDerived)).toBe(true);
  });

  it("returns false when fetchedAt is within 10 min and isStale is undefined", () => {
    expect(isRateStale(freshConversion)).toBe(false);
  });

  it("returns false for an invalid/unparseable fetchedAt date", () => {
    expect(
      isRateStale({ ...freshConversion, fetchedAt: "not-a-date" }),
    ).toBe(false);
  });
});

// ─── formatFetchedAt() unit tests ────────────────────────────────────────────

describe("formatFetchedAt()", () => {
  it("formats a valid ISO string and appends UTC", () => {
    const result = formatFetchedAt("2026-04-01T10:04:00Z");
    expect(result).toMatch(/UTC/);
    // Must contain some recognisable date fragment.
    expect(result.length).toBeGreaterThan(5);
  });

  it("falls back to the raw string for an invalid date", () => {
    const bad = "not-a-date";
    expect(formatFetchedAt(bad)).toBe(bad);
  });
});

// ─── RefundConversionNote rendering ──────────────────────────────────────────

describe("RefundConversionNote", () => {
  describe("no conversion", () => {
    it("renders nothing when conversion is undefined", () => {
      const { container } = render(<RefundConversionNote />);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when conversion is null", () => {
      const { container } = render(<RefundConversionNote conversion={null} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("normal (fresh) rate", () => {
    it("renders the note wrapper with role=note", () => {
      render(<RefundConversionNote conversion={noRefConversion} />);
      expect(screen.getByRole("note")).toBeInTheDocument();
    });

    it("aria-label describes the conversion", () => {
      render(<RefundConversionNote conversion={noRefConversion} />);
      const note = screen.getByRole("note");
      expect(note).toHaveAttribute(
        "aria-label",
        expect.stringContaining("XLM"),
      );
      expect(note).toHaveAttribute(
        "aria-label",
        expect.stringContaining("EUR"),
      );
    });

    it("displays 'Refund rate:' label text", () => {
      render(<RefundConversionNote conversion={noRefConversion} />);
      expect(screen.getByText(/Refund rate:/i)).toBeInTheDocument();
    });

    it("renders the rate value in a <data> element with machine-readable value attribute", () => {
      render(<RefundConversionNote conversion={noRefConversion} />);
      const dataEl = document.querySelector("data");
      expect(dataEl).not.toBeNull();
      expect(dataEl!.getAttribute("value")).toBe(
        "1 XLM = 0.0958 EUR",
      );
    });

    it("does NOT render a stale warning when rate is fresh", () => {
      render(<RefundConversionNote conversion={noRefConversion} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText(/Rate may be outdated/i)).not.toBeInTheDocument();
    });

    it("does NOT render a copy button when referenceId is absent", () => {
      render(<RefundConversionNote conversion={noRefConversion} />);
      expect(screen.queryByRole("button", { name: /copy reference/i })).not.toBeInTheDocument();
    });

    it("has data-testid=refund-conversion-note", () => {
      render(<RefundConversionNote conversion={noRefConversion} />);
      expect(screen.getByTestId("refund-conversion-note")).toBeInTheDocument();
    });

    it("applies extra className to wrapper", () => {
      render(<RefundConversionNote conversion={noRefConversion} className="my-custom-class" />);
      expect(screen.getByTestId("refund-conversion-note")).toHaveClass("my-custom-class");
    });

    it("includes receipt-no-print class for print suppression", () => {
      render(<RefundConversionNote conversion={noRefConversion} />);
      expect(screen.getByTestId("refund-conversion-note")).toHaveClass("receipt-no-print");
    });
  });

  describe("stale rate via isStale flag", () => {
    it("renders the stale warning badge", () => {
      render(<RefundConversionNote conversion={staleConversionFlag} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/Rate may be outdated/i)).toBeInTheDocument();
    });

    it("stale badge aria-label mentions 'Last fetched'", () => {
      render(<RefundConversionNote conversion={staleConversionFlag} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-label", expect.stringContaining("Last fetched"));
    });
  });

  describe("stale rate auto-derived from old fetchedAt", () => {
    it("renders the stale warning badge when fetchedAt is >10 min ago", () => {
      render(<RefundConversionNote conversion={staleConversionDerived} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("isStale: false overrides old timestamp", () => {
    it("does NOT render stale warning when isStale is explicitly false", () => {
      const notStale: RefundConversionRate = {
        ...staleConversionDerived,
        isStale: false,
      };
      render(<RefundConversionNote conversion={notStale} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("referenceId present (long)", () => {
    it("renders a truncated reference ID", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      // RATE-REF-001 is 12 chars — boundary, shown as-is but let's check visually
      // referenceId "RATE-REF-001" → length 12, so no truncation (≤12 is shown fully)
      expect(screen.getByText(/RATE-REF-001/i)).toBeInTheDocument();
    });

    it("renders a copy button for the referenceId", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      const copyBtn = screen.getByRole("button", { name: /copy reference id/i });
      expect(copyBtn).toBeInTheDocument();
    });

    it("copy button invokes clipboard.writeText with the full referenceId", async () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      const copyBtn = screen.getByRole("button", { name: /copy reference id/i });
      fireEvent.click(copyBtn);
      await vi.runAllTimersAsync();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("RATE-REF-001");
    });
  });

  describe("referenceId present (long >12 chars) — truncation", () => {
    const longRefConversion: RefundConversionRate = {
      ...freshConversion,
      referenceId: "RATE-ABCDEF-XYZ-9999",
    };

    it("truncates referenceId longer than 12 chars", () => {
      render(<RefundConversionNote conversion={longRefConversion} />);
      // Should show truncated form — first 6 + "…" + last 4
      expect(screen.getByText(/RATE-A…9999/i)).toBeInTheDocument();
    });

    it("copy button uses full (untruncated) referenceId", async () => {
      render(<RefundConversionNote conversion={longRefConversion} />);
      const copyBtn = screen.getByRole("button", { name: /copy reference id/i });
      fireEvent.click(copyBtn);
      await vi.runAllTimersAsync();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "RATE-ABCDEF-XYZ-9999",
      );
    });
  });

  describe("referenceId short (≤12 chars)", () => {
    it("shows the referenceId without truncation", () => {
      render(<RefundConversionNote conversion={shortRefConversion} />);
      expect(screen.getByText("SHORT")).toBeInTheDocument();
    });
  });

  describe("tooltip", () => {
    it("renders a tooltip trigger button", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      expect(
        screen.getByRole("button", { name: /rate source details/i }),
      ).toBeInTheDocument();
    });

    it("tooltip is hidden by default", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("tooltip opens on trigger click", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      fireEvent.click(screen.getByRole("button", { name: /rate source details/i }));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("tooltip content shows 'Rate details' heading", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      fireEvent.click(screen.getByRole("button", { name: /rate source details/i }));
      expect(screen.getByText("Rate details")).toBeInTheDocument();
    });

    it("tooltip content shows the source name", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      fireEvent.click(screen.getByRole("button", { name: /rate source details/i }));
      expect(screen.getByRole("tooltip")).toHaveTextContent("Stellar DEX USDC/XLM");
    });

    it("tooltip content shows the rate", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      fireEvent.click(screen.getByRole("button", { name: /rate source details/i }));
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent("1");
      expect(tooltip).toHaveTextContent("XLM");
      expect(tooltip).toHaveTextContent("0.1042");
      expect(tooltip).toHaveTextContent("USD");
    });

    it("tooltip content shows 'Fetched' timestamp", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      fireEvent.click(screen.getByRole("button", { name: /rate source details/i }));
      expect(screen.getByRole("tooltip")).toHaveTextContent(/Fetched/i);
    });

    it("tooltip shows stale advisory text when isStale is true", () => {
      render(<RefundConversionNote conversion={staleConversionFlag} />);
      fireEvent.click(screen.getByRole("button", { name: /rate source details/i }));
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent(/more than 10.minutes old/i);
    });

    it("tooltip does NOT show stale advisory when rate is fresh", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      fireEvent.click(screen.getByRole("button", { name: /rate source details/i }));
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).not.toHaveTextContent(/more than 10.minutes old/i);
    });

    it("tooltip closes on Escape key", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      fireEvent.click(screen.getByRole("button", { name: /rate source details/i }));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("RTL support", () => {
    it("wrapper includes ltr:text-left and rtl:text-right classes", () => {
      render(<RefundConversionNote conversion={freshConversion} />);
      const wrapper = screen.getByTestId("refund-conversion-note");
      expect(wrapper.className).toContain("ltr:text-left");
      expect(wrapper.className).toContain("rtl:text-right");
    });
  });
});

// ─── Receipt integration ──────────────────────────────────────────────────────

describe("Receipt — RefundConversionNote integration", () => {
  it("does NOT render conversion note when refundConversion is absent", () => {
    render(<Receipt receipt={baseReceipt} />);
    expect(screen.queryByTestId("refund-conversion-note")).not.toBeInTheDocument();
  });

  it("renders conversion note when refundConversion is present", () => {
    render(
      <Receipt
        receipt={{ ...baseReceipt, refundConversion: freshConversion }}
      />,
    );
    expect(screen.getByTestId("refund-conversion-note")).toBeInTheDocument();
  });

  it("shows the rate in the context of the full receipt", () => {
    render(
      <Receipt
        receipt={{ ...baseReceipt, refundConversion: freshConversion }}
      />,
    );
    // Rate label and value should both be visible
    expect(screen.getByText(/Refund rate:/i)).toBeInTheDocument();
    expect(screen.getByText("0.1042")).toBeInTheDocument();
  });

  it("shows stale warning in receipt when isStale is true", () => {
    render(
      <Receipt
        receipt={{
          ...baseReceipt,
          refundConversion: { ...freshConversion, isStale: true },
        }}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("does not render note when receipt is null", () => {
    render(<Receipt receipt={null} />);
    expect(screen.queryByTestId("refund-conversion-note")).not.toBeInTheDocument();
  });

  it("does not render note during loading state", () => {
    render(<Receipt loading />);
    expect(screen.queryByTestId("refund-conversion-note")).not.toBeInTheDocument();
  });

  it("does not render note during error state", () => {
    render(<Receipt error="Something went wrong" />);
    expect(screen.queryByTestId("refund-conversion-note")).not.toBeInTheDocument();
  });
});

// ─── Accessibility smoke tests ────────────────────────────────────────────────

describe("RefundConversionNote — accessibility", () => {
  it("Tooltip trigger is keyboard-accessible (Enter opens)", () => {
    render(<RefundConversionNote conversion={freshConversion} />);
    const trigger = screen.getByRole("button", { name: /rate source details/i });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("Tooltip trigger is keyboard-accessible (Space opens)", () => {
    render(<RefundConversionNote conversion={freshConversion} />);
    const trigger = screen.getByRole("button", { name: /rate source details/i });
    fireEvent.keyDown(trigger, { key: " " });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("copy button has a descriptive aria-label", () => {
    render(<RefundConversionNote conversion={freshConversion} />);
    const copyBtn = screen.getByRole("button", { name: /copy reference id/i });
    expect(copyBtn).toHaveAttribute("aria-label");
  });

  it("note wrapper does not have pointer-events that could trap focus unexpectedly", () => {
    render(<RefundConversionNote conversion={freshConversion} />);
    const wrapper = screen.getByTestId("refund-conversion-note");
    // Should not be a focusable element itself (no tabIndex)
    expect(wrapper.getAttribute("tabindex")).toBeNull();
  });
});
