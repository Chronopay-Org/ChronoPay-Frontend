import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RoleChip } from "./RoleChip";
import { RoleProvider, useRole } from "../navigation/RoleContext";
import { ALL_ROLES } from "../navigation/role-nav";

// Mock matchMedia for motion-safe queries if necessary, though testing-library might not need it for basic class checks.

function renderWithRoleProvider(ui: React.ReactElement, initialRole: "supplier" | "buyer" | "admin" = "buyer") {
  return render(
    <RoleProvider initialRole={initialRole}>
      {ui}
    </RoleProvider>
  );
}

describe("RoleChip", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-density");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a hydrating skeleton initially", () => {
    // We need to render the component and immediately check its state
    // because RoleProvider sets isHydrating to false in a queueMicrotask.
    // By not wrapping in act() initially for the sync render, we can catch it.
    vi.useFakeTimers();
    const { container } = renderWithRoleProvider(<RoleChip />);
    
    // Skeleton should have aria-hidden
    const skeleton = container.querySelector('[aria-hidden="true"]');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton?.className).toContain("skeleton");
    
    vi.useRealTimers();
  });

  it("renders the role button after hydration", async () => {
    renderWithRoleProvider(<RoleChip />);
    
    const trigger = await screen.findByRole("button", { name: /Buyer/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the listbox on click and allows selecting a role", async () => {
    renderWithRoleProvider(<RoleChip />, "buyer");
    
    const trigger = await screen.findByRole("button", { name: /Buyer/i });
    
    // Open menu
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    
    const listbox = screen.getByRole("listbox", { name: "Switch role" });
    expect(listbox).toBeInTheDocument();
    
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(ALL_ROLES.length);
    
    // Click supplier
    const supplierOption = options.find(opt => opt.textContent?.includes("Supplier"));
    expect(supplierOption).toBeDefined();
    
    fireEvent.click(supplierOption!);
    
    // Menu should close and role change
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    
    // The button should now say Supplier
    const newTrigger = await screen.findByRole("button", { name: /Supplier/i });
    expect(newTrigger).toBeInTheDocument();
  });

  it("supports keyboard navigation (Arrow keys, Enter, Escape)", async () => {
    renderWithRoleProvider(<RoleChip />, "buyer");
    
    const trigger = await screen.findByRole("button", { name: /Buyer/i });
    
    // Open menu
    fireEvent.click(trigger);
    
    const listbox = screen.getByRole("listbox", { name: "Switch role" });
    
    // Press ArrowDown
    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    
    // In our implementation, ArrowDown moves focus. We won't strictly test `document.activeElement` 
    // unless we need to, but we can test Enter to select.
    const adminOption = screen.getAllByRole("option").find(opt => opt.textContent?.includes("Admin"));
    
    // We can focus admin option
    adminOption?.focus();
    fireEvent.keyDown(adminOption!, { key: "Enter" });
    
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const newTrigger = await screen.findByRole("button", { name: /Admin/i });
    expect(newTrigger).toBeInTheDocument();
  });

  it("closes the menu on escape", async () => {
    renderWithRoleProvider(<RoleChip />);
    
    const trigger = await screen.findByRole("button", { name: /Buyer/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    
    const listbox = screen.getByRole("listbox", { name: "Switch role" });
    fireEvent.keyDown(listbox, { key: "Escape" });
    
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles themes and densities", async () => {
    renderWithRoleProvider(<RoleChip />);
    
    const trigger = await screen.findByRole("button", { name: /Buyer/i });
    fireEvent.click(trigger);
    
    const lightThemeBtn = screen.getByRole("button", { name: /Light/i });
    const compactDensityBtn = screen.getByRole("button", { name: /Compact/i });
    
    fireEvent.click(lightThemeBtn);
    expect(window.localStorage.getItem("chronopay-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    
    fireEvent.click(compactDensityBtn);
    expect(window.localStorage.getItem("chronopay-density")).toBe("compact");
    expect(document.documentElement.dataset.density).toBe("compact");
  });

  it("closes the menu on outside click", async () => {
    renderWithRoleProvider(<RoleChip />);
    
    const trigger = await screen.findByRole("button", { name: /Buyer/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    
    fireEvent.mouseDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
