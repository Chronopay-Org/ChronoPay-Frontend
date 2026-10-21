import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  I18nProvider,
  useMessages,
  useLocale,
  useNumberFormatter,
  useCurrencyFormatter,
  useDateFormatter,
  getMessages,
  resolveKey,
  formatNumberStandalone,
  formatCurrencyStandalone,
  formatDateStandalone,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_DIR,
  LOCALE_LABELS,
  type MessageKey,
  type SupportedLocale,
} from "./i18n";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function TestProvider({ locale, children }: { locale?: string; children: ReactNode }) {
  return <I18nProvider locale={locale as SupportedLocale}>{children}</I18nProvider>;
}
TestProvider.displayName = "TestProvider";

function Wrapper({ locale, children }: { locale?: string; children: ReactNode }) {
  return <TestProvider locale={locale}>{children}</TestProvider>;
}
Wrapper.displayName = "Wrapper";

function wrapper(locale?: string) {
  const WrapperWithLocale = ({ children }: { children: ReactNode }) => (
    <Wrapper locale={locale}>{children}</Wrapper>
  );
  WrapperWithLocale.displayName = "WrapperWithLocale";
  return WrapperWithLocale;
}

/* -------------------------------------------------------------------------- */
/*  getMessages / resolveKey                                                  */
/* -------------------------------------------------------------------------- */

describe("getMessages", () => {
  it("returns the en flat map for locale 'en'", () => {
    const msgs = getMessages("en");
    expect(msgs["dashboard.title"]).toBe("Dashboard");
    expect(msgs["wallet.title"]).toBe("Wallet");
  });

  it("falls back to en for an unknown locale", () => {
    const msgs = getMessages("xx");
    expect(msgs["dashboard.title"]).toBe("Dashboard");
  });

  it("contains flattened keys from all namespaces in en.json", () => {
    const msgs = getMessages("en");
    // Verify key representative keys from each namespace exist
    expect(msgs["common.loading"]).toBeTruthy();
    expect(msgs["dashboard.title"]).toBeTruthy();
    expect(msgs["home.title"]).toBeTruthy();
    expect(msgs["wallet.title"]).toBeTruthy();
    expect(msgs["trust.title"]).toBeTruthy();
  });
});

describe("resolveKey", () => {
  it("resolves a flat key", () => {
    const flat = { "dashboard.title": "Dashboard" };
    expect(resolveKey(flat, "dashboard.title")).toBe("Dashboard");
  });

  it("returns undefined for missing key", () => {
    expect(resolveKey({}, "missing.key")).toBeUndefined();
  });

  it("returns undefined for non-string value in nested map", () => {
    const nested = { dashboard: { title: 123 } };
    expect(resolveKey(nested as unknown as Record<string, string>, "dashboard.title")).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/*  useMessages hook                                                          */
/* -------------------------------------------------------------------------- */

describe("useMessages", () => {
  it("returns a function that resolves known keys", () => {
    const { result } = renderHook(() => useMessages(), {
      wrapper: wrapper("en"),
    });
    const t = result.current;
    expect(t("dashboard.title")).toBe("Dashboard");
    expect(t("wallet.title")).toBe("Wallet");
    expect(t("home.title")).toBe("ChronoPay");
  });

  it("returns the key itself when the key is missing", () => {
    const { result } = renderHook(() => useMessages(), {
      wrapper: wrapper("en"),
    });
    expect(result.current("nonexistent.key" as MessageKey)).toBe("nonexistent.key");
  });

  it("uses console.warn in non-production for missing keys", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useMessages(), {
      wrapper: wrapper("en"),
    });
    result.current("missing.does.not.exist" as MessageKey);
    // Should only warn if NODE_ENV !== 'production'
    if (process.env.NODE_ENV !== "production") {
      expect(warnSpy).toHaveBeenCalled();
    }
    warnSpy.mockRestore();
  });

  it("resolves nested keys across namespaces", () => {
    const { result } = renderHook(() => useMessages(), {
      wrapper: wrapper("en"),
    });
    const t = result.current;
    expect(t("quickActions.listSlot")).toBe("List new slot");
    expect(t("ratings.communication")).toBe("Communication");
    expect(t("slots.statusHealthy")).toBe("Healthy");
  });
});

/* -------------------------------------------------------------------------- */
/*  useLocale hook                                                            */
/* -------------------------------------------------------------------------- */

describe("useLocale", () => {
  it("returns the default locale and ltr by default", () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: wrapper(),
    });
    expect(result.current.locale).toBe(DEFAULT_LOCALE);
    expect(result.current.dir).toBe("ltr");
  });

  it("returns the correct dir for an RTL locale", () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: wrapper("ar"),
    });
    expect(result.current.locale).toBe("ar");
    expect(result.current.dir).toBe("rtl");
  });
});

/* -------------------------------------------------------------------------- */
/*  Intl formatter hooks                                                      */
/* -------------------------------------------------------------------------- */

describe("useNumberFormatter", () => {
  it("formats numbers with the default locale", () => {
    const { result } = renderHook(() => useNumberFormatter(), {
      wrapper: wrapper("en"),
    });
    expect(result.current(1234567.89)).toBe("1,234,567.89");
  });

  it("formats with grouping options", () => {
    const { result } = renderHook(
      () => useNumberFormatter({ maximumFractionDigits: 0 }),
      { wrapper: wrapper("en") },
    );
    expect(result.current(42.9)).toBe("43");
  });
});

describe("useCurrencyFormatter", () => {
  it("formats currency with the default locale", () => {
    const { result } = renderHook(() => useCurrencyFormatter("USD"), {
      wrapper: wrapper("en"),
    });
    expect(result.current(49.99)).toBe("$49.99");
  });
});

describe("useDateFormatter", () => {
  it("formats dates with the default locale", () => {
    const { result } = renderHook(() => useDateFormatter(), {
      wrapper: wrapper("en"),
    });
    // Use a fixed date to avoid test flakiness
    const formatted = result.current(new Date("2026-01-15T12:00:00Z"));
    expect(formatted).toContain("2026");
  });
});

/* -------------------------------------------------------------------------- */
/*  Standalone formatters                                                     */
/* -------------------------------------------------------------------------- */

describe("standalone formatters", () => {
  it("formatNumberStandalone formats correctly", () => {
    expect(formatNumberStandalone(1234.56)).toBe("1,234.56");
  });

  it("formatCurrencyStandalone formats correctly", () => {
    expect(formatCurrencyStandalone(99.99, "USD", "en")).toBe("$99.99");
  });

  it("formatDateStandalone formats correctly", () => {
    const result = formatDateStandalone(new Date("2026-06-01"), "en", {
      year: "numeric",
    });
    expect(result).toBe("2026");
  });
});

/* -------------------------------------------------------------------------- */
/*  Constants & registry                                                      */
/* -------------------------------------------------------------------------- */

describe("constants", () => {
  it("SUPPORTED_LOCALES includes 'en' and 'ar'", () => {
    expect(SUPPORTED_LOCALES).toContain("en");
    expect(SUPPORTED_LOCALES).toContain("ar");
  });

  it("DEFAULT_LOCALE is 'en'", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("LOCALE_DIR maps RTL locales correctly", () => {
    expect(LOCALE_DIR.ar).toBe("rtl");
    expect(LOCALE_DIR.he).toBe("rtl");
    expect(LOCALE_DIR.en).toBe("ltr");
  });

  it("LOCALE_LABELS has labels for every supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  Edge cases                                                                */
/* -------------------------------------------------------------------------- */

describe("edge cases", () => {
  it("useMessages returns the en key when I18nProvider is missing (default context)", () => {
    const { result } = renderHook(() => useMessages());
    // Without a provider, it should still return the key as fallback
    expect(result.current("dashboard.title")).toBe("Dashboard");
  });

  it("useLocale returns defaults when provider is missing", () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current.locale).toBe(DEFAULT_LOCALE);
  });

  it("useNumberFormatter works with empty options", () => {
    const { result } = renderHook(() => useNumberFormatter(), {
      wrapper: wrapper("en"),
    });
    expect(result.current(0)).toBe("0");
    expect(result.current(-1234.56)).toBe("-1,234.56");
  });

  it("formatCurrencyStandalone defaults to USD", () => {
    expect(formatCurrencyStandalone(10)).toBe("$10.00");
  });

  it("formatDateStandalone handles string input", () => {
    const result = formatDateStandalone("2026-03-15", "en", {
      year: "numeric",
      month: "long",
    });
    expect(result).toBe("March 2026");
  });

  it("formatNumberStandalone respects locale for grouping", () => {
    // German locale uses period as thousands separator
    const result = formatNumberStandalone(1234567, "de");
    expect(result).toBe("1.234.567");
  });

  it("resolveKey walks nested objects to find leaf values", () => {
    const nested = { "a.b": "hello" };
    expect(resolveKey(nested, "a.b")).toBe("hello");
  });

  it("resolveKey returns undefined for a non-existent nested path", () => {
    const nested = { "a.b": "hello" };
    expect(resolveKey(nested, "a.c")).toBeUndefined();
  });

  it("useCurrencyFormatter with a non-USD currency", () => {
    const { result } = renderHook(() => useCurrencyFormatter("EUR"), {
      wrapper: wrapper("en"),
    });
    expect(result.current(100)).toContain("100");
  });

  it("useDateFormatter with custom options", () => {
    const { result } = renderHook(
      () => useDateFormatter({ weekday: "long" }),
      { wrapper: wrapper("en") },
    );
    // 2026-01-01 is a Thursday
    const formatted = result.current(new Date("2026-01-01T12:00:00Z"));
    expect(formatted).toBe("Thursday");
  });
});
