import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchTypeahead } from "./search-typeahead";

const { mockReplace } = vi.hoisted(() => ({ mockReplace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => "/dashboard",
}));

describe("SearchTypeahead", () => {
  const mockSuggestions = [
    { id: "1", label: "UI Components", category: "Popular" },
    { id: "2", label: "Design System", category: "Popular" },
    { id: "3", label: "Accessibility", category: "Testing" },
  ];

  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input with placeholder", () => {
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        placeholder="Search marketplace…"
      />
    );

    const input = screen.getByPlaceholderText("Search marketplace…");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-label", "Search marketplace");
  });

  it("shows suggestions when input is focused with content", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "Design");

    await waitFor(() => {
      expect(screen.getByText("Design System")).toBeInTheDocument();
    });
  });

  it("filters suggestions based on input", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "Acc");

    await waitFor(() => {
      expect(screen.getByText("Accessibility")).toBeInTheDocument();
      expect(screen.queryByText("Design System")).not.toBeInTheDocument();
    });
  });

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "i");

    await waitFor(() => {
      expect(screen.getByText("UI Components")).toBeInTheDocument();
    });

    await user.keyboard("{ArrowDown}");
    const firstOption = screen.getByRole("option", { name: /UI Components/ });
    expect(firstOption).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");
    const secondOption = screen.getByRole("option", { name: /Design System/ });
    expect(secondOption).toHaveAttribute("aria-selected", "true");
  });

  it("handles enter key to select suggestion", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "UI");

    await waitFor(() => {
      expect(screen.getByText("UI Components")).toBeInTheDocument();
    });

    await user.keyboard("{ArrowDown}{Enter}");

    await waitFor(() => {
      expect(input).toHaveValue("UI Components");
    });
  });

  it("selects the first visible suggestion after filtering", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={[
          { id: "1", label: "Alpha", category: "Popular" },
          { id: "2", label: "Color Contrast", category: "Testing" },
          { id: "3", label: "Console", category: "Popular" },
        ]}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "con");
    await user.keyboard("{ArrowDown}");

    const highlightedOption = screen.getByRole("option", { selected: true });
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      highlightedOption.id
    );
    expect(highlightedOption).toHaveTextContent("Color Contrast");

    await user.keyboard("{Enter}");

    expect(input).toHaveValue("Color Contrast");
    expect(mockReplace).toHaveBeenCalledWith("/dashboard?q=Color+Contrast");
  });

  it("submits the typed query with Enter after Escape closes the list", async () => {
    const user = userEvent.setup();
    render(<SearchTypeahead suggestions={mockSuggestions} />);

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "foo");
    await user.keyboard("{Escape}{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/dashboard?q=foo");
  });

  it("resets the active option when the visible suggestions change", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SearchTypeahead suggestions={mockSuggestions} />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "i");
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant");

    rerender(
      <SearchTypeahead
        suggestions={[{ id: "4", label: "Infrastructure", category: "Testing" }]}
      />
    );

    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("clears search when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "Design");

    const clearButton = screen.getByLabelText("Clear search");
    await user.click(clearButton);

    expect(input).toHaveValue("");
  });

  it("closes dropdown on escape key", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "Design");

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("calls onSearch callback when typing", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "Des");

    expect(mockOnSearch).toHaveBeenCalledWith("Des");
  });

  it("shows loading indicator when isLoading is true", () => {
    const { container } = render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        isLoading={true}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    fireEvent.change(input, { target: { value: "test" } });

    const loadingIndicator = container.querySelector(".animate-spin");
    expect(loadingIndicator).toHaveClass("animate-spin");
  });

  it("shows 'no results' message when no suggestions match", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "xyz");

    await waitFor(() => {
      expect(screen.getByText(/No results found/)).toBeInTheDocument();
    });
  });

  it("groups suggestions by category", async () => {
    const user = userEvent.setup();
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    await user.type(input, "i");

    await waitFor(() => {
      expect(screen.getByText("Popular")).toBeInTheDocument();
      expect(screen.getByText("Testing")).toBeInTheDocument();
    });
  });

  it("has proper ARIA attributes for accessibility", () => {
    render(
      <SearchTypeahead
        suggestions={mockSuggestions}
      />
    );

    const input = screen.getByLabelText("Search marketplace");
    expect(input).not.toHaveAttribute("role");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });
});
