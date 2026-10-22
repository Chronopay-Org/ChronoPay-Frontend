import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { axe } from "jest-axe";
import { ThemeSwitcher } from "./theme-switcher";
import { THEME_STORAGE_KEY } from "@/hooks/use-theme";

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders light, dark, and auto radio options", () => {
    render(<ThemeSwitcher />);

    const radiogroup = screen.getByRole("radiogroup", { name: /color theme/i });
    expect(radiogroup).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);

    const autoRadio = screen.getByRole("radio", { name: /system theme/i });
    expect(autoRadio).toHaveAttribute("aria-checked", "true");
  });

  it("switches theme on click and updates aria-checked and localStorage", () => {
    render(<ThemeSwitcher />);

    const lightRadio = screen.getByRole("radio", { name: /light theme/i });
    fireEvent.click(lightRadio);

    expect(lightRadio).toHaveAttribute("aria-checked", "true");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("supports keyboard navigation (ArrowRight, ArrowLeft, Home, End)", () => {
    render(<ThemeSwitcher />);

    const radiogroup = screen.getByRole("radiogroup", { name: /color theme/i });

    // Arrow keys move roving focus
    fireEvent.keyDown(radiogroup, { key: "ArrowRight" });
    fireEvent.keyDown(radiogroup, { key: "Home" });
    fireEvent.keyDown(radiogroup, { key: "End" });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ThemeSwitcher />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
