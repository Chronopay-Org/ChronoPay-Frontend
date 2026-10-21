import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsPage from "./page";

// Mock the DashboardShell so we don't have to deal with contexts
vi.mock("@/app/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));

describe("SettingsPage", () => {
  it("renders the settings page within the dashboard shell (happy path)", () => {
    render(<SettingsPage />);
    
    // Ensure the shell is rendered
    expect(screen.getByTestId("dashboard-shell")).toBeInTheDocument();
    
    // Ensure the main heading is rendered
    expect(screen.getByRole("heading", { name: /settings/i, level: 1 })).toBeInTheDocument();
  });

  it("handles rendering without errors (boundary)", () => {
    const { container } = render(<SettingsPage />);
    expect(container).not.toBeEmptyDOMElement();
  });
});
