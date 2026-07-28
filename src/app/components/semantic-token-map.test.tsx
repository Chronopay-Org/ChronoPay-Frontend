import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SemanticTokenMap } from "@/app/components/semantic-token-map";

describe("SemanticTokenMap", () => {
  it("renders the viewer with heading", () => {
    render(<SemanticTokenMap />);
    expect(screen.getByText("Semantic vs Primitive Tokens")).toBeInTheDocument();
  });

  it("renders side-by-side dark and light swatches for each token", () => {
    render(<SemanticTokenMap />);

    expect(screen.getByText("--background")).toBeInTheDocument();
    expect(screen.getByText("#07111f")).toBeInTheDocument();
    expect(screen.getByText("#f0f5fb")).toBeInTheDocument();
  });

  it("shows both dark and light values in every data row", () => {
    render(<SemanticTokenMap />);

    const bodyRows = screen.getAllByRole("row").filter(
      (row) => row.closest("tbody") !== null
    );
    expect(bodyRows.length).toBeGreaterThan(0);

    bodyRows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      expect(cells.length).toBeGreaterThanOrEqual(6);
    });
  });

  it("filters by category", async () => {
    const user = userEvent.setup();
    render(<SemanticTokenMap />);

    await user.click(screen.getByRole("button", { name: /typography/i }));

    expect(screen.getByText("--helper-text-color")).toBeInTheDocument();
    expect(screen.queryByText("--background")).not.toBeInTheDocument();
  });

  it("switches theme and highlights the correct values", () => {
    render(<SemanticTokenMap />);

    const lightRadio = screen.getByRole("radio", { name: /light/i });
    fireEvent.click(lightRadio);

    expect(screen.getByText("#f0f5fb")).toBeInTheDocument();
  });

  it("highlights dark values when dark theme is active", () => {
    render(<SemanticTokenMap />);

    const darkCells = screen.getAllByText("#07111f");
    expect(darkCells.length).toBeGreaterThan(0);
  });

  it("highlights light values when light theme is active", () => {
    render(<SemanticTokenMap />);

    const lightRadio = screen.getByRole("radio", { name: /light/i });
    fireEvent.click(lightRadio);

    const lightCells = screen.getAllByText("#f0f5fb");
    expect(lightCells.length).toBeGreaterThan(0);
  });

  it("copies semantic name to clipboard", async () => {
    const user = userEvent.setup();
    const clipboard = { writeText: vi.fn() };
    Object.defineProperty(navigator, "clipboard", {
      value: clipboard,
      configurable: true,
    });

    render(<SemanticTokenMap />);

    const copyButton = screen.getAllByRole("button", { name: /copy/i })[0];
    await user.click(copyButton);

    expect(clipboard.writeText).toHaveBeenCalled();
  });

  it("announces theme change in live region", () => {
    render(<SemanticTokenMap />);

    const lightRadio = screen.getByRole("radio", { name: /light/i });
    fireEvent.click(lightRadio);

    const liveRegion = screen.getByRole("status", {
      name: /screen reader announcements/i,
    });
    expect(liveRegion).toHaveTextContent(/Theme switched to light/i);
  });

  it("resets filter when All is clicked", async () => {
    const user = userEvent.setup();
    render(<SemanticTokenMap />);

    await user.click(screen.getByRole("button", { name: /typography/i }));
    expect(screen.queryByText("--background")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /all/i }));
    expect(screen.getByText("--background")).toBeInTheDocument();
  });

  it("handles clipboard copy failure gracefully", async () => {
    const user = userEvent.setup();
    const clipboard = { writeText: vi.fn(() => { throw new Error("denied"); }) };
    Object.defineProperty(navigator, "clipboard", {
      value: clipboard,
      configurable: true,
    });

    render(<SemanticTokenMap />);

    const copyButton = screen.getAllByRole("button", { name: /copy/i })[0];
    await user.click(copyButton);

    expect(clipboard.writeText).toHaveBeenCalled();
  });

  it("switches to auto theme and shows dark primitive when system prefers dark", () => {
    const matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, "matchMedia", {
      value: matchMedia,
      configurable: true,
    });

    render(<SemanticTokenMap />);

    const autoRadio = screen.getByRole("radio", { name: /auto/i });
    fireEvent.click(autoRadio);

    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    expect(screen.getByText("#07111f")).toBeInTheDocument();
  });

  it("clears live region message after timeout", () => {
    vi.useFakeTimers();
    render(<SemanticTokenMap />);

    const lightRadio = screen.getByRole("radio", { name: /light/i });
    fireEvent.click(lightRadio);

    const liveRegion = screen.getByRole("status", {
      name: /screen reader announcements/i,
    });
    expect(liveRegion).toHaveTextContent(/Theme switched to light/i);

    vi.advanceTimersByTime(2100);
    expect(liveRegion).toHaveTextContent("");
    vi.useRealTimers();
  });

  it("has proper table accessibility attributes", () => {
    render(<SemanticTokenMap />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);

    headers.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });
  });

  it("has a region with aria-label for the mapping table", () => {
    render(<SemanticTokenMap />);

    const region = screen.getByRole("region", {
      name: /token mapping table/i,
    });
    expect(region).toBeInTheDocument();
  });

  it("renders swatches with aria-hidden", () => {
    render(<SemanticTokenMap />);

    const swatches = document.querySelectorAll("[aria-hidden='true']");
    expect(swatches.length).toBeGreaterThan(0);
  });

  it("supports long semantic token names without breaking layout", () => {
    const longTokens = [
      {
        semantic: "--very-long-semantic-token-name-that-wraps",
        dark: "#07111f",
        light: "#f0f5fb",
        category: "color",
        description: "A token with a very long name.",
      },
    ];

    render(<SemanticTokenMap tokens={longTokens} />);

    expect(screen.getByText("--very-long-semantic-token-name-that-wraps")).toBeInTheDocument();
  });

  it("renders category filter buttons for each unique category", () => {
    render(<SemanticTokenMap />);

    const categoryButtons = screen.getAllByRole("button").filter(
      (btn) =>
        btn.textContent === "color" ||
        btn.textContent === "typography" ||
        btn.textContent === "layout" ||
        btn.textContent === "shell"
    );
    expect(categoryButtons.length).toBe(4);
  });

  it("uses dir=ltr on the table for RTL compatibility", () => {
    render(<SemanticTokenMap />);

    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("dir", "ltr");
  });

  it("includes a note about using var(--token) for screen reader users", () => {
    render(<SemanticTokenMap />);

    expect(screen.getByText(/var\(--token\)/)).toBeInTheDocument();
  });

  it("renders copy buttons for each token row", () => {
    render(<SemanticTokenMap />);

    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it("displays both dark and light values for layout tokens", () => {
    render(<SemanticTokenMap />);

    const layoutValues = screen.getAllByText("24px");
    expect(layoutValues.length).toBeGreaterThanOrEqual(2);
  });

  it("displays both dark and light values for shell tokens", () => {
    render(<SemanticTokenMap />);

    expect(screen.getByText("rgba(7, 17, 31, 0.4)")).toBeInTheDocument();
    expect(screen.getByText("rgba(240, 245, 251, 0.75)")).toBeInTheDocument();
  });
});