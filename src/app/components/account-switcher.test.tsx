import fs from "node:fs";
import path from "node:path";
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountSwitcher } from "./account-switcher";

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

describe("AccountSwitcher (wallet connection & providers)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? false : true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
  });

  it("opens modal and renders shared wallet providers when 'Add account' is clicked", async () => {
    const user = userEvent.setup();
    render(<AccountSwitcher />);

    // Open dropdown menu
    const trigger = screen.getByRole("button", { name: /switch account/i });
    await user.click(trigger);

    // Click 'Add account'
    const addAccountBtn = screen.getByRole("button", { name: /add account/i });
    await user.click(addAccountBtn);

    // Modal should be open and list shared providers
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Connect to Freighter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Connect to xBull/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Connect to Albedo/i }),
    ).toBeInTheDocument();
  });

  it("successfully connects a provider and calls addAccount, adding it to the accounts list", async () => {
    const user = userEvent.setup();
    const mockConnector = vi.fn().mockResolvedValue({
      address: "GBXBL4OQJ2KLK6GVM3V7W5X3M4YVJY6XLP3DQE7H6R5YTZ1KLA8BULL",
      label: "Custom xBull",
      provider: "xbull",
    });

    render(<AccountSwitcher connector={mockConnector} />);

    // Open dropdown menu
    await user.click(screen.getByRole("button", { name: /switch account/i }));

    // Click 'Add account'
    await user.click(screen.getByRole("button", { name: /add account/i }));

    // Choose xBull
    const connectBtn = screen.getByRole("button", { name: /Connect to xBull/i });
    await user.click(connectBtn);

    expect(mockConnector).toHaveBeenCalledWith("xbull");

    // Modal should close on success
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Reopen dropdown menu to verify the new account exists
    await user.click(screen.getByRole("button", { name: /switch account/i }));
    expect(screen.getAllByText("Custom xBull").length).toBeGreaterThanOrEqual(1);
  });

  it("surfaces connector errors in the modal error state with retry button", async () => {
    const user = userEvent.setup();
    const mockConnector = vi
      .fn()
      .mockRejectedValueOnce(new Error("User rejected extension access"))
      .mockResolvedValueOnce({
        address: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
        label: "Freighter Account",
        provider: "freighter",
      });

    render(<AccountSwitcher connector={mockConnector} />);

    // Open dropdown and click Add account
    await user.click(screen.getByRole("button", { name: /switch account/i }));
    await user.click(screen.getByRole("button", { name: /add account/i }));

    // Choose Freighter
    await user.click(screen.getByRole("button", { name: /Connect to Freighter/i }));

    // Should show error state in modal
    await waitFor(() => {
      expect(screen.getByText("User rejected extension access")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();

    // Click retry
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(mockConnector).toHaveBeenCalledTimes(2);

    // Should close modal after retry succeeds
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});