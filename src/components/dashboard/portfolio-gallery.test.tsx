/**
 * PortfolioGallery tests
 *
 * Coverage targets (95%+):
 *  - Default render with PanelShell chrome (title, eyebrow, description)
 *  - Empty state renders empty message + icon
 *  - Grid renders correct number of thumbnails
 *  - maxVisible prop limits rendered thumbnails
 *  - Overflow "+N" cell shown when images exceed maxVisible
 *  - Overflow cell opens lightbox at last visible index
 *  - No overflow cell when images <= maxVisible
 *  - Clicking a thumbnail opens the lightbox at the correct index
 *  - Lightbox opens and closes via close button
 *  - Lightbox opens and closes via backdrop click
 *  - Lightbox opens and closes via Escape key
 *  - Thumbnail aria-labels describe each image
 *  - Thumbnails have aria-haspopup="dialog"
 *  - bare mode: renders grid without PanelShell chrome
 *  - bare mode: custom className applied to wrapper div
 *  - cellAspectRatio passed to thumbnail cells as inline style
 *  - Custom title, eyebrow, description passed to PanelShell
 *  - Images with thumbSrc use thumbSrc for the thumbnail
 *  - Images without thumbSrc fall back to src
 *  - Lightbox navigation works end-to-end (Next/Prev)
 *  - Lightbox shows caption matching the clicked thumbnail alt text
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { PortfolioGallery, type LightboxImage } from "./portfolio-gallery";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const IMAGES: LightboxImage[] = [
  { src: "/img/1.jpg", alt: "First image", thumbSrc: "/img/1-t.jpg" },
  { src: "/img/2.jpg", alt: "Second image" },
  { src: "/img/3.jpg", alt: "Third image" },
  { src: "/img/4.jpg", alt: "Fourth image" },
  { src: "/img/5.jpg", alt: "Fifth image" },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function setup(
  overrides: Partial<React.ComponentProps<typeof PortfolioGallery>> = {},
) {
  const result = render(
    <PortfolioGallery images={IMAGES} {...overrides} />,
  );
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PortfolioGallery", () => {
  afterEach(() => {
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  // ── Default render ────────────────────────────────────────────────────────

  describe("default render", () => {
    it("renders the default panel title", () => {
      setup();
      expect(
        screen.getByRole("heading", { name: "Portfolio" }),
      ).toBeInTheDocument();
    });

    it("renders a custom title", () => {
      setup({ title: "Work Samples" });
      expect(
        screen.getByRole("heading", { name: "Work Samples" }),
      ).toBeInTheDocument();
    });

    it("renders the eyebrow label", () => {
      setup({ eyebrow: "My Gallery" });
      expect(screen.getByText("My Gallery")).toBeInTheDocument();
    });

    it("renders the description", () => {
      setup({ description: "Browse recent projects." });
      expect(screen.getByText("Browse recent projects.")).toBeInTheDocument();
    });

    it("wraps content in a landmark section via PanelShell", () => {
      setup({ title: "Portfolio" });
      // PanelShell renders a <section> with aria-labelledby pointing to the title
      const heading = screen.getByRole("heading", { name: "Portfolio" });
      const section = heading.closest("section");
      expect(section).toBeInTheDocument();
    });
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  describe("empty state", () => {
    it("renders the empty state when images array is empty", () => {
      setup({ images: [] });
      expect(screen.getByTestId("portfolio-empty")).toBeInTheDocument();
    });

    it("shows the empty state message", () => {
      setup({ images: [] });
      expect(
        screen.getByText(/No portfolio images yet/i),
      ).toBeInTheDocument();
    });

    it("does not render the grid when empty", () => {
      setup({ images: [] });
      expect(screen.queryByTestId("portfolio-grid")).not.toBeInTheDocument();
    });
  });

  // ── Grid rendering ────────────────────────────────────────────────────────

  describe("grid rendering", () => {
    it("renders the grid when images are provided", () => {
      setup();
      expect(screen.getByTestId("portfolio-grid")).toBeInTheDocument();
    });

    it("renders thumbnails for all images when within maxVisible", () => {
      setup({ maxVisible: 10 });
      for (let i = 0; i < IMAGES.length; i++) {
        expect(screen.getByTestId(`portfolio-thumb-${i}`)).toBeInTheDocument();
      }
    });

    it("respects maxVisible — only shows that many thumbnails", () => {
      setup({ maxVisible: 3 });
      expect(screen.getByTestId("portfolio-thumb-0")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-thumb-1")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-thumb-2")).toBeInTheDocument();
      expect(
        screen.queryByTestId("portfolio-thumb-3"),
      ).not.toBeInTheDocument();
    });

    it("uses thumbSrc for thumbnail when available", () => {
      setup({ maxVisible: 10 });
      const firstThumb = screen.getByTestId("portfolio-thumb-0");
      const img = firstThumb.querySelector("img");
      expect(img).toHaveAttribute("src", "/img/1-t.jpg");
    });

    it("falls back to src when thumbSrc is absent", () => {
      setup({ maxVisible: 10 });
      const secondThumb = screen.getByTestId("portfolio-thumb-1");
      const img = secondThumb.querySelector("img");
      expect(img).toHaveAttribute("src", "/img/2.jpg");
    });

    it("applies cellAspectRatio inline style to each thumbnail button", () => {
      setup({ cellAspectRatio: "1 / 1", maxVisible: 10 });
      const thumb = screen.getByTestId("portfolio-thumb-0");
      expect(thumb).toHaveStyle("aspect-ratio: 1 / 1");
    });
  });

  // ── Overflow cell ─────────────────────────────────────────────────────────

  describe("overflow cell", () => {
    it("shows +N overflow cell when images exceed maxVisible", () => {
      setup({ maxVisible: 3 });
      expect(screen.getByTestId("portfolio-overflow")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overflow")).toHaveAccessibleName(
        /2 more image/i,
      );
    });

    it("shows correct hidden count in aria-label", () => {
      setup({ maxVisible: 2 });
      const overflow = screen.getByTestId("portfolio-overflow");
      expect(overflow).toHaveAccessibleName(/3 more image/i);
    });

    it("does not show overflow cell when images <= maxVisible", () => {
      setup({ maxVisible: 10 });
      expect(
        screen.queryByTestId("portfolio-overflow"),
      ).not.toBeInTheDocument();
    });

    it("uses singular 'image' when hiddenCount is 1", () => {
      setup({ maxVisible: 4 });
      const overflow = screen.getByTestId("portfolio-overflow");
      // 5 images, maxVisible=4 → 1 hidden
      expect(overflow).toHaveAccessibleName(/1 more image[^s]/i);
    });
  });

  // ── Thumbnail accessibility ───────────────────────────────────────────────

  describe("thumbnail accessibility", () => {
    it("each thumbnail button has an aria-label describing the image", () => {
      setup({ maxVisible: 10 });
      expect(
        screen.getByRole("button", { name: /Open image 1: First image/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Open image 2: Second image/i }),
      ).toBeInTheDocument();
    });

    it("each thumbnail button has aria-haspopup='dialog'", () => {
      setup({ maxVisible: 10 });
      const thumb = screen.getByTestId("portfolio-thumb-0");
      expect(thumb).toHaveAttribute("aria-haspopup", "dialog");
    });

    it("overflow cell has aria-haspopup='dialog'", () => {
      setup({ maxVisible: 3 });
      expect(screen.getByTestId("portfolio-overflow")).toHaveAttribute(
        "aria-haspopup",
        "dialog",
      );
    });
  });

  // ── Lightbox integration ──────────────────────────────────────────────────

  describe("lightbox integration", () => {
    it("lightbox is closed by default", () => {
      setup();
      expect(screen.queryByTestId("lightbox-dialog")).not.toBeInTheDocument();
    });

    it("clicking a thumbnail opens the lightbox", () => {
      setup({ maxVisible: 10 });
      fireEvent.click(screen.getByTestId("portfolio-thumb-0"));
      expect(screen.getByTestId("lightbox-dialog")).toBeInTheDocument();
    });

    it("opens lightbox showing the clicked image", () => {
      setup({ maxVisible: 10 });
      fireEvent.click(screen.getByTestId("portfolio-thumb-1"));
      expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
        "alt",
        "Second image",
      );
    });

    it("lightbox caption shows alt text of opened image", () => {
      setup({ maxVisible: 10 });
      fireEvent.click(screen.getByTestId("portfolio-thumb-2"));
      expect(screen.getByTestId("lightbox-caption")).toHaveTextContent(
        "Third image",
      );
    });

    it("closes lightbox on close button click", () => {
      setup({ maxVisible: 10 });
      fireEvent.click(screen.getByTestId("portfolio-thumb-0"));
      expect(screen.getByTestId("lightbox-dialog")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Close lightbox/i }));
      expect(screen.queryByTestId("lightbox-dialog")).not.toBeInTheDocument();
    });

    it("closes lightbox on Escape key", () => {
      setup({ maxVisible: 10 });
      fireEvent.click(screen.getByTestId("portfolio-thumb-0"));
      expect(screen.getByTestId("lightbox-dialog")).toBeInTheDocument();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByTestId("lightbox-dialog")).not.toBeInTheDocument();
    });

    it("closes lightbox on backdrop click", () => {
      setup({ maxVisible: 10 });
      fireEvent.click(screen.getByTestId("portfolio-thumb-0"));
      expect(screen.getByTestId("lightbox-dialog")).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("lightbox-backdrop"));
      expect(screen.queryByTestId("lightbox-dialog")).not.toBeInTheDocument();
    });

    it("navigates to next image via Next button", () => {
      setup({ maxVisible: 10 });
      fireEvent.click(screen.getByTestId("portfolio-thumb-0"));
      fireEvent.click(screen.getByRole("button", { name: /Next image/i }));
      expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
        "alt",
        "Second image",
      );
    });

    it("navigates to previous image via Prev button", () => {
      setup({ maxVisible: 10 });
      fireEvent.click(screen.getByTestId("portfolio-thumb-2"));
      fireEvent.click(screen.getByRole("button", { name: /Previous image/i }));
      expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
        "alt",
        "Second image",
      );
    });

    it("overflow cell opens lightbox at the last visible index", () => {
      setup({ maxVisible: 3 });
      fireEvent.click(screen.getByTestId("portfolio-overflow"));
      // maxVisible - 1 = 2 → third image (index 2)
      expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
        "alt",
        "Third image",
      );
    });

    it("clicking a thumbnail in the lightbox strip navigates correctly", () => {
      setup({ maxVisible: 10 });
      fireEvent.click(screen.getByTestId("portfolio-thumb-0"));
      // Click the 3rd tab in the strip (index 2)
      const tabs = screen.getAllByRole("tab");
      fireEvent.click(tabs[2]);
      expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
        "alt",
        "Third image",
      );
    });
  });

  // ── Bare mode ─────────────────────────────────────────────────────────────

  describe("bare mode", () => {
    it("does not render PanelShell chrome in bare mode", () => {
      setup({ bare: true });
      expect(
        screen.queryByRole("heading", { name: "Portfolio" }),
      ).not.toBeInTheDocument();
    });

    it("still renders the grid in bare mode", () => {
      setup({ bare: true });
      expect(screen.getByTestId("portfolio-grid")).toBeInTheDocument();
    });

    it("applies className to the wrapper div in bare mode", () => {
      const { container } = setup({ bare: true, className: "my-custom-class" });
      expect(
        container.querySelector(".my-custom-class"),
      ).toBeInTheDocument();
    });

    it("applies className wrapper div in panel mode", () => {
      const { container } = setup({ bare: false, className: "outer-custom" });
      expect(
        container.querySelector(".outer-custom"),
      ).toBeInTheDocument();
    });
  });
});
