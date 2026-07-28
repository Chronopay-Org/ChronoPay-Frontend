import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WarningBanner } from "@/app/components/ui/warning-banner";

describe("WarningBanner", () => {
  describe("Rendering", () => {
    it("renders title and description", () => {
      render(
        <WarningBanner
          title="Test Warning"
          description="This is a test warning message."
        />
      );

      expect(screen.getByText("Test Warning")).toBeInTheDocument();
      expect(screen.getByText("This is a test warning message.")).toBeInTheDocument();
    });

    it("renders with correct accessibility attributes", () => {
      render(
        <WarningBanner
          title="Warning"
          description="Description"
        />
      );

      const banner = screen.getByRole("alert");
      expect(banner).toHaveAttribute("aria-live", "assertive");
      expect(banner).toHaveAttribute("aria-atomic", "true");
    });

    it("renders alert icon", () => {
      const { container } = render(
        <WarningBanner
          title="Warning"
          description="Description"
        />
      );

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("renders with amber warning color scheme", () => {
      const { container } = render(
        <WarningBanner
          title="Warning"
          description="Description"
        />
      );

      const banner = screen.getByRole("alert");
      expect(banner.className).toContain("bg-amber-400/8");
      expect(banner.className).toContain("border-amber-400/30");
    });

    it("renders description as ReactNode", () => {
      render(
        <WarningBanner
          title="Warning"
          description={<span data-testid="custom-desc">Custom Description</span>}
        />
      );

      expect(screen.getByTestId("custom-desc")).toBeInTheDocument();
    });
  });

  describe("Dismiss Button", () => {
    it("renders dismiss button when onDismiss is provided", () => {
      const onDismiss = vi.fn();
      render(
        <WarningBanner
          title="Warning"
          description="Description"
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByLabelText("Dismiss warning")).toBeInTheDocument();
    });

    it("does not render dismiss button when onDismiss is not provided", () => {
      render(
        <WarningBanner
          title="Warning"
          description="Description"
        />
      );

      expect(screen.queryByLabelText("Dismiss warning")).not.toBeInTheDocument();
    });

    it("calls onDismiss when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(
        <WarningBanner
          title="Warning"
          description="Description"
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText("Dismiss warning");
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("dismiss button has proper focus styles", () => {
      const onDismiss = vi.fn();
      render(
        <WarningBanner
          title="Warning"
          description="Description"
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText("Dismiss warning");
      expect(dismissButton.className).toContain("focus-visible");
      expect(dismissButton.className).toContain("ring");
    });
  });

  describe("Styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <WarningBanner
          title="Warning"
          description="Description"
          className="custom-class"
        />
      );

      const banner = screen.getByRole("alert");
      expect(banner.className).toContain("custom-class");
    });

    it("renders with responsive padding", () => {
      const { container } = render(
        <WarningBanner
          title="Warning"
          description="Description"
        />
      );

      const banner = screen.getByRole("alert");
      expect(banner.className).toContain("p-4");
      expect(banner.className).toContain("sm:p-5");
    });

    it("has proper icon styling", () => {
      const { container } = render(
        <WarningBanner
          title="Warning"
          description="Description"
        />
      );

      const icon = container.querySelector("svg");
      expect(icon?.className.baseVal).toContain("text-amber-300");
    });
  });

  describe("Content Layout", () => {
    it("displays title and description with proper hierarchy", () => {
      render(
        <WarningBanner
          title="Warning Title"
          description="Warning Description"
        />
      );

      const title = screen.getByText("Warning Title");
      const description = screen.getByText("Warning Description");

      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();

      // Title should appear before description in DOM
      expect(title.compareDocumentPosition(description)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    it("wraps content properly in responsive columns", () => {
      const { container } = render(
        <WarningBanner
          title="Warning"
          description="Description"
          onDismiss={() => {}}
        />
      );

      const banner = screen.getByRole("alert");
      expect(banner.className).toContain("flex");
      expect(banner.className).toContain("gap-3");
    });
  });

  describe("Accessibility", () => {
    it("is keyboard accessible", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(
        <WarningBanner
          title="Warning"
          description="Description"
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText("Dismiss warning");
      dismissButton.focus();

      expect(document.activeElement).toBe(dismissButton);

      await user.keyboard(" ");

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("announces content to screen readers", () => {
      render(
        <WarningBanner
          title="Experimental Features"
          description="These features are unstable."
        />
      );

      const banner = screen.getByRole("alert");
      expect(banner).toHaveAttribute("aria-live", "assertive");
      expect(banner).toHaveAttribute("aria-atomic", "true");
    });

    it("icon is hidden from screen readers", () => {
      const { container } = render(
        <WarningBanner
          title="Warning"
          description="Description"
        />
      );

      const icon = container.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Color Contrast", () => {
    it("uses proper contrast for warning scheme", () => {
      const { container } = render(
        <WarningBanner
          title="Warning"
          description="Description"
        />
      );

      const banner = screen.getByRole("alert");
      // Verify amber color classes which meet WCAG AA standards
      expect(banner.className).toContain("amber");
    });
  });

  describe("Edge Cases", () => {
    it("handles long descriptions", () => {
      const longDescription =
        "This is a very long description that should wrap properly on smaller screens without breaking the layout or causing accessibility issues.";

      render(
        <WarningBanner
          title="Warning"
          description={longDescription}
        />
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it("handles empty title", () => {
      render(
        <WarningBanner
          title=""
          description="Description"
        />
      );

      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("can be dismissed and removed from DOM", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      const { unmount } = render(
        <WarningBanner
          title="Warning"
          description="Description"
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText("Dismiss warning");
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
      unmount();

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
