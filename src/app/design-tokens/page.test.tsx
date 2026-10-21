import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DesignTokensPage from "./page";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/app/components/ui/copy-button", () => ({
  CopyButton: ({ text, label }: { text: string; label: string }) => (
    <button data-testid="copy-button" aria-label={label} data-text={text}>
      Copy
    </button>
  ),
}));

vi.mock("@/app/components/ui/theme-switcher", () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher">ThemeSwitcher</div>,
}));

describe("DesignTokensPage", () => {
  it("renders the main heading and all tokens by default", () => {
    render(<DesignTokensPage />);
    
    expect(screen.getByRole("heading", { name: "Design Tokens", level: 1 })).toBeInTheDocument();
    
    // Check if some of the tokens are rendered
    expect(screen.getByText("Primary 500")).toBeInTheDocument();
    expect(screen.getByText("Spacing 4")).toBeInTheDocument();
    expect(screen.getByText("--chart-tooltip-bg")).toBeInTheDocument();
  });

  it("filters tokens by search input", async () => {
    const user = userEvent.setup();
    render(<DesignTokensPage />);

    const searchInput = screen.getByPlaceholderText("Search tokens...");
    await user.type(searchInput, "Primary 500");

    expect(screen.getByText("Primary 500")).toBeInTheDocument();
    expect(screen.queryByText("Spacing 4")).not.toBeInTheDocument();
  });

  it("filters tokens by search input value matching", async () => {
    const user = userEvent.setup();
    render(<DesignTokensPage />);

    const searchInput = screen.getByPlaceholderText("Search tokens...");
    await user.type(searchInput, "#06B6D4");

    expect(screen.getByText("Primary 500")).toBeInTheDocument();
    expect(screen.queryByText("Primary 600")).not.toBeInTheDocument();
  });

  it("filters tokens by category", async () => {
    const user = userEvent.setup();
    render(<DesignTokensPage />);

    const spacingTab = screen.getByRole("button", { name: "Spacing" });
    await user.click(spacingTab);

    expect(screen.getByText("Spacing 4")).toBeInTheDocument();
    expect(screen.getByText("Spacing 8")).toBeInTheDocument();
    expect(screen.queryByText("Primary 500")).not.toBeInTheDocument();
    expect(screen.queryByText("Radius MD")).not.toBeInTheDocument();
  });

  it("shows an empty state when no tokens match the search and category", async () => {
    const user = userEvent.setup();
    render(<DesignTokensPage />);

    const searchInput = screen.getByPlaceholderText("Search tokens...");
    await user.type(searchInput, "NonExistentToken123");

    expect(screen.getByText("No tokens found.")).toBeInTheDocument();
  });

  it("shows an empty state when filtering by a category that does not match the search", async () => {
    const user = userEvent.setup();
    render(<DesignTokensPage />);

    const searchInput = screen.getByPlaceholderText("Search tokens...");
    await user.type(searchInput, "Primary");

    const bordersTab = screen.getByRole("button", { name: "Borders" });
    await user.click(bordersTab);

    expect(screen.getByText("No tokens found.")).toBeInTheDocument();
  });
});
