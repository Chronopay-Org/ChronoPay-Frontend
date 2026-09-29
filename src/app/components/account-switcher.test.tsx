import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceFile = "src/app/components/account-switcher.tsx";
const sourcePath = path.join(root, sourceFile);

const readSource = () => fs.readFileSync(sourcePath, "utf8");

describe("AccountSwitcher (source contract)", () => {
  it("exists at the expected path", () => {
    expect(fs.existsSync(sourcePath)).toBe(true);
  });

  it("is a client component", () => {
    const src = readSource();
    expect(src.trimStart().startsWith('"use client";')).toBe(true);
  });

  it("exports a named AccountSwitcher component (no default export)", () => {
    const src = readSource();
    expect(src).toMatch(/export\s+function\s+AccountSwitcher\s*\(/);
    expect(src).not.toMatch(/export\s+default\s/);
  });

  it("accepts an optional className prop", () => {
    const src = readSource();
    expect(src).toMatch(/interface\s+AccountSwitcherProps/);
    expect(src).toMatch(/className\?:\s*string/);
  });

  it("imports the useAccounts hook", () => {
    const src = readSource();
    expect(src).toMatch(/from\s+"@\/hooks\/use-accounts"/);
  });

  it("uses the ARIA combobox + listbox pattern", () => {
    const src = readSource();
    expect(src).toMatch(/role="combobox"/);
    expect(src).toMatch(/role="listbox"/);
    expect(src).toMatch(/role="option"/);
    expect(src).toMatch(/aria-expanded=/);
    expect(src).toMatch(/aria-controls=/);
    expect(src).toMatch(/aria-activedescendant=/);
  });

  it("announces account switches via a polite live region", () => {
    const src = readSource();
    expect(src).toMatch(/role="status"/);
    expect(src).toMatch(/aria-live="polite"/);
    expect(src).toMatch(/aria-atomic="true"/);
  });

  it("implements keyboard navigation (Arrow keys, Enter, Escape, Tab)", () => {
    const src = readSource();
    expect(src).toMatch(/case\s+"ArrowDown":/);
    expect(src).toMatch(/case\s+"ArrowUp":/);
    expect(src).toMatch(/case\s+"Enter":/);
    expect(src).toMatch(/case\s+"Escape":/);
    expect(src).toMatch(/case\s+"Tab":/);
  });

  it("closes on click-outside via a pointerdown listener", () => {
    const src = readSource();
    expect(src).toMatch(/addEventListener\(\s*"pointerdown"/);
  });

  it("marks the currently active account with aria-current", () => {
    const src = readSource();
    expect(src).toMatch(/aria-current=\{isActive\s*\?\s*"true"\s*:\s*undefined\}/);
  });

  it("renders a search input with typeahead semantics", () => {
    const src = readSource();
    expect(src).toMatch(/aria-autocomplete="list"/);
    expect(src).toMatch(/placeholder="Search accounts/);
  });

  it("renders an 'Add account' action that opens the wallet modal", () => {
    const src = readSource();
    expect(src).toMatch(/WalletConnectModal/);
    expect(src).toMatch(/Add account/);
  });
});