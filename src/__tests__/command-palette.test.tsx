import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RankedCommand } from "@/lib/commands";

const { paletteMock } = vi.hoisted(() => ({ paletteMock: vi.fn() }));

vi.mock("@/hooks/use-command-palette", () => ({
  useCommandPalette: () => paletteMock(),
}));

import { CommandPalette } from "@/app/components/command-palette";

function makeCommand(overrides: Partial<RankedCommand> = {}): RankedCommand {
  return {
    id: "wallet-transfer",
    label: "Transfer",
    description: "Send funds to another wallet",
    href: "/transfer",
    icon: "ArrowRightLeft",
    keywords: ["send"],
    routeBoosts: {},
    score: 1,
    appliedBoost: 1,
    ...overrides,
  } as RankedCommand;
}

function baseState(overrides: Record<string, unknown> = {}) {
  return {
    isOpen: false,
    query: "",
    activeIndex: -1,
    isGlobal: false,
    results: [] as RankedCommand[],
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
    setQuery: vi.fn(),
    setActiveIndex: vi.fn(),
    toggleGlobal: vi.fn(),
    executeCommand: vi.fn(),
    ...overrides,
  };
}

// jsdom does not implement scrollIntoView; the palette calls it on the active option.
Element.prototype.scrollIntoView = vi.fn();

beforeEach(() => {
  paletteMock.mockReset();
});

describe("CommandPalette", () => {
  // The named branch in issue #854: `if (!isOpen) return null;`
  it("renders nothing while closed", () => {
    paletteMock.mockReturnValue(baseState({ isOpen: false }));

    const { container } = render(<CommandPalette />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog, combobox and results while open", () => {
    paletteMock.mockReturnValue(
      baseState({
        isOpen: true,
        query: "tra",
        activeIndex: 0,
        results: [makeCommand(), makeCommand({ id: "wallet-history", label: "History", href: "/history", icon: "History" })],
      }),
    );

    render(<CommandPalette />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("tra");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "false");

    expect(screen.getByRole("status")).toHaveTextContent("2 results available");
  });

  it("announces no results for a non-matching query", () => {
    paletteMock.mockReturnValue(
      baseState({
        isOpen: true,
        query: "zzz",
        activeIndex: -1,
        results: [],
      }),
    );

    render(<CommandPalette />);

    expect(screen.getByRole("status")).toHaveTextContent('No results for "zzz"');
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    // Empty results are a boundary, not a teardown: the dialog stays up.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("announces nothing for an empty query with empty results", () => {
    paletteMock.mockReturnValue(
      baseState({
        isOpen: true,
        query: "   ",
        activeIndex: -1,
        results: [],
      }),
    );

    render(<CommandPalette />);

    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
