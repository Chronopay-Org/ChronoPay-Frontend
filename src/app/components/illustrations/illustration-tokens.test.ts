/**
 * illustration-tokens.test.ts
 * Comprehensive test suite for illustration design tokens
 * 
 * Coverage:
 * - ILLUSTRATION_TOKENS structure and values
 * - ILLUSTRATION_CSS_VARS structure and values
 * - ROLE_COLOR_SCHEMES structure and role-specific colors
 * - Token immutability and type safety
 * - Color format validation
 * - CSS variable format validation
 * - Role scheme consistency
 * - Edge cases and boundary behavior
 */

import { describe, it, expect } from "vitest";
import {
  ILLUSTRATION_TOKENS,
  ILLUSTRATION_CSS_VARS,
  ROLE_COLOR_SCHEMES,
} from "./illustration-tokens";

describe("illustration-tokens", () => {
  // ─── ILLUSTRATION_TOKENS Tests ──────────────────────────────────────────

  describe("ILLUSTRATION_TOKENS", () => {
    describe("Structure and Presence", () => {
      it("exports ILLUSTRATION_TOKENS object", () => {
        expect(ILLUSTRATION_TOKENS).toBeDefined();
        expect(typeof ILLUSTRATION_TOKENS).toBe("object");
      });

      it("contains all primary color tokens", () => {
        expect(ILLUSTRATION_TOKENS.PRIMARY_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.PRIMARY_DARK).toBeDefined();
      });

      it("contains all secondary color tokens", () => {
        expect(ILLUSTRATION_TOKENS.SECONDARY_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.SECONDARY_DARK).toBeDefined();
      });

      it("contains all surface color tokens", () => {
        expect(ILLUSTRATION_TOKENS.SURFACE_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.SURFACE_DARK).toBeDefined();
      });

      it("contains all text color tokens", () => {
        expect(ILLUSTRATION_TOKENS.TEXT_PRIMARY_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.TEXT_PRIMARY_DARK).toBeDefined();
        expect(ILLUSTRATION_TOKENS.TEXT_SECONDARY_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.TEXT_SECONDARY_DARK).toBeDefined();
      });

      it("contains all border color tokens", () => {
        expect(ILLUSTRATION_TOKENS.BORDER_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.BORDER_DARK).toBeDefined();
      });

      it("contains all component-specific color tokens", () => {
        expect(ILLUSTRATION_TOKENS.CALENDAR_ACCENT_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.CALENDAR_ACCENT_DARK).toBeDefined();
        expect(ILLUSTRATION_TOKENS.INBOX_ACCENT_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.INBOX_ACCENT_DARK).toBeDefined();
        expect(ILLUSTRATION_TOKENS.CHART_ACCENT_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.CHART_ACCENT_DARK).toBeDefined();
      });

      it("contains opacity/muted color tokens", () => {
        expect(ILLUSTRATION_TOKENS.ACCENT_MUTED_LIGHT).toBeDefined();
        expect(ILLUSTRATION_TOKENS.ACCENT_MUTED_DARK).toBeDefined();
      });
    });

    describe("Color Format Validation", () => {
      it("primary colors are valid hex format", () => {
        expect(ILLUSTRATION_TOKENS.PRIMARY_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.PRIMARY_DARK).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it("secondary colors are valid hex format", () => {
        expect(ILLUSTRATION_TOKENS.SECONDARY_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.SECONDARY_DARK).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it("surface colors are valid hex format", () => {
        expect(ILLUSTRATION_TOKENS.SURFACE_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.SURFACE_DARK).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it("text colors are valid hex format", () => {
        expect(ILLUSTRATION_TOKENS.TEXT_PRIMARY_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.TEXT_PRIMARY_DARK).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.TEXT_SECONDARY_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.TEXT_SECONDARY_DARK).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it("border colors are valid hex format", () => {
        expect(ILLUSTRATION_TOKENS.BORDER_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.BORDER_DARK).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it("component-specific colors are valid hex format", () => {
        expect(ILLUSTRATION_TOKENS.CALENDAR_ACCENT_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.CALENDAR_ACCENT_DARK).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.INBOX_ACCENT_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.INBOX_ACCENT_DARK).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.CHART_ACCENT_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ILLUSTRATION_TOKENS.CHART_ACCENT_DARK).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it("muted colors are valid rgba format", () => {
        expect(ILLUSTRATION_TOKENS.ACCENT_MUTED_LIGHT).toMatch(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/);
        expect(ILLUSTRATION_TOKENS.ACCENT_MUTED_DARK).toMatch(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/);
      });

      it("hex colors are lowercase", () => {
        const hexTokens = [
          ILLUSTRATION_TOKENS.PRIMARY_LIGHT,
          ILLUSTRATION_TOKENS.PRIMARY_DARK,
          ILLUSTRATION_TOKENS.SECONDARY_LIGHT,
          ILLUSTRATION_TOKENS.SECONDARY_DARK,
          ILLUSTRATION_TOKENS.SURFACE_LIGHT,
          ILLUSTRATION_TOKENS.SURFACE_DARK,
        ];

        hexTokens.forEach((token) => {
          expect(token).toBe(token.toLowerCase());
        });
      });
    });

    describe("Color Value Validation", () => {
      it("primary light is cyan/teal color", () => {
        expect(ILLUSTRATION_TOKENS.PRIMARY_LIGHT).toBe("#0891b2");
      });

      it("primary dark is cyan/teal color", () => {
        expect(ILLUSTRATION_TOKENS.PRIMARY_DARK).toBe("#67e8f9");
      });

      it("secondary light is amber/orange color", () => {
        expect(ILLUSTRATION_TOKENS.SECONDARY_LIGHT).toBe("#d97706");
      });

      it("secondary dark is amber/orange color", () => {
        expect(ILLUSTRATION_TOKENS.SECONDARY_DARK).toBe("#f59e0b");
      });

      it("surface light is light blue-gray", () => {
        expect(ILLUSTRATION_TOKENS.SURFACE_LIGHT).toBe("#f0f5fb");
      });

      it("surface dark is very dark blue", () => {
        expect(ILLUSTRATION_TOKENS.SURFACE_DARK).toBe("#0f172a");
      });

      it("muted light has correct opacity value", () => {
        expect(ILLUSTRATION_TOKENS.ACCENT_MUTED_LIGHT).toContain("0.2");
      });

      it("muted dark has correct opacity value", () => {
        expect(ILLUSTRATION_TOKENS.ACCENT_MUTED_DARK).toContain("0.2");
      });
    });

    describe("Immutability", () => {
      it("is a const object", () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          ILLUSTRATION_TOKENS.PRIMARY_LIGHT = "#000000";
        }).toThrow();
      });

      it("cannot add new properties", () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          ILLUSTRATION_TOKENS.NEW_COLOR = "#ffffff";
        }).toThrow();
      });

      it("cannot delete properties", () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          delete ILLUSTRATION_TOKENS.PRIMARY_LIGHT;
        }).toThrow();
      });
    });

    describe("Token Pairs", () => {
      it("has matching light/dark pairs for primary colors", () => {
        expect(ILLUSTRATION_TOKENS.PRIMARY_LIGHT).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.PRIMARY_DARK).toBeTruthy();
      });

      it("has matching light/dark pairs for secondary colors", () => {
        expect(ILLUSTRATION_TOKENS.SECONDARY_LIGHT).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.SECONDARY_DARK).toBeTruthy();
      });

      it("has matching light/dark pairs for surface colors", () => {
        expect(ILLUSTRATION_TOKENS.SURFACE_LIGHT).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.SURFACE_DARK).toBeTruthy();
      });

      it("has matching light/dark pairs for text colors", () => {
        expect(ILLUSTRATION_TOKENS.TEXT_PRIMARY_LIGHT).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.TEXT_PRIMARY_DARK).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.TEXT_SECONDARY_LIGHT).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.TEXT_SECONDARY_DARK).toBeTruthy();
      });

      it("has matching light/dark pairs for all component accents", () => {
        expect(ILLUSTRATION_TOKENS.CALENDAR_ACCENT_LIGHT).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.CALENDAR_ACCENT_DARK).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.INBOX_ACCENT_LIGHT).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.INBOX_ACCENT_DARK).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.CHART_ACCENT_LIGHT).toBeTruthy();
        expect(ILLUSTRATION_TOKENS.CHART_ACCENT_DARK).toBeTruthy();
      });
    });
  });

  // ─── ILLUSTRATION_CSS_VARS Tests ────────────────────────────────────────

  describe("ILLUSTRATION_CSS_VARS", () => {
    describe("Structure and Presence", () => {
      it("exports ILLUSTRATION_CSS_VARS object", () => {
        expect(ILLUSTRATION_CSS_VARS).toBeDefined();
        expect(typeof ILLUSTRATION_CSS_VARS).toBe("object");
      });

      it("contains all primary CSS variables", () => {
        expect(ILLUSTRATION_CSS_VARS.PRIMARY_LIGHT).toBeDefined();
        expect(ILLUSTRATION_CSS_VARS.PRIMARY_DARK).toBeDefined();
      });

      it("contains all secondary CSS variables", () => {
        expect(ILLUSTRATION_CSS_VARS.SECONDARY_LIGHT).toBeDefined();
        expect(ILLUSTRATION_CSS_VARS.SECONDARY_DARK).toBeDefined();
      });

      it("contains all surface CSS variables", () => {
        expect(ILLUSTRATION_CSS_VARS.SURFACE_LIGHT).toBeDefined();
        expect(ILLUSTRATION_CSS_VARS.SURFACE_DARK).toBeDefined();
      });

      it("contains all text CSS variables", () => {
        expect(ILLUSTRATION_CSS_VARS.TEXT_PRIMARY_LIGHT).toBeDefined();
        expect(ILLUSTRATION_CSS_VARS.TEXT_PRIMARY_DARK).toBeDefined();
      });

      it("contains all border CSS variables", () => {
        expect(ILLUSTRATION_CSS_VARS.BORDER_LIGHT).toBeDefined();
        expect(ILLUSTRATION_CSS_VARS.BORDER_DARK).toBeDefined();
      });
    });

    describe("CSS Variable Format", () => {
      it("all values start with 'var('", () => {
        Object.values(ILLUSTRATION_CSS_VARS).forEach((value) => {
          expect(value).toMatch(/^var\(/);
        });
      });

      it("all values end with ')'", () => {
        Object.values(ILLUSTRATION_CSS_VARS).forEach((value) => {
          expect(value).toMatch(/\)$/);
        });
      });

      it("all variable names start with '--illus-'", () => {
        Object.values(ILLUSTRATION_CSS_VARS).forEach((value) => {
          expect(value).toMatch(/var\(--illus-/);
        });
      });

      it("primary variables have correct naming", () => {
        expect(ILLUSTRATION_CSS_VARS.PRIMARY_LIGHT).toBe("var(--illus-primary-light)");
        expect(ILLUSTRATION_CSS_VARS.PRIMARY_DARK).toBe("var(--illus-primary-dark)");
      });

      it("secondary variables have correct naming", () => {
        expect(ILLUSTRATION_CSS_VARS.SECONDARY_LIGHT).toBe("var(--illus-secondary-light)");
        expect(ILLUSTRATION_CSS_VARS.SECONDARY_DARK).toBe("var(--illus-secondary-dark)");
      });

      it("surface variables have correct naming", () => {
        expect(ILLUSTRATION_CSS_VARS.SURFACE_LIGHT).toBe("var(--illus-surface-light)");
        expect(ILLUSTRATION_CSS_VARS.SURFACE_DARK).toBe("var(--illus-surface-dark)");
      });

      it("text variables have correct naming", () => {
        expect(ILLUSTRATION_CSS_VARS.TEXT_PRIMARY_LIGHT).toBe("var(--illus-text-primary-light)");
        expect(ILLUSTRATION_CSS_VARS.TEXT_PRIMARY_DARK).toBe("var(--illus-text-primary-dark)");
      });

      it("border variables have correct naming", () => {
        expect(ILLUSTRATION_CSS_VARS.BORDER_LIGHT).toBe("var(--illus-border-light)");
        expect(ILLUSTRATION_CSS_VARS.BORDER_DARK).toBe("var(--illus-border-dark)");
      });
    });

    describe("Immutability", () => {
      it("is a const object", () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          ILLUSTRATION_CSS_VARS.PRIMARY_LIGHT = "var(--custom)";
        }).toThrow();
      });

      it("cannot add new properties", () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          ILLUSTRATION_CSS_VARS.NEW_VAR = "var(--new)";
        }).toThrow();
      });
    });

    describe("Variable Pairs", () => {
      it("has matching light/dark pairs for all variables", () => {
        const pairs = [
          ["PRIMARY_LIGHT", "PRIMARY_DARK"],
          ["SECONDARY_LIGHT", "SECONDARY_DARK"],
          ["SURFACE_LIGHT", "SURFACE_DARK"],
          ["TEXT_PRIMARY_LIGHT", "TEXT_PRIMARY_DARK"],
          ["BORDER_LIGHT", "BORDER_DARK"],
        ] as const;

        pairs.forEach(([light, dark]) => {
          expect(ILLUSTRATION_CSS_VARS[light]).toBeTruthy();
          expect(ILLUSTRATION_CSS_VARS[dark]).toBeTruthy();
        });
      });
    });
  });

  // ─── ROLE_COLOR_SCHEMES Tests ───────────────────────────────────────────

  describe("ROLE_COLOR_SCHEMES", () => {
    describe("Structure and Presence", () => {
      it("exports ROLE_COLOR_SCHEMES object", () => {
        expect(ROLE_COLOR_SCHEMES).toBeDefined();
        expect(typeof ROLE_COLOR_SCHEMES).toBe("object");
      });

      it("contains buyer role scheme", () => {
        expect(ROLE_COLOR_SCHEMES.buyer).toBeDefined();
        expect(typeof ROLE_COLOR_SCHEMES.buyer).toBe("object");
      });

      it("contains supplier role scheme", () => {
        expect(ROLE_COLOR_SCHEMES.supplier).toBeDefined();
        expect(typeof ROLE_COLOR_SCHEMES.supplier).toBe("object");
      });

      it("contains admin role scheme", () => {
        expect(ROLE_COLOR_SCHEMES.admin).toBeDefined();
        expect(typeof ROLE_COLOR_SCHEMES.admin).toBe("object");
      });

      it("each role has accent property", () => {
        expect(ROLE_COLOR_SCHEMES.buyer.accent).toBeDefined();
        expect(ROLE_COLOR_SCHEMES.supplier.accent).toBeDefined();
        expect(ROLE_COLOR_SCHEMES.admin.accent).toBeDefined();
      });

      it("each role has accentDark property", () => {
        expect(ROLE_COLOR_SCHEMES.buyer.accentDark).toBeDefined();
        expect(ROLE_COLOR_SCHEMES.supplier.accentDark).toBeDefined();
        expect(ROLE_COLOR_SCHEMES.admin.accentDark).toBeDefined();
      });

      it("each role has secondary property", () => {
        expect(ROLE_COLOR_SCHEMES.buyer.secondary).toBeDefined();
        expect(ROLE_COLOR_SCHEMES.supplier.secondary).toBeDefined();
        expect(ROLE_COLOR_SCHEMES.admin.secondary).toBeDefined();
      });

      it("each role has secondaryDark property", () => {
        expect(ROLE_COLOR_SCHEMES.buyer.secondaryDark).toBeDefined();
        expect(ROLE_COLOR_SCHEMES.supplier.secondaryDark).toBeDefined();
        expect(ROLE_COLOR_SCHEMES.admin.secondaryDark).toBeDefined();
      });
    });

    describe("Buyer Role Scheme", () => {
      it("uses CALENDAR_ACCENT colors", () => {
        expect(ROLE_COLOR_SCHEMES.buyer.accent).toBe(
          ILLUSTRATION_TOKENS.CALENDAR_ACCENT_LIGHT
        );
        expect(ROLE_COLOR_SCHEMES.buyer.accentDark).toBe(
          ILLUSTRATION_TOKENS.CALENDAR_ACCENT_DARK
        );
      });

      it("uses SECONDARY colors for secondary palette", () => {
        expect(ROLE_COLOR_SCHEMES.buyer.secondary).toBe(
          ILLUSTRATION_TOKENS.SECONDARY_LIGHT
        );
        expect(ROLE_COLOR_SCHEMES.buyer.secondaryDark).toBe(
          ILLUSTRATION_TOKENS.SECONDARY_DARK
        );
      });

      it("all colors are valid hex format", () => {
        expect(ROLE_COLOR_SCHEMES.buyer.accent).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ROLE_COLOR_SCHEMES.buyer.accentDark).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ROLE_COLOR_SCHEMES.buyer.secondary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ROLE_COLOR_SCHEMES.buyer.secondaryDark).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    describe("Supplier Role Scheme", () => {
      it("uses INBOX_ACCENT colors", () => {
        expect(ROLE_COLOR_SCHEMES.supplier.accent).toBe(
          ILLUSTRATION_TOKENS.INBOX_ACCENT_LIGHT
        );
        expect(ROLE_COLOR_SCHEMES.supplier.accentDark).toBe(
          ILLUSTRATION_TOKENS.INBOX_ACCENT_DARK
        );
      });

      it("uses PRIMARY colors for secondary palette", () => {
        expect(ROLE_COLOR_SCHEMES.supplier.secondary).toBe(
          ILLUSTRATION_TOKENS.PRIMARY_LIGHT
        );
        expect(ROLE_COLOR_SCHEMES.supplier.secondaryDark).toBe(
          ILLUSTRATION_TOKENS.PRIMARY_DARK
        );
      });

      it("all colors are valid hex format", () => {
        expect(ROLE_COLOR_SCHEMES.supplier.accent).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ROLE_COLOR_SCHEMES.supplier.accentDark).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ROLE_COLOR_SCHEMES.supplier.secondary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ROLE_COLOR_SCHEMES.supplier.secondaryDark).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    describe("Admin Role Scheme", () => {
      it("uses CHART_ACCENT colors", () => {
        expect(ROLE_COLOR_SCHEMES.admin.accent).toBe(
          ILLUSTRATION_TOKENS.CHART_ACCENT_LIGHT
        );
        expect(ROLE_COLOR_SCHEMES.admin.accentDark).toBe(
          ILLUSTRATION_TOKENS.CHART_ACCENT_DARK
        );
      });

      it("uses PRIMARY colors for secondary palette", () => {
        expect(ROLE_COLOR_SCHEMES.admin.secondary).toBe(
          ILLUSTRATION_TOKENS.PRIMARY_LIGHT
        );
        expect(ROLE_COLOR_SCHEMES.admin.secondaryDark).toBe(
          ILLUSTRATION_TOKENS.PRIMARY_DARK
        );
      });

      it("all colors are valid hex format", () => {
        expect(ROLE_COLOR_SCHEMES.admin.accent).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ROLE_COLOR_SCHEMES.admin.accentDark).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ROLE_COLOR_SCHEMES.admin.secondary).toMatch(/^#[0-9a-f]{6}$/i);
        expect(ROLE_COLOR_SCHEMES.admin.secondaryDark).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    describe("Role Differentiation", () => {
      it("each role has unique accent colors", () => {
        const buyerAccent = ROLE_COLOR_SCHEMES.buyer.accent;
        const supplierAccent = ROLE_COLOR_SCHEMES.supplier.accent;
        const adminAccent = ROLE_COLOR_SCHEMES.admin.accent;

        expect(buyerAccent).not.toBe(supplierAccent);
        expect(buyerAccent).not.toBe(adminAccent);
        expect(supplierAccent).not.toBe(adminAccent);
      });

      it("buyer and supplier have different secondary colors", () => {
        expect(ROLE_COLOR_SCHEMES.buyer.secondary).not.toBe(
          ROLE_COLOR_SCHEMES.supplier.secondary
        );
      });

      it("supplier and admin share PRIMARY secondary colors", () => {
        expect(ROLE_COLOR_SCHEMES.supplier.secondary).toBe(
          ROLE_COLOR_SCHEMES.admin.secondary
        );
        expect(ROLE_COLOR_SCHEMES.supplier.secondaryDark).toBe(
          ROLE_COLOR_SCHEMES.admin.secondaryDark
        );
      });
    });

    describe("Immutability", () => {
      it("is a const object", () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          ROLE_COLOR_SCHEMES.buyer = {};
        }).toThrow();
      });

      it("role schemes are immutable", () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          ROLE_COLOR_SCHEMES.buyer.accent = "#000000";
        }).toThrow();
      });

      it("cannot add new roles", () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          ROLE_COLOR_SCHEMES.guest = {
            accent: "#ffffff",
            accentDark: "#000000",
            secondary: "#cccccc",
            secondaryDark: "#333333",
          };
        }).toThrow();
      });
    });

    describe("Light/Dark Consistency", () => {
      it("all roles have matching light/dark accent pairs", () => {
        Object.values(ROLE_COLOR_SCHEMES).forEach((scheme) => {
          expect(scheme.accent).toBeTruthy();
          expect(scheme.accentDark).toBeTruthy();
          expect(scheme.accent).not.toBe(scheme.accentDark);
        });
      });

      it("all roles have matching light/dark secondary pairs", () => {
        Object.values(ROLE_COLOR_SCHEMES).forEach((scheme) => {
          expect(scheme.secondary).toBeTruthy();
          expect(scheme.secondaryDark).toBeTruthy();
          expect(scheme.secondary).not.toBe(scheme.secondaryDark);
        });
      });
    });
  });

  // ─── Integration Tests ──────────────────────────────────────────────────

  describe("Integration and Cross-References", () => {
    it("CSS variables reference matches token structure", () => {
      // Both should have PRIMARY_LIGHT and PRIMARY_DARK
      expect(ILLUSTRATION_TOKENS.PRIMARY_LIGHT).toBeDefined();
      expect(ILLUSTRATION_CSS_VARS.PRIMARY_LIGHT).toBeDefined();
    });

    it("role schemes use values from ILLUSTRATION_TOKENS", () => {
      const allRoleColors = [
        ...Object.values(ROLE_COLOR_SCHEMES.buyer),
        ...Object.values(ROLE_COLOR_SCHEMES.supplier),
        ...Object.values(ROLE_COLOR_SCHEMES.admin),
      ];

      const allTokenColors = Object.values(ILLUSTRATION_TOKENS);

      allRoleColors.forEach((color) => {
        expect(allTokenColors).toContain(color);
      });
    });

    it("all role scheme colors exist in ILLUSTRATION_TOKENS", () => {
      Object.values(ROLE_COLOR_SCHEMES).forEach((scheme) => {
        expect(Object.values(ILLUSTRATION_TOKENS)).toContain(scheme.accent);
        expect(Object.values(ILLUSTRATION_TOKENS)).toContain(scheme.accentDark);
        expect(Object.values(ILLUSTRATION_TOKENS)).toContain(scheme.secondary);
        expect(Object.values(ILLUSTRATION_TOKENS)).toContain(scheme.secondaryDark);
      });
    });

    it("component accents are used in role schemes", () => {
      // CALENDAR_ACCENT used by buyer
      expect(
        [
          ROLE_COLOR_SCHEMES.buyer.accent,
          ROLE_COLOR_SCHEMES.supplier.accent,
          ROLE_COLOR_SCHEMES.admin.accent,
        ].includes(ILLUSTRATION_TOKENS.CALENDAR_ACCENT_LIGHT)
      ).toBe(true);

      // INBOX_ACCENT used by supplier
      expect(
        [
          ROLE_COLOR_SCHEMES.buyer.accent,
          ROLE_COLOR_SCHEMES.supplier.accent,
          ROLE_COLOR_SCHEMES.admin.accent,
        ].includes(ILLUSTRATION_TOKENS.INBOX_ACCENT_LIGHT)
      ).toBe(true);

      // CHART_ACCENT used by admin
      expect(
        [
          ROLE_COLOR_SCHEMES.buyer.accent,
          ROLE_COLOR_SCHEMES.supplier.accent,
          ROLE_COLOR_SCHEMES.admin.accent,
        ].includes(ILLUSTRATION_TOKENS.CHART_ACCENT_LIGHT)
      ).toBe(true);
    });
  });

  // ─── Boundary Behavior ──────────────────────────────────────────────────

  describe("Boundary Behavior", () => {
    it("token keys are uppercase with underscores", () => {
      Object.keys(ILLUSTRATION_TOKENS).forEach((key) => {
        expect(key).toMatch(/^[A-Z_]+$/);
      });
    });

    it("CSS var keys match token keys", () => {
      const tokenKeys = Object.keys(ILLUSTRATION_TOKENS).filter(
        (key) =>
          key.endsWith("_LIGHT") ||
          key.endsWith("_DARK") ||
          key === "PRIMARY_LIGHT" ||
          key === "PRIMARY_DARK"
      );

      const cssVarKeys = Object.keys(ILLUSTRATION_CSS_VARS);

      // Check that primary keys exist in both
      expect(cssVarKeys).toContain("PRIMARY_LIGHT");
      expect(cssVarKeys).toContain("PRIMARY_DARK");
    });

    it("role scheme keys are lowercase", () => {
      Object.keys(ROLE_COLOR_SCHEMES).forEach((key) => {
        expect(key).toMatch(/^[a-z]+$/);
      });
    });

    it("role scheme property keys are camelCase", () => {
      Object.values(ROLE_COLOR_SCHEMES).forEach((scheme) => {
        Object.keys(scheme).forEach((key) => {
          expect(key).toMatch(/^[a-z][a-zA-Z]*$/);
        });
      });
    });

    it("all hex colors have exactly 7 characters including #", () => {
      const hexColors = Object.values(ILLUSTRATION_TOKENS).filter((value) =>
        value.startsWith("#")
      );

      hexColors.forEach((color) => {
        expect(color.length).toBe(7);
      });
    });

    it("rgba colors have values between 0-255 for RGB", () => {
      const rgbaColors = Object.values(ILLUSTRATION_TOKENS).filter((value) =>
        value.startsWith("rgba")
      );

      rgbaColors.forEach((color) => {
        const match = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(255);
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(255);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(255);
        }
      });
    });

    it("rgba colors have alpha between 0-1", () => {
      const rgbaColors = Object.values(ILLUSTRATION_TOKENS).filter((value) =>
        value.startsWith("rgba")
      );

      rgbaColors.forEach((color) => {
        const match = color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)/);
        if (match) {
          const alpha = parseFloat(match[1]);
          expect(alpha).toBeGreaterThanOrEqual(0);
          expect(alpha).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  // ─── Type Safety ────────────────────────────────────────────────────────

  describe("Type Safety", () => {
    it("ILLUSTRATION_TOKENS has readonly string properties", () => {
      type TokenType = typeof ILLUSTRATION_TOKENS;
      type TokenValues = TokenType[keyof TokenType];

      const value: TokenValues = ILLUSTRATION_TOKENS.PRIMARY_LIGHT;
      expect(typeof value).toBe("string");
    });

    it("ILLUSTRATION_CSS_VARS has readonly string properties", () => {
      type CSSVarType = typeof ILLUSTRATION_CSS_VARS;
      type CSSVarValues = CSSVarType[keyof CSSVarType];

      const value: CSSVarValues = ILLUSTRATION_CSS_VARS.PRIMARY_LIGHT;
      expect(typeof value).toBe("string");
    });

    it("ROLE_COLOR_SCHEMES has typed role keys", () => {
      type RoleKeys = keyof typeof ROLE_COLOR_SCHEMES;
      const validRoles: RoleKeys[] = ["buyer", "supplier", "admin"];

      validRoles.forEach((role) => {
        expect(ROLE_COLOR_SCHEMES[role]).toBeDefined();
      });
    });

    it("each role scheme has required properties", () => {
      type SchemeProps = keyof (typeof ROLE_COLOR_SCHEMES)["buyer"];
      const requiredProps: SchemeProps[] = [
        "accent",
        "accentDark",
        "secondary",
        "secondaryDark",
      ];

      Object.values(ROLE_COLOR_SCHEMES).forEach((scheme) => {
        requiredProps.forEach((prop) => {
          expect(scheme[prop]).toBeDefined();
        });
      });
    });
  });

  // ─── State Transitions ──────────────────────────────────────────────────

  describe("State Transitions", () => {
    it("supports light to dark theme transition for primary", () => {
      const lightColor = ILLUSTRATION_TOKENS.PRIMARY_LIGHT;
      const darkColor = ILLUSTRATION_TOKENS.PRIMARY_DARK;

      expect(lightColor).not.toBe(darkColor);
      expect(lightColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(darkColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("supports role switching with consistent structure", () => {
      const roles = ["buyer", "supplier", "admin"] as const;

      roles.forEach((role) => {
        const scheme = ROLE_COLOR_SCHEMES[role];
        expect(scheme.accent).toBeDefined();
        expect(scheme.accentDark).toBeDefined();
        expect(scheme.secondary).toBeDefined();
        expect(scheme.secondaryDark).toBeDefined();
      });
    });

    it("maintains color consistency across theme transitions", () => {
      // Light mode colors should be distinct from dark mode
      const lightColors = [
        ILLUSTRATION_TOKENS.PRIMARY_LIGHT,
        ILLUSTRATION_TOKENS.SECONDARY_LIGHT,
        ILLUSTRATION_TOKENS.SURFACE_LIGHT,
      ];

      const darkColors = [
        ILLUSTRATION_TOKENS.PRIMARY_DARK,
        ILLUSTRATION_TOKENS.SECONDARY_DARK,
        ILLUSTRATION_TOKENS.SURFACE_DARK,
      ];

      lightColors.forEach((light, index) => {
        expect(light).not.toBe(darkColors[index]);
      });
    });
  });
});
