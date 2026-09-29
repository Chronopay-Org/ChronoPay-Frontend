import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  calls: [] as Array<{ fn: string; args: unknown[] }>,
  overrides: {} as Partial<
    Record<"formatNumber" | "formatCurrency" | "formatDate", (...args: unknown[]) => string>
  >,
}));

vi.mock("@/lib/formatters", () => {
  const record = (fn: string, args: unknown[]) => {
    h.calls.push({ fn, args });
  };
  return {
    formatNumber: (value: number, locale?: string, options?: unknown) => {
      record("formatNumber", [value, locale, options]);
      return h.overrides.formatNumber
        ? h.overrides.formatNumber(value, locale, options)
        : `number:${locale}:${value}`;
    },
    formatCurrency: (value: number, currency: string, locale?: string, options?: unknown) => {
      record("formatCurrency", [value, currency, locale, options]);
      return h.overrides.formatCurrency
        ? h.overrides.formatCurrency(value, currency, locale, options)
        : `currency:${currency}:${locale}:${value}`;
    },
    formatDate: (date: Date | number | string, locale?: string, options?: unknown) => {
      record("formatDate", [date, locale, options]);
      return h.overrides.formatDate
        ? h.overrides.formatDate(date, locale, options)
        : `date:${locale}:${(date as Date).toISOString()}`;
    },
  };
});

import FormattersDocsPage from "./page";

const FIXED_NOW = new Date("2026-04-01T12:00:00.000Z");

beforeEach(() => {
  h.calls.length = 0;
  h.overrides = {};
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("FormattersDocsPage", () => {
  it("renders the page heading, brand and back link", () => {
    render(<FormattersDocsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "i18n Formatters" })
    ).toBeInTheDocument();
    expect(screen.getByText("Design System - Formatters")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Review/ })).toHaveAttribute(
      "href",
      "/design-review"
    );
  });

  it("renders one card per supported locale with the expected direction", () => {
    render(<FormattersDocsPage />);

    const expected = [
      { name: "US English", locale: "en-US", dir: "ltr" },
      { name: "Indian English", locale: "en-IN", dir: "ltr" },
      { name: "Hindi (India)", locale: "hi-IN", dir: "ltr" },
      { name: "Arabic (Egypt)", locale: "ar-EG", dir: "rtl" },
    ];

    for (const { name, locale, dir } of expected) {
      const heading = screen.getByRole("heading", {
        level: 2,
        name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      });
      const card = heading.closest("div[dir]") as HTMLElement;
      expect(card).not.toBeNull();
      expect(card).toHaveAttribute("dir", dir);
      expect(within(card).getByText(`(${locale})`)).toBeInTheDocument();
    }
  });

  it("flags only the RTL locale with the RTL badge", () => {
    render(<FormattersDocsPage />);

    expect(screen.getAllByText("RTL")).toHaveLength(1);
    const rtlCard = screen
      .getByRole("heading", { level: 2, name: /Arabic \(Egypt\)/ })
      .closest("div[dir]") as HTMLElement;
    expect(within(rtlCard).getByText("RTL")).toBeInTheDocument();
  });

  it("formats the shared sample value for every locale and currency", () => {
    render(<FormattersDocsPage />);

    const numberCalls = h.calls.filter((c) => c.fn === "formatNumber");
    const currencyCalls = h.calls.filter((c) => c.fn === "formatCurrency");
    const dateCalls = h.calls.filter((c) => c.fn === "formatDate");

    expect(numberCalls).toHaveLength(4);
    expect(currencyCalls).toHaveLength(4);
    expect(dateCalls).toHaveLength(4);

    expect(numberCalls.map((c) => c.args)).toEqual([
      [1234567.89, "en-US", undefined],
      [1234567.89, "en-IN", undefined],
      [1234567.89, "hi-IN", undefined],
      [1234567.89, "ar-EG", undefined],
    ]);

    expect(currencyCalls.map((c) => c.args)).toEqual([
      [1234567.89, "USD", "en-US", undefined],
      [1234567.89, "INR", "en-IN", undefined],
      [1234567.89, "INR", "hi-IN", undefined],
      [1234567.89, "EGP", "ar-EG", undefined],
    ]);

    for (const call of dateCalls) {
      const [date, , options] = call.args as [Date, string, unknown];
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(FIXED_NOW.getTime());
      expect(options).toEqual({ dateStyle: "full" });
    }
    expect(dateCalls.map((c) => (c.args as unknown[])[1])).toEqual([
      "en-US",
      "en-IN",
      "hi-IN",
      "ar-EG",
    ]);
  });

  it("renders the formatter output verbatim for each locale", () => {
    render(<FormattersDocsPage />);

    expect(screen.getByText("number:en-US:1234567.89")).toBeInTheDocument();
    expect(screen.getByText("number:en-IN:1234567.89")).toBeInTheDocument();
    expect(screen.getByText("number:hi-IN:1234567.89")).toBeInTheDocument();
    expect(screen.getByText("number:ar-EG:1234567.89")).toBeInTheDocument();

    expect(screen.getByText("currency:USD:en-US:1234567.89")).toBeInTheDocument();
    expect(screen.getByText("currency:INR:en-IN:1234567.89")).toBeInTheDocument();
    expect(screen.getByText("currency:INR:hi-IN:1234567.89")).toBeInTheDocument();
    expect(screen.getByText("currency:EGP:ar-EG:1234567.89")).toBeInTheDocument();

    expect(
      screen.getByText(`date:en-US:${FIXED_NOW.toISOString()}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`date:ar-EG:${FIXED_NOW.toISOString()}`)
    ).toBeInTheDocument();
  });

  it("labels each formatter output section", () => {
    render(<FormattersDocsPage />);

    expect(screen.getAllByText("Number format")).toHaveLength(4);
    expect(screen.getAllByText("Date format")).toHaveLength(4);
    expect(screen.getByText("Currency format (USD)")).toBeInTheDocument();
    expect(screen.getAllByText("Currency format (INR)")).toHaveLength(2);
    expect(screen.getByText("Currency format (EGP)")).toBeInTheDocument();
  });

  describe("invalid inputs", () => {
    it("still renders every locale card when a formatter returns an empty string", () => {
      h.overrides.formatNumber = () => "";
      h.overrides.formatCurrency = () => "";
      h.overrides.formatDate = () => "";

      render(<FormattersDocsPage />);

      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(4);
      expect(screen.getAllByText("Number format")).toHaveLength(4);
    });

    it("surfaces a formatter failure deterministically instead of rendering a partial card", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      h.overrides.formatNumber = () => {
        throw new RangeError("Invalid language tag: not-a-locale");
      };

      expect(() => render(<FormattersDocsPage />)).toThrow(
        "Invalid language tag: not-a-locale"
      );
      consoleSpy.mockRestore();
    });

    it("propagates an unsupported currency error from the currency formatter", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      h.overrides.formatCurrency = () => {
        throw new RangeError("Invalid currency code: NOTACURRENCY");
      };

      expect(() => render(<FormattersDocsPage />)).toThrow(
        "Invalid currency code: NOTACURRENCY"
      );
      consoleSpy.mockRestore();
    });

    it("propagates an invalid date error from the date formatter", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      h.overrides.formatDate = () => {
        throw new RangeError("Invalid time value");
      };

      expect(() => render(<FormattersDocsPage />)).toThrow("Invalid time value");
      consoleSpy.mockRestore();
    });
  });
});
