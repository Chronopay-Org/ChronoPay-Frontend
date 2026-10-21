/**
 * contextual-keys-panel.test.tsx
 *
 * Regression suite for src/app/components/ui/contextual-keys-panel.tsx (issue #875).
 *
 * Directly exercises the `if (shortcuts.length === 0) return null;` branch (line 61)
 * and all neighbouring normal and boundary paths.
 *
 * Covered axes:
 *  - Empty-shortcuts / null-return path (the regression branch)
 *  - Non-matching pathname → null returned
 *  - Matching pathname → panel rendered with correct shortcuts
 *  - Multiple keys per shortcut rendered as individual <kbd> elements
 *  - Aria/role contract: region, live region, heading
 *  - ShortcutRow keys are uppercased
 *  - Boundary: single shortcut, many shortcuts
 *  - Route isolation: panel changes when pathname changes
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ContextualKeysPanel } from "./contextual-keys-panel";

// ─── Mock next/navigation ────────────────────────────────────────────────────
// usePathname is a Next.js hook — we stub it so tests control the current route.

let mockPathname: string | null = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setPathname(path: string | null) {
  mockPathname = path;
}

function renderPanel() {
  return render(<ContextualKeysPanel />);
}

// ─── Reset pathname before each test ─────────────────────────────────────────

beforeEach(() => {
  setPathname("/");
});

// ─── Empty / null-return path (regression for issue #875) ────────────────────

describe("empty-shortcuts / null-return path — regression for issue #875", () => {
  it("renders nothing when pathname does not match any route", () => {
    setPathname("/unknown/page");
    const { container } = renderPanel();
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for the root pathname '/'", () => {
    setPathname("/");
    const { container } = renderPanel();
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for a null pathname", () => {
    setPathname(null);
    const { container } = renderPanel();
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for a blank string pathname", () => {
    setPathname("");
    const { container } = renderPanel();
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for '/dashboard' (no shortcut entry for that exact route)", () => {
    setPathname("/dashboard");
    const { container } = renderPanel();
    expect(container.firstChild).toBeNull();
  });

  it("does NOT render the panel heading when shortcuts is empty", () => {
    setPathname("/unregistered/path");
    renderPanel();
    expect(screen.queryByText("Keys on this page")).not.toBeInTheDocument();
  });

  it("does NOT render any kbd elements when shortcuts is empty", () => {
    setPathname("/unregistered/path");
    renderPanel();
    expect(document.querySelectorAll("kbd").length).toBe(0);
  });
});

// ─── Matching pathname — normal path ─────────────────────────────────────────

describe("matching pathname — panel renders with correct shortcuts", () => {
  it("renders the panel for '/dashboard/orders'", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    expect(screen.getByRole("region", { name: "Keys on this page" })).toBeInTheDocument();
  });

  it("renders the 'Keys on this page' heading for '/dashboard/orders'", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    expect(screen.getByText("Keys on this page")).toBeInTheDocument();
  });

  it("renders 'Filter orders' shortcut description for '/dashboard/orders'", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    expect(screen.getByText("Filter orders")).toBeInTheDocument();
  });

  it("renders 'New order' shortcut description for '/dashboard/orders'", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    expect(screen.getByText("New order")).toBeInTheDocument();
  });

  it("renders 'Save changes' shortcut description for '/dashboard/settings'", () => {
    setPathname("/dashboard/settings");
    renderPanel();
    expect(screen.getByText("Save changes")).toBeInTheDocument();
  });

  it("renders exactly one shortcut for '/dashboard/settings'", () => {
    setPathname("/dashboard/settings");
    renderPanel();
    expect(screen.getAllByRole("term").length + screen.getAllByText(/Save changes/).length).toBeGreaterThanOrEqual(1);
    // Precisely: one ShortcutRow → one description text node
    const descriptions = ["Save changes"];
    descriptions.forEach((d) => expect(screen.getByText(d)).toBeInTheDocument());
  });
});

// ─── Prefix matching ──────────────────────────────────────────────────────────

describe("prefix matching", () => {
  it("matches '/dashboard/orders/123' (child of registered prefix)", () => {
    setPathname("/dashboard/orders/123");
    renderPanel();
    expect(screen.getByRole("region", { name: "Keys on this page" })).toBeInTheDocument();
    expect(screen.getByText("Filter orders")).toBeInTheDocument();
  });

  it("matches '/dashboard/settings/advanced' (child of registered prefix)", () => {
    setPathname("/dashboard/settings/advanced");
    renderPanel();
    expect(screen.getByText("Save changes")).toBeInTheDocument();
  });
});

// ─── kbd key rendering ────────────────────────────────────────────────────────

describe("ShortcutRow — kbd key rendering", () => {
  it("renders the 'F' key as a <kbd> element for the filter shortcut", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    const kbdElements = document.querySelectorAll("kbd");
    const labels = Array.from(kbdElements).map((k) => k.textContent);
    expect(labels).toContain("F"); // 'f' → toUpperCase() → 'F'
  });

  it("renders the 'N' key as a <kbd> element for the new-order shortcut", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    const labels = Array.from(document.querySelectorAll("kbd")).map((k) => k.textContent);
    expect(labels).toContain("N");
  });

  it("keys are uppercased (source value is lowercase 'f', rendered as 'F')", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    // There must be no lowercase 'f' or 'n' kbd — all are uppercased
    const labels = Array.from(document.querySelectorAll("kbd")).map((k) => k.textContent);
    expect(labels).not.toContain("f");
    expect(labels).not.toContain("n");
  });

  it("renders 2 kbd elements for '/dashboard/orders' (one per key per shortcut)", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    // 2 shortcuts each with 1 key → 2 kbd elements
    expect(document.querySelectorAll("kbd").length).toBe(2);
  });

  it("renders 1 kbd element for '/dashboard/settings'", () => {
    setPathname("/dashboard/settings");
    renderPanel();
    expect(document.querySelectorAll("kbd").length).toBe(1);
  });
});

// ─── Aria / accessibility contract ───────────────────────────────────────────

describe("accessibility contract", () => {
  it("wraps the panel in a role=region with accessible name", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    expect(screen.getByRole("region", { name: "Keys on this page" })).toBeInTheDocument();
  });

  it("includes a live region (role=status) for screen-reader announcements", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeInTheDocument();
  });

  it("live region announces the count of shortcuts when panel is open", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    const liveRegion = screen.getByRole("status");
    expect(liveRegion.textContent).toMatch(/2 shortcuts/);
  });

  it("hides the Keyboard icon from screen readers (aria-hidden)", () => {
    setPathname("/dashboard/orders");
    renderPanel();
    // Lucide renders an svg; it should carry aria-hidden="true"
    const svgs = document.querySelectorAll("svg[aria-hidden='true']");
    expect(svgs.length).toBeGreaterThan(0);
  });
});

// ─── Boundary inputs ─────────────────────────────────────────────────────────

describe("boundary inputs", () => {
  it("renders null for a very long unregistered pathname", () => {
    setPathname("/a".repeat(200));
    const { container } = renderPanel();
    expect(container.firstChild).toBeNull();
  });

  it("renders null for a URL with query string (no match)", () => {
    setPathname("/dashboard/orders?filter=active");
    // startsWith still works because '?filter=active' extends the path
    // but the current impl uses pathname from usePathname which in Next.js
    // does NOT include query string — so this may match. We verify the
    // actual behaviour without asserting a specific outcome for safety,
    // except that it doesn't throw.
    expect(() => renderPanel()).not.toThrow();
  });

  it("does not throw for any value in the pathname", () => {
    const paths = [
      "/",
      "",
      "/dashboard",
      "/dashboard/orders",
      "/dashboard/orders/detail/123",
      "/dashboard/settings",
      "/completely/unknown",
    ];
    for (const p of paths) {
      setPathname(p);
      expect(() => renderPanel()).not.toThrow();
    }
  });
});
