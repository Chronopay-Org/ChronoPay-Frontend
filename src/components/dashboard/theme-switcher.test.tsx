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

  it("renders light, dark, auto, and scheduled radio options", () => {
    render(<ThemeSwitcher />);

    const radiogroup = screen.getByRole("radiogroup", { name: /color theme/i });
    expect(radiogroup).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(4);

    const autoRadio = screen.getByRole("radio", { name: /system theme/i });
    expect(autoRadio).toHaveAttribute("aria-checked", "true");

    // Schedule inputs should not be visible when not in scheduled mode
    expect(screen.queryByLabelText(/light mode/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/dark mode/i)).not.toBeInTheDocument();
  });

  it("switches theme on click and updates aria-checked and localStorage", () => {
    render(<ThemeSwitcher />);

    const lightRadio = screen.getByRole("radio", { name: /light theme/i });
    fireEvent.click(lightRadio);

    expect(lightRadio).toHaveAttribute("aria-checked", "true");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("reveals schedule time controls and daylight preview strip when scheduled mode is selected", () => {
    render(<ThemeSwitcher />);

    const scheduledRadio = screen.getByRole("radio", {
      name: /scheduled theme/i,
    });
    fireEvent.click(scheduledRadio);

    expect(scheduledRadio).toHaveAttribute("aria-checked", "true");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("scheduled");

    const lightTimeInput = screen.getByLabelText(/light mode/i);
    const darkTimeInput = screen.getByLabelText(/dark mode/i);

    expect(lightTimeInput).toBeInTheDocument();
    expect(darkTimeInput).toBeInTheDocument();
    expect(screen.getByText(/daylight preview/i)).toBeInTheDocument();

    fireEvent.change(lightTimeInput, { target: { value: "07:00" } });
    fireEvent.change(darkTimeInput, { target: { value: "19:00" } });

    expect(lightTimeInput).toHaveValue("07:00");
    expect(darkTimeInput).toHaveValue("19:00");
    expect(JSON.parse(window.localStorage.getItem("theme-schedule")!)).toEqual({
      type: "custom",
      lightTime: "07:00",
      darkTime: "19:00",
    });
  });

  it("supports keyboard navigation (ArrowRight, ArrowLeft, Home, End)", () => {
    render(<ThemeSwitcher />);

    const radiogroup = screen.getByRole("radiogroup", { name: /color theme/i });

    // Arrow keys move roving focus
    fireEvent.keyDown(radiogroup, { key: "ArrowRight" });
    fireEvent.keyDown(radiogroup, { key: "ArrowLeft" });
    fireEvent.keyDown(radiogroup, { key: "Home" });
    fireEvent.keyDown(radiogroup, { key: "End" });
  });

  it("has no accessibility violations in both auto and scheduled modes", async () => {
    const { container } = render(<ThemeSwitcher />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    fireEvent.click(screen.getByRole("radio", { name: /scheduled theme/i }));
    const scheduledResults = await axe(container);
    expect(scheduledResults).toHaveNoViolations();
  });
});
