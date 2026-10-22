import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { RoleChip } from "./RoleChip";
import { RoleProvider } from "../navigation/RoleContext";
import { useTheme, THEME_STORAGE_KEY } from "@/hooks/use-theme";

function TestConsumer() {
  const { mode, resolved } = useTheme();
  return (
    <div>
      <RoleChip />
      <span data-testid="consumer-mode">{mode}</span>
      <span data-testid="consumer-resolved">{resolved}</span>
    </div>
  );
}

describe("RoleChip and useTheme synchronization", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("updates useTheme state when theme is changed from RoleChip quick settings", async () => {
    render(
      <RoleProvider initialRole="buyer">
        <TestConsumer />
      </RoleProvider>
    );

    const trigger = await screen.findByRole("button", { name: /Buyer/i });
    expect(screen.getByTestId("consumer-mode")).toHaveTextContent("auto");

    // Open RoleChip popover
    fireEvent.click(trigger);

    // Click Light button
    const lightButton = screen.getByRole("button", { name: /Light/i });
    fireEvent.click(lightButton);

    expect(screen.getByTestId("consumer-mode")).toHaveTextContent("light");
    expect(screen.getByTestId("consumer-resolved")).toHaveTextContent("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Click Dark button
    const darkButton = screen.getByRole("button", { name: /Dark/i });
    fireEvent.click(darkButton);

    expect(screen.getByTestId("consumer-mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("consumer-resolved")).toHaveTextContent("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
