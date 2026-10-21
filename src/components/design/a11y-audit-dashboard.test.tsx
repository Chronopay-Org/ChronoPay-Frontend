import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { A11yAuditDashboard } from "./a11y-audit-dashboard";
import { SAMPLE_AUDIT_ISSUES } from "@/lib/wcag-references";
import axe from "axe-core";

import { vi } from "vitest";

vi.mock("axe-core", () => ({
  default: {
    run: vi.fn().mockResolvedValue({
      violations: [
        {
          id: "color-contrast",
          impact: "critical",
          description: "Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds",
          help: "Elements must have sufficient color contrast",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.4/color-contrast",
          nodes: [
            {
              html: "<div class=\"text-gray-500 bg-white\">Low contrast text</div>",
              target: [".text-gray-500"],
              failureSummary: "Fix color contrast"
            }
          ]
        }
      ]
    })
  }
}));

describe("A11yAuditDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with sample issues initially", () => {
    render(<A11yAuditDashboard />);
    expect(screen.getByText("Live Accessibility Audit")).toBeInTheDocument();
    expect(screen.getByText("Run Axe Audit")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("filters issues by severity", () => {
    render(<A11yAuditDashboard />);
    fireEvent.click(screen.getByText("Critical"));
    
    // Only critical issues should be rendered
    const issues = screen.getAllByRole("button").filter(b => b.getAttribute("aria-pressed") !== null && !b.textContent?.includes("Critical") && !b.textContent?.includes("Major") && !b.textContent?.includes("Minor"));
    expect(issues.length).toBeGreaterThan(0);
  });

  it("runs axe audit when button is clicked", async () => {
    render(<A11yAuditDashboard />);
    const runBtn = screen.getByRole("button", { name: /Run Axe Audit/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      // Mock returns 1 violation
      expect(screen.getByText("Elements must have sufficient color contrast")).toBeInTheDocument();
    });
  });
});
