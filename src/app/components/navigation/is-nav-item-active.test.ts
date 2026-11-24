import { describe, it, expect } from "vitest";
import { isNavItemActive } from "./is-nav-item-active";

const BUYER_HREFS = ["/dashboard", "/marketplace", "/dashboard/settings"];
const SUPPLIER_HREFS = [
  "/dashboard",
  "/dashboard/onboarding/services",
  "/dashboard/onboarding/payout",
  "/dashboard/settings",
];

describe("isNavItemActive", () => {
  it("marks an item active on an exact route match", () => {
    expect(isNavItemActive("/dashboard", "/dashboard", BUYER_HREFS)).toBe(true);
    expect(isNavItemActive("/dashboard/settings", "/dashboard/settings", BUYER_HREFS)).toBe(true);
  });

  it("does not mark a section root active on its child routes", () => {
    // "Home" (/dashboard) must not claim every /dashboard/* route.
    expect(isNavItemActive("/dashboard/settings", "/dashboard", BUYER_HREFS)).toBe(false);
    expect(isNavItemActive("/dashboard/onboarding/payout", "/dashboard", SUPPLIER_HREFS)).toBe(false);
  });

  it("marks the deepest matching item and leaves its ancestors inactive", () => {
    const pathname = "/dashboard/onboarding/services";
    expect(isNavItemActive(pathname, "/dashboard/onboarding/services", SUPPLIER_HREFS)).toBe(true);
    expect(isNavItemActive(pathname, "/dashboard", SUPPLIER_HREFS)).toBe(false);
    expect(isNavItemActive(pathname, "/dashboard/onboarding/payout", SUPPLIER_HREFS)).toBe(false);
    expect(isNavItemActive(pathname, "/dashboard/settings", SUPPLIER_HREFS)).toBe(false);
  });

  it("keeps a non-root item active for its own child routes", () => {
    expect(isNavItemActive("/marketplace/listing/42", "/marketplace", BUYER_HREFS)).toBe(true);
  });

  it("prefers the longest matching href for nested nav items", () => {
    const hrefs = ["/dashboard", "/dashboard/settings", "/dashboard/settings/security"];
    const pathname = "/dashboard/settings/security";
    expect(isNavItemActive(pathname, "/dashboard/settings/security", hrefs)).toBe(true);
    expect(isNavItemActive(pathname, "/dashboard/settings", hrefs)).toBe(false);
  });

  it("does not match a sibling that shares an href prefix", () => {
    expect(isNavItemActive("/dashboard/settings-legacy", "/dashboard/settings", BUYER_HREFS)).toBe(false);
    expect(isNavItemActive("/marketplaces", "/marketplace", BUYER_HREFS)).toBe(false);
  });

  it("marks nothing active on unrelated routes", () => {
    BUYER_HREFS.forEach((href) => {
      expect(isNavItemActive("/pricing", href, BUYER_HREFS)).toBe(false);
    });
  });

  it("falls back to prefix matching when no sibling hrefs are given", () => {
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavItemActive("/dashboard/onboarding/services", "/dashboard/onboarding")).toBe(true);
  });

  it("returns false for empty pathname or href", () => {
    expect(isNavItemActive("", "/dashboard", BUYER_HREFS)).toBe(false);
    expect(isNavItemActive("/dashboard", "", BUYER_HREFS)).toBe(false);
  });
});
