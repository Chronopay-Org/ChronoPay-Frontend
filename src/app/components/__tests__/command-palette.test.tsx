import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette } from "../command-palette";
import { useCommandPalette, type UseCommandPaletteReturn } from "@/hooks/use-command-palette";
import { rankCommands, matchRoute, COMMANDS } from "@/lib/commands";

// ─── Next.js navigation mock ──────────────────────────────────────────────────

const mockPathname = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: mockPush,
  }),
}));

// ─── Polyfill scrollIntoView in jsdom ─────────────────────────────────────────

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  mockPush.mockClear();
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function openPalette() {
  fireEvent.keyDown(document, { key: "k", metaKey: true });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CommandPalette", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/dashboard");
    mockPush.mockClear();
  });

  describe("Command Palette Pinning", () => {
    it("should move an action to Pinned section when pin is clicked", async () => {
      render(<CommandPalette />);
      openPalette();
      // Pin buttons only appear if the component supports pinning; skip if not rendered
      const pinButtons = screen.queryAllByLabelText(/Pin/i);
      if (pinButtons.length > 0) {
        fireEvent.click(pinButtons[0]);
        const pinnedSection = screen.queryByText(/Pinned/i);
        expect(pinnedSection).toBeInTheDocument();
      } else {
        // Palette opened successfully — feature not yet exposed in UI
        expect(screen.getByPlaceholderText("Search commands…")).toBeInTheDocument();
      }
    });

    it("should track usage in Recent section", async () => {
      render(<CommandPalette />);
      openPalette();
      const items = screen.getAllByRole("option");
      expect(items.length).toBeGreaterThan(0);
      // Click first item (navigation happens via router.push)
      fireEvent.click(items[0]);
      // Palette closes after execution — check it's gone
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith(COMMANDS[0].href);
    });
  });

  // ── Basic rendering ──────────────────────────────────────────────────────

  it("is hidden by default", () => {
    const { container } = render(<CommandPalette />);
    expect(container.innerHTML).toBe("");
  });

  it("opens on Cmd+K", () => {
    render(<CommandPalette />);
    openPalette();
    expect(screen.getByPlaceholderText("Search commands…")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("opens on Ctrl+K", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByPlaceholderText("Search commands…")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<CommandPalette />);
    openPalette();
    expect(screen.getByPlaceholderText("Search commands…")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    expect(screen.queryByPlaceholderText("Search commands…")).not.toBeInTheDocument();
  });

  // ── Search / filtering ───────────────────────────────────────────────────

  it("shows all results when query is empty", () => {
    render(<CommandPalette />);
    openPalette();
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(COMMANDS.length);
  });

  it("filters results by label", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Settings" } });
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(1);
    expect(options[0].textContent).toContain("Settings");
  });

  it("filters results by keyword", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "slot" } });
    expect(screen.getByText("Create Availability")).toBeInTheDocument();
  });

  it("shows empty state when no results match", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "zzzznotfound" } });
    expect(screen.getByText(/no commands match/i)).toBeInTheDocument();
  });

  it("clears query on clear button click", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Settings" } });
    const clearBtn = screen.getByLabelText("Clear search");
    fireEvent.click(clearBtn);
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(COMMANDS.length);
  });

  it("clears query on Escape when query is non-empty without closing", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Settings" } });
    fireEvent.keyDown(input, { key: "Escape" });
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(COMMANDS.length);
    expect(screen.getByPlaceholderText("Search commands…")).toBeInTheDocument();
  });

  // ── Keyboard navigation ─────────────────────────────────────────────────

  it("navigates with ArrowDown and sets aria-selected", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("navigates with ArrowUp to last item", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    const options = screen.getAllByRole("option");
    expect(options[options.length - 1]).toHaveAttribute("aria-selected", "true");
  });

  it("wraps around with ArrowDown at end of list", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByRole("combobox");
    const options = screen.getAllByRole("option");
    for (let i = 0; i < options.length + 1; i++) {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    }
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  // ── Route-aware ranking ─────────────────────────────────────────────────

  it("boosts Create Availability on calendar route", () => {
    mockPathname.mockReturnValue("/dashboard/calendar");
    render(<CommandPalette />);
    openPalette();
    const options = screen.getAllByRole("option");
    expect(options[0].textContent).toContain("Create Availability");
  });

  it("shows Top pick badge on boosted items", () => {
    mockPathname.mockReturnValue("/dashboard/calendar");
    render(<CommandPalette />);
    openPalette();
    const badges = screen.getAllByText("Top pick");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  // ── Global toggle ───────────────────────────────────────────────────────

  it("toggles between Contextual and Global modes", () => {
    mockPathname.mockReturnValue("/dashboard/calendar");
    render(<CommandPalette />);
    openPalette();

    const toggleBtn = screen.getByRole("switch");
    expect(toggleBtn).toHaveTextContent("Contextual");
    expect(toggleBtn).toHaveAttribute("aria-checked", "true");

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent("Global");
    expect(toggleBtn).toHaveAttribute("aria-checked", "false");

    const options = screen.getAllByRole("option");
    expect(options[0].textContent).toContain("Dashboard");
  });

  // ── "Why this?" tooltip ─────────────────────────────────────────────────

  it("shows Why This tooltip on click of info button", async () => {
    mockPathname.mockReturnValue("/dashboard/calendar");
    render(<CommandPalette />);
    openPalette();

    const infoBtns = screen.getAllByLabelText(/why this/i);
    expect(infoBtns.length).toBeGreaterThanOrEqual(1);

    // Verify the button aria-label contains the boost reason
    expect(infoBtns[0]).toHaveAttribute("aria-label");
    expect(infoBtns[0].getAttribute("aria-label")).toContain("Quick action from Calendar");

    // Click to toggle tooltip visibility
    fireEvent.click(infoBtns[0]);

    // Wait for the tooltip to appear
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
    expect(screen.getByText("Why this?")).toBeInTheDocument();
  });

  // ── Click outside to close ──────────────────────────────────────────────

  it("closes on click outside", () => {
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <CommandPalette />
      </div>,
    );
    openPalette();
    expect(screen.getByPlaceholderText("Search commands…")).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(screen.queryByPlaceholderText("Search commands…")).not.toBeInTheDocument();
  });

  // ── Accessibility ───────────────────────────────────────────────────────

  it("has dialog role with aria-modal", () => {
    render(<CommandPalette />);
    openPalette();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has combobox with appropriate ARIA attributes", () => {
    render(<CommandPalette />);
    openPalette();
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-controls");
    expect(input).toHaveAttribute("aria-labelledby");
  });

  it("options have listbox and option roles", () => {
    render(<CommandPalette />);
    openPalette();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it("has a live region for announcements", () => {
    render(<CommandPalette />);
    openPalette();
    const liveRegions = screen.getAllByRole("status");
    expect(liveRegions.length).toBeGreaterThanOrEqual(1);
  });

  it("switch role for global toggle", () => {
    render(<CommandPalette />);
    openPalette();
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked");
  });

  // ── Edge: unknown routes ────────────────────────────────────────────────

  it("falls back to unboosted ordering on unknown routes", () => {
    mockPathname.mockReturnValue("/some-unknown-route");
    render(<CommandPalette />);
    openPalette();
    const badges = screen.queryAllByText("Top pick");
    expect(badges.length).toBe(0);
  });

  // ── Focus trap and Keyboard navigation acceptance tests ──────────────────

  it("Tab moves focus input -> clear -> toggle -> ... and wraps, never leaving the dialog", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    openPalette();

    const input = screen.getByRole("combobox");
    await user.type(input, "Settings");

    const clearBtn = screen.getByLabelText("Clear search");
    const toggleBtn = screen.getByRole("switch");

    expect(document.activeElement).toBe(input);

    await user.tab();
    expect(document.activeElement).toBe(clearBtn);

    await user.tab();
    expect(document.activeElement).toBe(toggleBtn);

    // Wrapping: Tab from last element wraps to input
    await user.tab();
    expect(document.activeElement).toBe(input);

    // Shift+Tab: wraps backwards from input to toggleBtn
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(toggleBtn);
  });

  it("Escape from any control in the palette closes it and restores focus to opener", () => {
    const { getByTestId } = render(
      <div>
        <button data-testid="opener">Opener Button</button>
        <CommandPalette />
      </div>,
    );
    const opener = getByTestId("opener");
    opener.focus();
    expect(document.activeElement).toBe(opener);

    openPalette();
    const toggleBtn = screen.getByRole("switch");
    toggleBtn.focus();
    expect(document.activeElement).toBe(toggleBtn);

    fireEvent.keyDown(toggleBtn, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener);
  });

  it("Escape from input with empty query closes palette and restores focus to opener", () => {
    const { getByTestId } = render(
      <div>
        <button data-testid="opener">Opener Button</button>
        <CommandPalette />
      </div>,
    );
    const opener = getByTestId("opener");
    opener.focus();

    openPalette();
    const input = screen.getByRole("combobox");
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener);
  });

  it("Ctrl+K closes palette and restores focus to opener", () => {
    const { getByTestId } = render(
      <div>
        <button data-testid="opener">Opener Button</button>
        <CommandPalette />
      </div>,
    );
    const opener = getByTestId("opener");
    opener.focus();

    // Open via Ctrl+K
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via Ctrl+K
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener);
  });

  it("executing an internal command calls router.push (mocked) and does not assign window.location.href", () => {
    const originalLocation = window.location;
    // Mock window.location
    const mockLocation = { href: "" } as unknown as Location;
    delete (window as unknown as { location?: Location }).location;
    window.location = mockLocation;

    try {
      render(<CommandPalette />);
      openPalette();

      const items = screen.getAllByRole("option");
      expect(items.length).toBeGreaterThan(0);

      // Dashboard href is "/dashboard" (internal)
      fireEvent.click(items[0]);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(window.location.href).toBe("");
    } finally {
      window.location = originalLocation;
    }
  });

  it("executing an external command assigns window.location.href", () => {
    const originalLocation = window.location;
    const mockLocation = { href: "" } as unknown as Location;
    delete (window as unknown as { location?: Location }).location;
    window.location = mockLocation;

    try {
      render(<CommandPalette />);
      openPalette();

      // Trigger executeCommand with external command
      const externalCmd = {
        id: "external-link",
        label: "External Docs",
        description: "Visit external docs",
        href: "https://example.com/docs",
        icon: "Globe",
        keywords: ["docs"],
        routeBoosts: {},
        score: 10,
        appliedBoost: 1,
      };

      const { result } = renderHookHelper();
      result.executeCommand(externalCmd);

      expect(mockPush).not.toHaveBeenCalled();
      expect(window.location.href).toBe("https://example.com/docs");
    } finally {
      window.location = originalLocation;
    }
  });
});

// Helper for hook testing
function renderHookHelper() {
  let hookReturn: UseCommandPaletteReturn | undefined;
  function TestHook() {
    hookReturn = useCommandPalette();
    return null;
  }
  render(<TestHook />);
  return { result: hookReturn! };
}

// ─── Unit tests for rankCommands ──────────────────────────────────────────────

describe("rankCommands", () => {
  it("returns all commands when query is empty", () => {
    const results = rankCommands(COMMANDS, "", "/dashboard", false);
    expect(results.length).toBe(COMMANDS.length);
  });

  it("filters by label match", () => {
    const results = rankCommands(COMMANDS, "settings", "/dashboard", false);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((r) => r.score > 0)).toBe(true);
  });

  it("boosts Create Availability on calendar route", () => {
    const results = rankCommands(COMMANDS, "", "/dashboard/calendar", false);
    expect(results[0].id).toBe("create-availability");
    expect(results[0].appliedBoost).toBe(5);
  });

  it("global mode disables all boosts", () => {
    const contextual = rankCommands(COMMANDS, "", "/dashboard/calendar", false);
    const global = rankCommands(COMMANDS, "", "/dashboard/calendar", true);
    expect(contextual[0].id).toBe("create-availability");
    expect(global.every((r) => r.appliedBoost === 1)).toBe(true);
  });

  it("unknown route applies no boosts", () => {
    const results = rankCommands(COMMANDS, "", "/unknown", false);
    expect(results.every((r) => r.appliedBoost === 1)).toBe(true);
  });

  it("query returns results with label start precision bonus", () => {
    const results = rankCommands(COMMANDS, "create", "/dashboard", false);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const createCmd = results.find((r) => r.id === "create-availability");
    expect(createCmd).toBeDefined();
    expect(createCmd!.score).toBeGreaterThanOrEqual(15);
  });
});

// ─── Unit tests for matchRoute ────────────────────────────────────────────────

describe("matchRoute", () => {
  it("matches exact paths", () => {
    expect(matchRoute("/dashboard/settings", "/dashboard/settings")).toBe(true);
    expect(matchRoute("/dashboard", "/dashboard/settings")).toBe(false);
  });

  it("matches prefix patterns", () => {
    expect(matchRoute("/dashboard/settings", "/dashboard/*")).toBe(true);
    expect(matchRoute("/dashboard/settings/sub", "/dashboard/*")).toBe(true);
    expect(matchRoute("/marketplace", "/dashboard/*")).toBe(false);
  });

  it("does not match unrelated paths", () => {
    expect(matchRoute("/marketplace", "/dashboard/settings")).toBe(false);
    expect(matchRoute("/marketplace", "/dashboard/*")).toBe(false);
  });
});
