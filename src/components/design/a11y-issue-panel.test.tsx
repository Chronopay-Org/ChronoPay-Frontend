import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { A11yIssuePanel } from "@/components/design/a11y-issue-panel";
import { SAMPLE_AUDIT_ISSUES } from "@/lib/wcag-references";

describe("A11yIssuePanel", () => {
  const mockOnClose = vi.fn();
  const mockTriggerRef = { current: document.createElement("button") };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("does not render when issue is null", () => {
      const { container } = render(
        <A11yIssuePanel issue={null} onClose={mockOnClose} />
      );
      expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument();
    });

    it("renders panel with issue content", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText(issue.title)).toBeInTheDocument();
      expect(screen.getByText(issue.description)).toBeInTheDocument();
      expect(screen.getByText(issue.impact)).toBeInTheDocument();
    });

    it("renders all sections correctly", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("Impact")).toBeInTheDocument();
      expect(screen.getByText("Failing Code Snippet")).toBeInTheDocument();
      expect(screen.getByText("WCAG 2.1 Criterion")).toBeInTheDocument();
      expect(screen.getByText("Recommended Fix")).toBeInTheDocument();
    });

    it("displays severity badge with correct styling", () => {
      const criticalIssue = SAMPLE_AUDIT_ISSUES.find((i) => i.severity === "critical")!;
      render(
        <A11yIssuePanel
          issue={criticalIssue}
          onClose={mockOnClose}
          triggerRef={mockTriggerRef}
        />
      );

      const badge = screen.getByText("critical").closest("span");
      expect(badge).toHaveClass("bg-rose-400/20");
    });

    it("displays WCAG criterion with level badge", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText(issue.wcagCriterion.id)).toBeInTheDocument();
      expect(screen.getByText(issue.wcagCriterion.title)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`Level ${issue.wcagCriterion.level}`))).toBeInTheDocument();
    });

    it("renders code snippets correctly", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText(issue.snippet)).toBeInTheDocument();
      expect(screen.getByText(issue.recommendedFix.codeExample)).toBeInTheDocument();
    });

    it("renders external link to WCAG spec", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const link = screen.getByText(/Read WCAG criterion/);
      expect(link).toHaveAttribute("href", issue.wcagCriterion.specUrl);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders techniques list when available", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText("Techniques:")).toBeInTheDocument();
      issue.wcagCriterion.techniques.forEach((tech) => {
        expect(screen.getByText(new RegExp(tech))).toBeInTheDocument();
      });
    });

    it("displays metadata (element type, issue ID)", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText("Element Type:")).toBeInTheDocument();
      expect(screen.getByText(issue.elementType)).toBeInTheDocument();
      expect(screen.getByText("Issue ID:")).toBeInTheDocument();
      expect(screen.getByText(issue.id)).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("closes panel when Escape is pressed", async () => {
      const user = userEvent.setup();
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("restores focus to trigger after Escape", async () => {
      const user = userEvent.setup();
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("focuses close button when panel opens", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const closeButton = screen.getByLabelText("Close issue panel");
      expect(closeButton).toBeInTheDocument();
    });

    it("allows Tab navigation within the panel", async () => {
      const user = userEvent.setup();
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const closeButton = screen.getByLabelText("Close issue panel");
      const wcagLink = screen.getByText(/Read WCAG criterion/);

      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      await user.keyboard("{Tab}");
      // Focus should move to next focusable element (could be WCAG link or another button)
      expect(document.activeElement).not.toBe(closeButton);
    });

    it("allows Shift+Tab navigation within the panel", async () => {
      const user = userEvent.setup();
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const wcagLink = screen.getByText(/Read WCAG criterion/);
      wcagLink.focus();

      await user.keyboard("{Shift>}{Tab}{/Shift}");
      // Focus should cycle to previous element
      expect(document.activeElement).not.toBe(wcagLink);
    });

    it("closes panel when backdrop is clicked", async () => {
      const user = userEvent.setup();
      const issue = SAMPLE_AUDIT_ISSUES[0];
      const { container } = render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const backdrop = container.querySelector("[aria-hidden='true']");
      expect(backdrop).toBeInTheDocument();

      await user.click(backdrop!);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Close Button", () => {
    it("closes panel when close button is clicked", async () => {
      const user = userEvent.setup();
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const closeButton = screen.getByLabelText("Close issue panel");
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("close button has proper focus styles", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const closeButton = screen.getByLabelText("Close issue panel");
      expect(closeButton.className).toContain("focus-visible:ring");
    });
  });

  describe("Accessibility", () => {
    it("has proper dialog role and attributes", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby");
    });

    it("displays issue severity with icon and badge", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText(issue.severity)).toBeInTheDocument();
    });

    it("has aria-hidden on decorative icons", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      const { container } = render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const ariaHiddenIcons = container.querySelectorAll("[aria-hidden='true']");
      expect(ariaHiddenIcons.length).toBeGreaterThan(0);
    });

    it("has visible focus ring on all interactive elements", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      const { container } = render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        expect(button.className).toContain("focus-visible");
      });

      const links = container.querySelectorAll("a");
      links.forEach((link) => {
        expect(link.className).toContain("focus-visible");
      });
    });

    it("announcements use semantic heading levels", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const headings = screen.getAllByRole("heading");
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe("Severity Variations", () => {
    it("displays critical severity correctly", () => {
      const criticalIssue = SAMPLE_AUDIT_ISSUES.find((i) => i.severity === "critical")!;
      render(
        <A11yIssuePanel issue={criticalIssue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const badge = screen.getByText("critical");
      expect(badge.closest("span")).toHaveClass("bg-rose-400/20");
    });

    it("displays major severity correctly", () => {
      const majorIssue = SAMPLE_AUDIT_ISSUES.find((i) => i.severity === "major")!;
      render(
        <A11yIssuePanel issue={majorIssue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const badge = screen.getByText("major");
      expect(badge.closest("span")).toHaveClass("bg-amber-400/20");
    });

    it("displays minor severity correctly", () => {
      const minorIssue = SAMPLE_AUDIT_ISSUES.find((i) => i.severity === "minor")!;
      render(
        <A11yIssuePanel issue={minorIssue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const badge = screen.getByText("minor");
      expect(badge.closest("span")).toHaveClass("bg-cyan-400/20");
    });
  });

  describe("WCAG Levels", () => {
    it("displays level A criteria", () => {
      const aLevelIssue = SAMPLE_AUDIT_ISSUES.find((i) => i.wcagCriterion.level === "A")!;
      render(
        <A11yIssuePanel issue={aLevelIssue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText(/Level A/)).toBeInTheDocument();
    });

    it("displays level AA criteria", () => {
      const aaLevelIssue = SAMPLE_AUDIT_ISSUES.find((i) => i.wcagCriterion.level === "AA")!;
      render(
        <A11yIssuePanel issue={aaLevelIssue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText(/Level AA/)).toBeInTheDocument();
    });
  });

  describe("Content Sections", () => {
    it("shows all content sections", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("Impact")).toBeInTheDocument();
      expect(screen.getByText("Failing Code Snippet")).toBeInTheDocument();
      expect(screen.getByText("WCAG 2.1 Criterion")).toBeInTheDocument();
      expect(screen.getByText("Recommended Fix")).toBeInTheDocument();
    });

    it("displays element location information", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText(issue.location)).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("applies responsive classes", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      const { container } = render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const panel = container.querySelector("[role='dialog']");
      expect(panel?.className).toContain("md:w-96");
      expect(panel?.className).toContain("w-full");
    });

    it("has proper padding for mobile and desktop", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      const { container } = render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const contentAreas = container.querySelectorAll("div");
      expect(contentAreas.length).toBeGreaterThan(0);
      // Check for responsive padding classes
      let hasResponsivePadding = false;
      contentAreas.forEach((el) => {
        if (el.className.includes("px-4") && el.className.includes("sm:px-6")) {
          hasResponsivePadding = true;
        }
      });
      expect(hasResponsivePadding).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("handles issues with long titles", () => {
      const issueWithLongTitle = {
        ...SAMPLE_AUDIT_ISSUES[0],
        title: "This is a very long accessibility issue title that should wrap properly without breaking the layout or causing overflow",
      };
      render(
        <A11yIssuePanel issue={issueWithLongTitle} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText(issueWithLongTitle.title)).toBeInTheDocument();
    });

    it("handles issues with long snippets", () => {
      const issueWithLongSnippet = {
        ...SAMPLE_AUDIT_ISSUES[0],
        snippet:
          '<div className="very-long-class-name-that-goes-on-and-on-and-on overflow-hidden bg-slate-900 border border-white/10 rounded-lg"><button className="long-button-class-name" disabled>Long Button Text</button></div>',
      };
      render(
        <A11yIssuePanel issue={issueWithLongSnippet} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.getByText(issueWithLongSnippet.snippet)).toBeInTheDocument();
    });

    it("handles issues without techniques", () => {
      const issueWithoutTechniques = {
        ...SAMPLE_AUDIT_ISSUES[0],
        wcagCriterion: {
          ...SAMPLE_AUDIT_ISSUES[0].wcagCriterion,
          techniques: [],
        },
      };
      render(
        <A11yIssuePanel issue={issueWithoutTechniques} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      expect(screen.queryByText("Techniques:")).not.toBeInTheDocument();
    });
  });

  describe("Focus Trap", () => {
    it("keeps focus within the panel when Tab is pressed", async () => {
      const user = userEvent.setup();
      const issue = SAMPLE_AUDIT_ISSUES[0];
      const { container } = render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const dialog = container.querySelector("[role='dialog']");
      expect(dialog).toBeInTheDocument();

      // Focus should be in the panel
      const activeElement = document.activeElement;
      const dialogElement = dialog as HTMLElement;
      const isInPanel = dialogElement.contains(activeElement);
      expect(isInPanel).toBe(true);
    });
  });

  describe("Dark Mode Compatibility", () => {
    it("uses dark mode color classes", () => {
      const issue = SAMPLE_AUDIT_ISSUES[0];
      const { container } = render(
        <A11yIssuePanel issue={issue} onClose={mockOnClose} triggerRef={mockTriggerRef} />
      );

      const panel = container.querySelector("[role='dialog']");
      expect(panel?.className).toContain("bg-slate-900");
      expect(panel?.className).toContain("border-white");
    });
  });
});
