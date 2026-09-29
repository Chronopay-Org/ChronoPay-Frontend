import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RoleOnboardingDialog } from "./role-onboarding-dialog";
import { ROLE_META } from "./role-nav";

// ─── role context double ─────────────────────────────────────────────────────
//
// The dialog derives everything it renders from `useRole()`. `vi.hoisted` keeps
// the mutable state available to the hoisted factory below.
const roleState = vi.hoisted(() => ({
  role: "buyer" as "buyer" | "supplier" | "admin",
  setRole: vi.fn(),
  hasExplicitRoleSelection: false,
  isHydrating: false,
}));

vi.mock("./RoleContext", () => ({
  useRole: () => roleState,
}));

const card = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^${label}\\b`) });

// Focus the first card synchronously so the focus assertion is deterministic.
beforeEach(() => {
  roleState.role = "buyer";
  roleState.setRole = vi.fn();
  roleState.hasExplicitRoleSelection = false;
  roleState.isHydrating = false;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Visibility gate (the `return null` branch) ──────────────────────────────

describe("RoleOnboardingDialog — visibility gate", () => {
  it("renders nothing while the role context is still hydrating", () => {
    roleState.isHydrating = true;
    const { container } = render(<RoleOnboardingDialog />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders nothing once the user has explicitly selected a role", () => {
    roleState.hasExplicitRoleSelection = true;
    const { container } = render(<RoleOnboardingDialog />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog when hydrating is done and no explicit selection exists", () => {
    render(<RoleOnboardingDialog />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

// ─── Dialog structure ────────────────────────────────────────────────────────

describe("RoleOnboardingDialog — structure", () => {
  it("is an accessible modal labelled and described by its own headings", () => {
    render(<RoleOnboardingDialog />);
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");

    const heading = screen.getByRole("heading", { level: 2 });
    const description = screen.getByText(
      /Your selection tunes navigation and the default dashboard/,
    );
    expect(dialog).toHaveAttribute("aria-labelledby", heading.id);
    expect(dialog).toHaveAttribute("aria-describedby", description.id);
  });

  it("offers one card per role, with Buyer marked recommended", () => {
    render(<RoleOnboardingDialog />);

    for (const role of ["buyer", "supplier", "admin"] as const) {
      expect(
        screen.getByRole("heading", { level: 3, name: ROLE_META[role].label }),
      ).toBeInTheDocument();
    }
    expect(screen.getByText("Recommended")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(4); // 3 cards + continue
  });

  it("focuses the first role card on mount", () => {
    render(<RoleOnboardingDialog />);
    expect(document.activeElement).toBe(card("Buyer"));
  });
});

// ─── Selection ───────────────────────────────────────────────────────────────

describe("RoleOnboardingDialog — selection", () => {
  it("reflects the current role as the initial selection", () => {
    roleState.role = "admin";
    render(<RoleOnboardingDialog />);

    expect(card("Admin")).toHaveAttribute("aria-pressed", "true");
    expect(card("Buyer")).toHaveAttribute("aria-pressed", "false");
  });

  it("updates the selection and announces the change on click", async () => {
    render(<RoleOnboardingDialog />);

    await userEvent.click(card("Supplier"));

    expect(card("Supplier")).toHaveAttribute("aria-pressed", "true");
    expect(card("Buyer")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Supplier selected");
  });

  it("keeps exactly one card selected at a time", async () => {
    render(<RoleOnboardingDialog />);

    await userEvent.click(card("Supplier"));
    await userEvent.click(card("Admin"));

    const pressed = ["Buyer", "Supplier", "Admin"].filter(
      (label) => card(label).getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toEqual(["Admin"]);
  });

  it("commits the selected role through setRole", async () => {
    render(<RoleOnboardingDialog />);

    await userEvent.click(card("Supplier"));
    await userEvent.click(screen.getByRole("button", { name: /^Continue as Supplier$/ }));

    expect(roleState.setRole).toHaveBeenCalledTimes(1);
    expect(roleState.setRole).toHaveBeenCalledWith("supplier");
  });

  it("keeps the continue label in sync with the pending selection", async () => {
    roleState.role = "buyer";
    render(<RoleOnboardingDialog />);

    expect(screen.getByRole("button", { name: /^Continue as Buyer$/ })).toBeInTheDocument();

    await userEvent.click(card("Admin"));

    expect(screen.getByRole("button", { name: /^Continue as Admin$/ })).toBeInTheDocument();
  });
});
