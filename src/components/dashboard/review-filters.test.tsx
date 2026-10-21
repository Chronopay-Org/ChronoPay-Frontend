import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ReviewFilters } from "./review-filters";

describe("ReviewFilters", () => {
  it("renders correctly with selected stars and sort order", () => {
    render(
      <ReviewFilters
        selectedStars={5}
        onStarChange={vi.fn()}
        sortBy="recent"
        onSortChange={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /5/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /All/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("combobox", { name: /Sort by/ })).toHaveValue("recent");
  });

  it("calls onStarChange when a filter is clicked", async () => {
    const onStarChange = vi.fn();
    render(
      <ReviewFilters
        selectedStars={null}
        onStarChange={onStarChange}
        sortBy="helpful"
        onSortChange={vi.fn()}
      />
    );
    
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /4/ }));
    expect(onStarChange).toHaveBeenCalledWith(4);
    
    await user.click(screen.getByRole("button", { name: /All/ }));
    expect(onStarChange).toHaveBeenCalledWith(null);
  });

  it("calls onSortChange when sort order is changed", async () => {
    const onSortChange = vi.fn();
    render(
      <ReviewFilters
        selectedStars={null}
        onStarChange={vi.fn()}
        sortBy="recent"
        onSortChange={onSortChange}
      />
    );
    
    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole("combobox", { name: /Sort by/ }), "high");
    expect(onSortChange).toHaveBeenCalledWith("high");
  });
});
