import { describe, it, expect } from "vitest";
import * as IllustrationsIndex from "./index";

describe("Illustrations Index (Barrel File)", () => {
  it("exports all expected React components", () => {
    // Assert components are defined and are functions (React components)
    expect(IllustrationsIndex.EmptyBookingsBuyer).toBeTypeOf("function");
    expect(IllustrationsIndex.EmptyBookingsSupplier).toBeTypeOf("function");
    expect(IllustrationsIndex.EmptyBookingsAdmin).toBeTypeOf("function");
  });

  it("exports all expected design tokens and CSS variables", () => {
    // Assert token objects are defined
    expect(IllustrationsIndex.ILLUSTRATION_TOKENS).toBeDefined();
    expect(IllustrationsIndex.ILLUSTRATION_CSS_VARS).toBeDefined();
    expect(IllustrationsIndex.ROLE_COLOR_SCHEMES).toBeDefined();

    // Verify some expected keys exist on tokens
    expect(IllustrationsIndex.ILLUSTRATION_TOKENS).toHaveProperty("PRIMARY_LIGHT");
    expect(IllustrationsIndex.ILLUSTRATION_TOKENS).toHaveProperty("PRIMARY_DARK");
    
    expect(IllustrationsIndex.ILLUSTRATION_CSS_VARS).toHaveProperty("PRIMARY_LIGHT");
    
    expect(IllustrationsIndex.ROLE_COLOR_SCHEMES).toHaveProperty("buyer");
    expect(IllustrationsIndex.ROLE_COLOR_SCHEMES).toHaveProperty("supplier");
    expect(IllustrationsIndex.ROLE_COLOR_SCHEMES).toHaveProperty("admin");
  });

  it("does not expose any unexpected top-level exports", () => {
    const exportedKeys = Object.keys(IllustrationsIndex);
    const expectedKeys = [
      "EmptyBookingsBuyer",
      "EmptyBookingsSupplier",
      "EmptyBookingsAdmin",
      "ILLUSTRATION_TOKENS",
      "ILLUSTRATION_CSS_VARS",
      "ROLE_COLOR_SCHEMES"
    ];

    // Check that we only export what is expected
    expect(exportedKeys.sort()).toEqual(expectedKeys.sort());
  });

  it("exports valid role color schemes that reference correct tokens", () => {
    const adminScheme = IllustrationsIndex.ROLE_COLOR_SCHEMES.admin;
    const tokens = IllustrationsIndex.ILLUSTRATION_TOKENS;

    expect(adminScheme.accent).toBe(tokens.CHART_ACCENT_LIGHT);
    expect(adminScheme.accentDark).toBe(tokens.CHART_ACCENT_DARK);
  });
});
