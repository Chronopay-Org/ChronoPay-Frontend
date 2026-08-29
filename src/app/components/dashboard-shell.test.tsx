import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardShell } from "./dashboard-shell";
import { RoleProvider } from "@/app/components/navigation/RoleContext";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUsePathname = vi.fn(() => "/dashboard");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    "aria-label": ariaLabel,
    "aria-current": ariaCurrent,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    "aria-label"?: string;
    "aria-current"?: string;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent} className={className}>
      {children}
    </a>
  ),
}));

// ─── Helper ──────────────────────────────────────────────────────────────────

function renderShell(initialRole: "buyer" | "supplier" | "admin" = "buyer") {
  window.localStorage.setItem("chronopay:role:selected", "true");
  window.localStorage.setItem("chronopay:role", initialRole);
  return render(
    <RoleProvider initialRole={initialRole}>
      <DashboardShell>
        <main data-testid="content">Page content</main>
      </DashboardShell>
    </RoleProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DashboardShell", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockUsePathname.mockReturnValue("/dashboard");
  });

  // ── Basic Rendering ──────────────────────────────────────────────────────

  it("renders the command bar with ChronoPay branding", () => {
    renderShell();
    expect(screen.getByLabelText("ChronoPay home")).toBeInTheDocument();
    expect(screen.getByText("ChronoPay")).toBeInTheDocument();
  });

  it("renders the main content area", () => {
    renderShell();
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders a skip-to-content target with id main-content", () => {
    renderShell();
    expect(document.getElementById("main-content")).toBeInTheDocument();
  });

  // ── Left Rail ─────────────────────────────────────────────────────────────

  it("renders the left rail with navigation landmark", () => {
    renderShell();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toBeInTheDocument();
  });

  it("shows role-specific nav items in the left rail", () => {
    renderShell("buyer");
    expect(screen.getAllByText("Marketplace").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("My Bookings").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("History").length).toBeGreaterThanOrEqual(1);
  });

  it("shows admin nav items when role is admin", () => {
    renderShell("admin");
    expect(screen.getAllByText("Users").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Analytics").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Settings").length).toBeGreaterThanOrEqual(1);
  });

  it("shows supplier nav items when role is supplier", () => {
    renderShell("supplier");
    expect(screen.getAllByText("Availability").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Earnings").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("History").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the Home nav item for all roles", () => {
    const roles = ["buyer", "supplier", "admin"] as const;
    for (const role of roles) {
      renderShell(role);
      const homeLinks = screen.getAllByText("Home");
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    }
  });

  // ── Active Nav Item ───────────────────────────────────────────────────────

  it("marks the active nav item with aria-current=page", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    renderShell("buyer");
    const homeLinks = screen.getAllByRole("link", { name: /Dashboard home/i });
    expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    homeLinks.forEach((link) => {
      expect(link).toHaveAttribute("aria-current", "page");
    });
  });

  it("does not mark non-active items with aria-current", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    renderShell("buyer");
    const marketplaceLinks = screen.getAllByRole("link", { name: /Browse the time marketplace/i });
    expect(marketplaceLinks.length).toBeGreaterThanOrEqual(1);
    marketplaceLinks.forEach((link) => {
      expect(link).not.toHaveAttribute("aria-current");
    });
  });

  // ── Role Indicator ────────────────────────────────────────────────────────

  it("shows the role indicator with icon and description", () => {
    renderShell("admin");
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText(/full platform administration/)).toBeInTheDocument();
  });

  it("shows the buyer role indicator", () => {
    renderShell("buyer");
    expect(screen.getByText("Buyer")).toBeInTheDocument();
  });

  it("shows the supplier role indicator", () => {
    renderShell("supplier");
    expect(screen.getByText("Supplier")).toBeInTheDocument();
  });

  // ── System Status ─────────────────────────────────────────────────────────

  it("shows the system status widget", () => {
    renderShell();
    expect(screen.getByText("All Systems Nominal")).toBeInTheDocument();
  });

  it("has a live region for system status announcements", () => {
    renderShell();
    const liveRegions = screen.getAllByRole("status");
    expect(liveRegions.length).toBeGreaterThanOrEqual(1);
    const systemStatus = liveRegions.find(
      (el) => el.textContent === "System online" || el.textContent === "System offline"
    );
    expect(systemStatus).toBeDefined();
  });

  // ── Mobile rail toggle ───────────────────────────────────────────────────

  it("shows a hamburger menu button on mobile", () => {
    renderShell();
    const toggle = screen.getByLabelText("Open navigation menu");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the mobile rail when hamburger is clicked", () => {
    renderShell();
    const toggle = screen.getByLabelText("Open navigation menu");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the mobile rail when close button is clicked", () => {
    renderShell();
    const toggle = screen.getByLabelText("Open navigation menu");
    fireEvent.click(toggle);
    const closeButtons = screen.getAllByLabelText("Close navigation menu");
    // The first close button is the toggle itself (X icon to close), click it
    fireEvent.click(closeButtons[0]);
    const toggleAgain = screen.getByLabelText("Open navigation menu");
    expect(toggleAgain).toHaveAttribute("aria-expanded", "false");
  });

  // ── Keyboard Navigation ───────────────────────────────────────────────────

  it("closes the mobile rail on Escape key", () => {
    renderShell();
    const toggle = screen.getByLabelText("Open navigation menu");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    const toggleAgain = screen.getByLabelText("Open navigation menu");
    expect(toggleAgain).toHaveAttribute("aria-expanded", "false");
  });

  it("returns focus to the toggle button after Escape", () => {
    renderShell();
    const toggle = screen.getByLabelText("Open navigation menu");
    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(toggle);
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it("the command bar is a banner landmark", () => {
    renderShell();
    const banner = document.querySelector("header");
    expect(banner).toBeInTheDocument();
  });

  it("the left rail has a navigation role", () => {
    renderShell();
    expect(screen.getByLabelText("Module navigation")).toHaveAttribute("role", "navigation");
  });

  it("the left rail contains a navigation landmark for role modules", () => {
    renderShell();
    expect(screen.getByLabelText("Role modules")).toBeInTheDocument();
  });

  it("nav links have aria-current=page on the active route", () => {
    mockUsePathname.mockReturnValue("/dashboard/bookings");
    renderShell("buyer");
    const bookingsLinks = screen.getAllByRole("link", { name: /View your bookings/i });
    expect(bookingsLinks.length).toBeGreaterThanOrEqual(1);
    bookingsLinks.forEach((link) => {
      expect(link).toHaveAttribute("aria-current", "page");
    });
  });

  it("the hamburger button has aria-expanded reflecting state", () => {
    renderShell();
    const toggle = screen.getByLabelText("Open navigation menu");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("has an aria-live region for announcements", () => {
    renderShell();
    const liveRegions = screen.getAllByRole("status");
    expect(liveRegions.length).toBeGreaterThanOrEqual(1);
  });

  // ── Global Actions ────────────────────────────────────────────────────────

  it("renders the system status widget", () => {
    renderShell();
    expect(screen.getByText("All Systems Nominal")).toBeInTheDocument();
    // Also verifies the offline queue indicator exists with connection state
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("renders without error when pathname is empty", () => {
    mockUsePathname.mockReturnValue("");
    expect(() => renderShell()).not.toThrow();
  });

  it("renders with minimal children", () => {
    render(
      <RoleProvider initialRole="admin">
        <DashboardShell>
          <span>Minimal</span>
        </DashboardShell>
      </RoleProvider>,
    );
    expect(screen.getByText("Minimal")).toBeInTheDocument();
  });

  it("handles role-based nav items correctly when pathname matches admin route", () => {
    mockUsePathname.mockReturnValue("/admin/users");
    renderShell("admin");
    const usersLinks = screen.getAllByRole("link", { name: /Manage users/i });
    expect(usersLinks.length).toBeGreaterThanOrEqual(1);
    usersLinks.forEach((link) => {
      expect(link).toHaveAttribute("aria-current", "page");
    });
  });

  // ── RTL Support ─────────────────────────────────────────────────────────────

  it("renders correctly in LTR mode (default)", () => {
    document.documentElement.dir = "ltr";
    renderShell();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toBeInTheDocument();
    expect(rail).toHaveClass("border-e");
  });

  it("renders correctly in RTL mode", () => {
    document.documentElement.dir = "rtl";
    renderShell();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toBeInTheDocument();
    expect(rail).toHaveClass("border-e");
  });

  it("uses logical border property (border-e) instead of physical border-r", () => {
    renderShell();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toHaveClass("border-e");
    expect(rail).not.toHaveClass("border-r");
  });

  it("mobile rail transforms correctly in LTR mode when closed", () => {
    document.documentElement.dir = "ltr";
    renderShell();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toHaveClass("-translate-x-full");
    expect(rail).not.toHaveClass("translate-x-0");
  });

  it("mobile rail transforms correctly in LTR mode when open", () => {
    document.documentElement.dir = "ltr";
    renderShell();
    const toggle = screen.getByLabelText("Open navigation menu");
    fireEvent.click(toggle);
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toHaveClass("translate-x-0");
    expect(rail).not.toHaveClass("-translate-x-full");
  });

  it("mobile rail transforms correctly in RTL mode when closed", () => {
    document.documentElement.dir = "rtl";
    renderShell();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toHaveClass("rtl:translate-x-full");
  });

  it("mobile rail transforms correctly in RTL mode when open", () => {
    document.documentElement.dir = "rtl";
    renderShell();
    const toggle = screen.getByLabelText("Open navigation menu");
    fireEvent.click(toggle);
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toHaveClass("translate-x-0");
  });

  it("maintains RTL support when direction changes dynamically", () => {
    renderShell();
    document.documentElement.dir = "rtl";
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toBeInTheDocument();
    expect(rail).toHaveClass("border-e");
  });

  it("handles invalid dir attribute gracefully", () => {
    document.documentElement.dir = "invalid";
    expect(() => renderShell()).not.toThrow();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toBeInTheDocument();
  });

  it("handles empty dir attribute gracefully", () => {
    document.documentElement.dir = "";
    expect(() => renderShell()).not.toThrow();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toBeInTheDocument();
  });

  it("preserves accessibility in RTL mode", () => {
    document.documentElement.dir = "rtl";
    renderShell();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toHaveAttribute("role", "navigation");
    expect(rail).toHaveAttribute("aria-label", "Module navigation");
  });

  it("desktop rail position respects logical properties in RTL", () => {
    document.documentElement.dir = "rtl";
    renderShell();
    const rail = screen.getByLabelText("Module navigation");
    expect(rail).toHaveClass("inset-inline-start-0");
  });
});
