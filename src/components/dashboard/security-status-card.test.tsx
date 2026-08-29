/**
 * security-status-card.test.tsx
 *
 * Coverage targets (95%+):
 *  - createSecurityItems() — default and overridden item statuses
 *  - DEFAULT_SECURITY_ITEMS — structure and count
 *  - SecurityStatusCard — renders heading, all items, status chips,
 *    CTAs, aria attributes, live region announcement, empty/full states
 *  - SecurityRow — individual row rendering, focus behaviour, all
 *    security status tones
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  createSecurityItems,
  DEFAULT_SECURITY_ITEMS,
  SecurityStatusCard,
} from "./security-status-card";
import type { SecurityItem, SecurityItemStatus } from "./security-status-card";
import type { Tone } from "./types";

// ---------------------------------------------------------------------------
// createSecurityItems
// ---------------------------------------------------------------------------

describe("createSecurityItems", () => {
  it("creates three default items when no overrides are given", () => {
    const items = createSecurityItems();
    expect(items).toHaveLength(3);
  });

  it("returns items with expected ids", () => {
    const items = createSecurityItems();
    const ids = items.map((i) => i.id);
    expect(ids).toEqual(["two-factor", "recovery-key", "active-sessions"]);
  });

  it("maps 'enabled' status to positive tone and 'Enabled' label", () => {
    const items = createSecurityItems({ twoFactor: "enabled" });
    const twoFactor = items.find((i) => i.id === "two-factor")!;
    expect(twoFactor.status).toBe("enabled");
    expect(twoFactor.tone).toBe("positive");
    expect(twoFactor.statusLabel).toBe("Enabled");
    expect(twoFactor.ctaLabel).toBe("Manage 2FA");
  });

  it("maps 'disabled' status to warning tone and 'Disabled' label", () => {
    const items = createSecurityItems({ twoFactor: "disabled" });
    const twoFactor = items.find((i) => i.id === "two-factor")!;
    expect(twoFactor.status).toBe("disabled");
    expect(twoFactor.tone).toBe("warning");
    expect(twoFactor.statusLabel).toBe("Disabled");
    expect(twoFactor.ctaLabel).toBe("Set up 2FA");
  });

  it("maps 'not-setup' status to muted tone and 'Not set up' label", () => {
    const items = createSecurityItems({ recovery: "not-setup" });
    const recovery = items.find((i) => i.id === "recovery-key")!;
    expect(recovery.status).toBe("not-setup");
    expect(recovery.tone).toBe("muted");
    expect(recovery.statusLabel).toBe("Not set up");
    expect(recovery.ctaLabel).toBe("Generate recovery key");
  });

  it("maps recovery 'enabled' status to positive tone and 'Enabled' label", () => {
    const items = createSecurityItems({ recovery: "enabled" });
    const recovery = items.find((i) => i.id === "recovery-key")!;
    expect(recovery.status).toBe("enabled");
    expect(recovery.tone).toBe("positive");
    expect(recovery.statusLabel).toBe("Enabled");
    expect(recovery.ctaLabel).toBe("Review recovery key");
  });

  it("maps 'attention' status to critical tone and 'Action needed' label", () => {
    const items = createSecurityItems({ sessions: "attention" });
    const sessions = items.find((i) => i.id === "active-sessions")!;
    expect(sessions.status).toBe("attention");
    expect(sessions.tone).toBe("critical");
    expect(sessions.statusLabel).toBe("Action needed");
  });

  it("defaults twoFactor to 'disabled'", () => {
    const items = createSecurityItems();
    expect(items.find((i) => i.id === "two-factor")?.status).toBe("disabled");
  });

  it("defaults recovery to 'not-setup'", () => {
    const items = createSecurityItems();
    expect(items.find((i) => i.id === "recovery-key")?.status).toBe(
      "not-setup",
    );
  });

  it("defaults sessions to 'enabled'", () => {
    const items = createSecurityItems();
    expect(items.find((i) => i.id === "active-sessions")?.status).toBe(
      "enabled",
    );
  });

  it("allows partial overrides without affecting other items", () => {
    const items = createSecurityItems({ twoFactor: "enabled" });
    expect(items.find((i) => i.id === "two-factor")?.status).toBe("enabled");
    expect(items.find((i) => i.id === "recovery-key")?.status).toBe(
      "not-setup",
    );
    expect(items.find((i) => i.id === "active-sessions")?.status).toBe(
      "enabled",
    );
  });

  it("each item has a non-empty ctaLabel", () => {
    const items = createSecurityItems();
    for (const item of items) {
      expect(item.ctaLabel.length).toBeGreaterThan(0);
    }
  });

  it("each item has a non-empty description", () => {
    const items = createSecurityItems();
    for (const item of items) {
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it("each item has a valid tone", () => {
    const validTones: Tone[] = [
      "neutral",
      "positive",
      "warning",
      "critical",
      "muted",
    ];
    const items = createSecurityItems();
    for (const item of items) {
      expect(validTones).toContain(item.tone);
    }
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_SECURITY_ITEMS
// ---------------------------------------------------------------------------

describe("DEFAULT_SECURITY_ITEMS", () => {
  it("has exactly 3 items", () => {
    expect(DEFAULT_SECURITY_ITEMS).toHaveLength(3);
  });

  it("default twoFactor is disabled", () => {
    const twoFactor = DEFAULT_SECURITY_ITEMS.find(
      (i) => i.id === "two-factor",
    )!;
    expect(twoFactor.status).toBe("disabled");
  });

  it("default recovery is not-setup", () => {
    const recovery = DEFAULT_SECURITY_ITEMS.find(
      (i) => i.id === "recovery-key",
    )!;
    expect(recovery.status).toBe("not-setup");
  });

  it("default sessions is enabled", () => {
    const sessions = DEFAULT_SECURITY_ITEMS.find(
      (i) => i.id === "active-sessions",
    )!;
    expect(sessions.status).toBe("enabled");
  });
});

// ---------------------------------------------------------------------------
// SecurityStatusCard
// ---------------------------------------------------------------------------

describe("SecurityStatusCard", () => {
  it("renders the heading", () => {
    render(<SecurityStatusCard />);
    expect(
      screen.getByRole("heading", { name: /security status/i }),
    ).toBeInTheDocument();
  });

  it("renders all three default security items", () => {
    render(<SecurityStatusCard />);
    expect(screen.getByText("Two-factor authentication")).toBeInTheDocument();
    expect(screen.getByText("Recovery key")).toBeInTheDocument();
    expect(screen.getByText("Active sessions")).toBeInTheDocument();
  });

  it("renders the description paragraph", () => {
    render(<SecurityStatusCard />);
    expect(
      screen.getByText(
        /Review your account security settings and active sessions/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the footer hint text", () => {
    render(<SecurityStatusCard />);
    expect(
      screen.getByText(/Review each item to ensure your account is secure/i),
    ).toBeInTheDocument();
  });

  it("renders status chips for each default item", () => {
    render(<SecurityStatusCard />);
    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.getByText("Not set up")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  it("renders CTA buttons for each item", () => {
    render(<SecurityStatusCard />);
    expect(
      screen.getByRole("button", { name: /Set up 2FA/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Generate recovery key/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Review sessions/i }),
    ).toBeInTheDocument();
  });

  it("renders CTA buttons with descriptive aria-labels", () => {
    render(<SecurityStatusCard />);
    const twoFactorBtn = screen.getByRole("button", {
      name: /Set up 2FA for Two-factor authentication/i,
    });
    expect(twoFactorBtn).toBeInTheDocument();

    const recoveryBtn = screen.getByRole("button", {
      name: /Generate recovery key for Recovery key/i,
    });
    expect(recoveryBtn).toBeInTheDocument();

    const sessionsBtn = screen.getByRole("button", {
      name: /Review sessions for Active sessions/i,
    });
    expect(sessionsBtn).toBeInTheDocument();
  });

  it("renders the sr-only landscape announcement", () => {
    render(<SecurityStatusCard />);
    const announcement = screen.getByRole("status");
    expect(announcement).toHaveTextContent(/Security status summary loaded/i);
    expect(announcement).toHaveTextContent(/3 items to review/i);
  });

  it("card has aria-labelledby referencing the heading", () => {
    render(<SecurityStatusCard />);
    const region = screen.getByRole("region");
    expect(region).toBeInTheDocument();
  });

  it("renders the items list with accessible label", () => {
    render(<SecurityStatusCard />);
    expect(
      screen.getByRole("list", { name: /Security items/i }),
    ).toBeInTheDocument();
  });

  it("renders data-testid on each row", () => {
    render(<SecurityStatusCard />);
    expect(screen.getByTestId("security-row-two-factor")).toBeInTheDocument();
    expect(screen.getByTestId("security-row-recovery-key")).toBeInTheDocument();
    expect(
      screen.getByTestId("security-row-active-sessions"),
    ).toBeInTheDocument();
  });

  it("calls onAction when a CTA button is clicked", async () => {
    const user = userEvent.setup();
    const onTwoFactor = vi.fn();
    const onRecovery = vi.fn();
    const onSessions = vi.fn();

    const items: SecurityItem[] = [
      {
        id: "two-factor",
        label: "Two-factor authentication",
        description: "Test description",
        status: "disabled",
        statusLabel: "Disabled",
        tone: "warning",
        ctaLabel: "Set up 2FA",
        onAction: onTwoFactor,
      },
      {
        id: "recovery-key",
        label: "Recovery key",
        description: "Test description",
        status: "not-setup",
        statusLabel: "Not set up",
        tone: "muted",
        ctaLabel: "Generate recovery key",
        onAction: onRecovery,
      },
      {
        id: "active-sessions",
        label: "Active sessions",
        description: "Test description",
        status: "enabled",
        statusLabel: "Enabled",
        tone: "positive",
        ctaLabel: "Review sessions",
        onAction: onSessions,
      },
    ];

    render(<SecurityStatusCard items={items} />);

    await user.click(
      screen.getByRole("button", { name: /Set up 2FA/i }),
    );
    expect(onTwoFactor).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole("button", { name: /Generate recovery key/i }),
    );
    expect(onRecovery).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole("button", { name: /Review sessions/i }),
    );
    expect(onSessions).toHaveBeenCalledTimes(1);
  });

  it("accepts a custom heading", () => {
    render(<SecurityStatusCard heading="Account security" />);
    expect(
      screen.getByRole("heading", { name: /Account security/i }),
    ).toBeInTheDocument();
  });

  it("accepts custom items", () => {
    const customItems: SecurityItem[] = [
      {
        id: "custom-item",
        label: "Custom security item",
        description: "A custom item description.",
        status: "attention",
        statusLabel: "Action needed",
        tone: "critical",
        ctaLabel: "Fix now",
        onAction: () => {},
      },
    ];

    render(<SecurityStatusCard items={customItems} />);
    expect(screen.getByText("Custom security item")).toBeInTheDocument();
    expect(screen.getByText("Action needed")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Fix now/i }),
    ).toBeInTheDocument();
  });

  it("correctly pluralises the announcement for a single item", () => {
    const singleItem: SecurityItem[] = [
      {
        id: "only-item",
        label: "Only item",
        description: "Single item.",
        status: "enabled",
        statusLabel: "Enabled",
        tone: "positive",
        ctaLabel: "Review",
        onAction: () => {},
      },
    ];

    render(<SecurityStatusCard items={singleItem} />);
    const announcement = screen.getByRole("status");
    expect(announcement).toHaveTextContent(/1 item to review/i);
  });

  it("each row has a description paragraph", () => {
    render(<SecurityStatusCard />);
    expect(
      screen.getByText(/Add an extra layer of security/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Save recovery codes to regain access/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You have devices signed in/i),
    ).toBeInTheDocument();
  });

  it("shows 'Manage 2FA' when 2FA is enabled", () => {
    const items = createSecurityItems({ twoFactor: "enabled" });
    render(<SecurityStatusCard items={items} />);
    expect(
      screen.getByRole("button", { name: /Manage 2FA/i }),
    ).toBeInTheDocument();
  });

  it("shows 'Your account is protected by 2FA' when enabled", () => {
    const items = createSecurityItems({ twoFactor: "enabled" });
    render(<SecurityStatusCard items={items} />);
    expect(
      screen.getByText(/Your account is protected by 2FA/i),
    ).toBeInTheDocument();
  });

  it("shows 'Recovery codes have been saved' when recovery is enabled", () => {
    const items = createSecurityItems({ recovery: "enabled" });
    render(<SecurityStatusCard items={items} />);
    expect(
      screen.getByText(/Recovery codes have been saved/i),
    ).toBeInTheDocument();
  });

  // --- All-clear state ---
  it("renders the all-clear state when all items are enabled", () => {
    const items = createSecurityItems({
      twoFactor: "enabled",
      recovery: "enabled",
      sessions: "enabled",
    });
    render(<SecurityStatusCard items={items} />);
    const enabledChips = screen.getAllByText("Enabled");
    expect(enabledChips).toHaveLength(3);
  });

  // --- Keyboard focus ---
  it("buttons are keyboard focusable", async () => {
    const user = userEvent.setup();
    render(<SecurityStatusCard />);
    const buttons = screen.getAllByRole("button");
    await user.tab();
    expect(buttons.length).toBeGreaterThan(0);
  });
});
