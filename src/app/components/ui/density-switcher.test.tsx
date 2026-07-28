import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DensitySwitcher } from "./density-switcher";

describe("DensitySwitcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders density options and defaults to balanced", async () => {
    render(<DensitySwitcher />);

    const balanced = await screen.findByRole("button", {
      name: /Balanced density/i,
    });
    const comfortable = screen.getByRole("button", {
      name: /Comfortable density/i,
    });
    const compact = screen.getByRole("button", { name: /Compact density/i });

    expect(balanced).toHaveAttribute("aria-pressed", "true");
    expect(comfortable).toHaveAttribute("aria-pressed", "false");
    expect(compact).toHaveAttribute("aria-pressed", "false");
  });

  it("loads the stored density preference from localStorage", async () => {
    window.localStorage.setItem("chronopay-density", "compact");

    render(<DensitySwitcher />);

    const compact = await screen.findByRole("button", {
      name: /Compact density/i,
    });
    expect(compact).toHaveAttribute("aria-pressed", "true");
  });

  it("persists a new density selection to localStorage", async () => {
    render(<DensitySwitcher />);

    const compact = await screen.findByRole("button", {
      name: /Compact density/i,
    });
    fireEvent.click(compact);

    expect(window.localStorage.getItem("chronopay-density")).toBe("compact");
    expect(compact).toHaveAttribute("aria-pressed", "true");
  });
});
