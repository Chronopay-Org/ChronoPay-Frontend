import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import LocalePicker from "./locale-picker";

describe("LocalePicker", () => {
  afterEach(() => {
    document.cookie = "locale=; max-age=0; path=/";
    document.documentElement.lang = "";
    document.documentElement.dir = "";
  });

  it("renders the available locales and defaults to English", () => {
    render(<LocalePicker />);

    const selector = screen.getByRole("combobox", { name: "Language selector" });
    expect(selector).toHaveValue("en");
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "العربية" })).toHaveAttribute(
      "dir",
      "rtl",
    );
  });

  it("restores a supported locale from the cookie and applies its direction", () => {
    document.cookie = "locale=ar; path=/";

    render(<LocalePicker />);

    expect(screen.getByRole("combobox", { name: "Language selector" })).toHaveValue(
      "ar",
    );
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("falls back to English for an unsupported stored locale", () => {
    document.cookie = "locale=xx; path=/";

    render(<LocalePicker />);

    expect(screen.getByRole("combobox", { name: "Language selector" })).toHaveValue(
      "en",
    );
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("updates the selected locale, document direction, and cookie", () => {
    render(<LocalePicker />);

    const selector = screen.getByRole("combobox", { name: "Language selector" });
    fireEvent.change(selector, { target: { value: "he" } });

    expect(selector).toHaveValue("he");
    expect(document.documentElement.lang).toBe("he");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.cookie).toContain("locale=he");
  });

  it("returns to left-to-right direction when a left-to-right locale is selected", () => {
    document.cookie = "locale=ar; path=/";
    render(<LocalePicker />);

    const selector = screen.getByRole("combobox", { name: "Language selector" });
    fireEvent.change(selector, { target: { value: "fr" } });

    expect(selector).toHaveValue("fr");
    expect(document.documentElement.lang).toBe("fr");
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.cookie).toContain("locale=fr");
  });

  it("ignores an unsupported locale change", () => {
    render(<LocalePicker />);

    fireEvent.change(screen.getByRole("combobox", { name: "Language selector" }), {
      target: { value: "xx" },
    });

    expect(screen.getByRole("combobox", { name: "Language selector" })).toHaveValue(
      "en",
    );
    expect(document.documentElement.lang).toBe("");
    expect(document.documentElement.dir).toBe("");
    expect(document.cookie).not.toContain("locale=xx");
  });
});