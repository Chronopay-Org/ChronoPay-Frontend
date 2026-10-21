import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BidiIsolate, isRTL, formatDateParts, formatTimeParts } from "./bidi";

describe("isRTL", () => {
  it("returns true for Arabic", () => {
    expect(isRTL("ar")).toBe(true);
    expect(isRTL("ar-SA")).toBe(true);
  });

  it("returns true for Hebrew", () => {
    expect(isRTL("he")).toBe(true);
    expect(isRTL("he-IL")).toBe(true);
  });

  it("returns true for Farsi", () => {
    expect(isRTL("fa")).toBe(true);
  });

  it("returns true for Urdu", () => {
    expect(isRTL("ur")).toBe(true);
    expect(isRTL("ur-PK")).toBe(true);
  });

  it("returns false for LTR locales", () => {
    expect(isRTL("en")).toBe(false);
    expect(isRTL("en-US")).toBe(false);
    expect(isRTL("es")).toBe(false);
    expect(isRTL("fr")).toBe(false);
    expect(isRTL("de")).toBe(false);
    expect(isRTL("hi")).toBe(false);
  });
});

describe("BidiIsolate", () => {
  it("renders children without isolation for LTR locale", () => {
    render(<BidiIsolate locale="en">14:00</BidiIsolate>);
    const el = screen.getByText("14:00");
    expect(el.tagName).toBe("SPAN");
    expect(el).not.toHaveAttribute("dir");
  });

  it("renders children with dir=ltr and unicode-bidi isolate for RTL locale", () => {
    render(<BidiIsolate locale="ar">14:00</BidiIsolate>);
    const el = screen.getByText("14:00");
    expect(el).toHaveAttribute("dir", "ltr");
    expect(el.style.unicodeBidi).toBe("isolate");
  });

  it("renders with dir=ltr and isolate for Hebrew", () => {
    render(<BidiIsolate locale="he">10:00 - 11:30</BidiIsolate>);
    const el = screen.getByText("10:00 - 11:30");
    expect(el).toHaveAttribute("dir", "ltr");
    expect(el.style.unicodeBidi).toBe("isolate");
  });

  it("applies custom className", () => {
    render(
      <BidiIsolate locale="ar" className="font-mono">
        14:00
      </BidiIsolate>
    );
    const el = screen.getByText("14:00");
    expect(el.className).toContain("font-mono");
  });

  it("renders custom element via as prop", () => {
    render(
      <BidiIsolate locale="ar" as="strong">
        14:00
      </BidiIsolate>
    );
    const el = screen.getByText("14:00");
    expect(el.tagName).toBe("STRONG");
  });

  it("defaults to span when no locale provided (isolation off)", () => {
    render(<BidiIsolate>14:00</BidiIsolate>);
    const el = screen.getByText("14:00");
    expect(el.tagName).toBe("SPAN");
    expect(el).not.toHaveAttribute("dir");
  });
});

describe("formatDateParts", () => {
  it("returns RTL flag true for Arabic locale", () => {
    const result = formatDateParts(new Date("2026-04-01"), "ar");
    expect(result.isRTL).toBe(true);
    expect(result.text).toBeTruthy();
  });

  it("returns RTL flag false for English locale", () => {
    const result = formatDateParts(new Date("2026-04-01"), "en-US");
    expect(result.isRTL).toBe(false);
    expect(result.text).toBeTruthy();
  });

  it("formats date in locale-aware order", () => {
    const date = new Date("2026-07-15T12:00:00Z");
    const enResult = formatDateParts(date, "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(enResult.text).toContain("July");
    expect(enResult.text).toContain("15");
    expect(enResult.text).toContain("2026");
  });
});

describe("formatTimeParts", () => {
  it("returns RTL flag true for Hebrew locale", () => {
    const result = formatTimeParts(new Date("2026-04-01T14:00:00Z"), "he");
    expect(result.isRTL).toBe(true);
    expect(result.text).toBeTruthy();
  });

  it("returns RTL flag false for English", () => {
    const result = formatTimeParts(new Date("2026-04-01T14:00:00Z"), "en-US");
    expect(result.isRTL).toBe(false);
  });
});
