import { describe, expect, it } from "vitest";
import { getMessages, REGISTERED_LOCALES } from "./i18n";

describe("i18n catalogue key parity", () => {
  const enMessages = getMessages("en");
  const enKeys = Object.keys(enMessages).sort();

  it("registers en, es, and ar catalogues", () => {
    expect(REGISTERED_LOCALES).toContain("en");
    expect(REGISTERED_LOCALES).toContain("es");
    expect(REGISTERED_LOCALES).toContain("ar");
  });

  for (const locale of REGISTERED_LOCALES) {
    if (locale === "en") continue;

    it(`catalogue "${locale}" has the exact same keys as "en"`, () => {
      const messages = getMessages(locale);
      const keys = Object.keys(messages).sort();
      expect(keys).toEqual(enKeys);
    });

    it(`catalogue "${locale}" has non-empty string values for every key`, () => {
      const messages = getMessages(locale);
      for (const key of enKeys) {
        expect(typeof messages[key]).toBe("string");
        expect(messages[key].trim().length).toBeGreaterThan(0);
      }
    });
  }

  it("returns translated navigation and footer strings for es and ar", () => {
    const es = getMessages("es");
    const ar = getMessages("ar");

    expect(es["nav.home"]).toBe("Inicio");
    expect(es["nav.dashboard"]).toBe("Panel");
    expect(es["footer.liveDemo"]).toBe("Demo en vivo");

    expect(ar["nav.home"]).toBe("الرئيسية");
    expect(ar["nav.dashboard"]).toBe("لوحة التحكم");
    expect(ar["footer.liveDemo"]).toBe("العرض المباشر");
  });
});
