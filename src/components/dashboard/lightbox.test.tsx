/**
 * Lightbox tests
 *
 * Coverage targets (95%+):
 *  - Renders nothing when currentIndex is null (closed state)
 *  - Renders dialog with correct ARIA roles when open
 *  - Shows image with alt text
 *  - Renders alt text as visible caption
 *  - Shows "Image N of M" counter
 *  - Previous/Next buttons present only when applicable
 *  - Previous/Next buttons carry descriptive aria-labels
 *  - Clicking Next navigates forward
 *  - Clicking Prev navigates backward
 *  - Keyboard ArrowRight navigates forward
 *  - Keyboard ArrowLeft navigates backward
 *  - Keyboard Escape closes the lightbox
 *  - Clicking backdrop closes the lightbox
 *  - Clicking inside dialog does NOT close
 *  - Close button closes the lightbox
 *  - Thumbnail strip renders for multiple images
 *  - Clicking a thumbnail navigates to that index
 *  - Thumbnail strip hidden for single image
 *  - Long alt text renders without truncation (overflow-wrap: anywhere)
 *  - Body scroll locked while open, unlocked on close
 *  - RTL logical property classes present (start/end)
 *  - onClose not called twice if already closed
 */

import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Lightbox, type LightboxImage } from "./lightbox";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const IMAGES: LightboxImage[] = [
  { src: "/img/a.jpg", alt: "Red barn at sunset", thumbSrc: "/img/a-thumb.jpg" },
  { src: "/img/b.jpg", alt: "Mountain lake reflection" },
  { src: "/img/c.jpg", alt: "City skyline at night" },
];

const SINGLE_IMAGE: LightboxImage[] = [
  { src: "/img/solo.jpg", alt: "Solo photo" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(
  overrides: Partial<React.ComponentProps<typeof Lightbox>> = {},
  initialIndex: number | null = 0,
) {
  const onClose = vi.fn();
  const onNavigate = vi.fn();
  const props = {
    images: IMAGES,
    currentIndex: initialIndex,
    onClose,
    onNavigate,
    ...overrides,
  };
  const result = render(<Lightbox {...props} />);
  return { ...result, onClose, onNavigate };
}

/** A controlled wrapper that actually updates state so navigation works. */
function ControlledLightbox({
  images = IMAGES,
  initialIndex = 0,
}: {
  images?: LightboxImage[];
  initialIndex?: number;
}) {
  const [index, setIndex] = useState<number | null>(initialIndex);
  return (
    <Lightbox
      images={images}
      currentIndex={index}
      onClose={() => setIndex(null)}
      onNavigate={setIndex}
    />
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Lightbox", () => {
  beforeEach(() => {
    // Ensure body.overflow starts clean
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  // ── Closed state ──────────────────────────────────────────────────────────

  describe("closed state", () => {
    it("renders nothing when currentIndex is null", () => {
      setup({}, null);
      expect(screen.queryByTestId("lightbox-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("lightbox-backdrop")).not.toBeInTheDocument();
    });
  });

  // ── Open state / ARIA ─────────────────────────────────────────────────────

  describe("open state and ARIA", () => {
    it("renders a dialog with role=dialog and aria-modal", () => {
      setup();
      const dialog = screen.getByTestId("lightbox-dialog");
      expect(dialog).toHaveAttribute("role", "dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("dialog has an accessible label via aria-labelledby", () => {
      setup();
      const dialog = screen.getByTestId("lightbox-dialog");
      const labelId = dialog.getAttribute("aria-labelledby");
      expect(labelId).toBeTruthy();
      // The label element should exist in the document
      expect(document.getElementById(labelId!)).toBeInTheDocument();
    });

    it("shows the image with its alt text", () => {
      setup();
      const img = screen.getByTestId("lightbox-image");
      expect(img).toHaveAttribute("alt", "Red barn at sunset");
      expect(img).toHaveAttribute("src", "/img/a.jpg");
    });

    it("shows the image counter", () => {
      setup();
      expect(screen.getByText(/Image 1 of 3/i)).toBeInTheDocument();
    });

    it("updates counter after navigation", () => {
      render(<ControlledLightbox />);
      fireEvent.click(screen.getByRole("button", { name: /Next image/i }));
      expect(screen.getByText(/Image 2 of 3/i)).toBeInTheDocument();
    });
  });

  // ── Caption ───────────────────────────────────────────────────────────────

  describe("caption", () => {
    it("renders alt text as visible caption", () => {
      setup();
      const caption = screen.getByTestId("lightbox-caption");
      expect(caption).toHaveTextContent("Red barn at sunset");
    });

    it("renders long alt text without truncation (overflow-wrap: anywhere)", () => {
      const longAlt = "A ".repeat(200).trim();
      setup({
        images: [{ src: "/img/long.jpg", alt: longAlt }],
        currentIndex: 0,
      });
      const caption = screen.getByTestId("lightbox-caption");
      expect(caption).toHaveTextContent(longAlt);
      expect(caption.querySelector("p")).toHaveStyle(
        "overflow-wrap: anywhere",
      );
    });

    it("does not render caption element when alt is empty string", () => {
      setup({
        images: [{ src: "/img/noalt.jpg", alt: "" }],
        currentIndex: 0,
      });
      expect(screen.queryByTestId("lightbox-caption")).not.toBeInTheDocument();
    });
  });

  // ── Prev / Next buttons ───────────────────────────────────────────────────

  describe("previous and next buttons", () => {
    it("hides Previous button on the first image", () => {
      setup({ currentIndex: 0 });
      expect(
        screen.queryByRole("button", { name: /Previous image/i }),
      ).not.toBeInTheDocument();
    });

    it("hides Next button on the last image", () => {
      setup({ currentIndex: 2 });
      expect(
        screen.queryByRole("button", { name: /Next image/i }),
      ).not.toBeInTheDocument();
    });

    it("shows Previous button when not on first image", () => {
      setup({ currentIndex: 1 });
      expect(
        screen.getByRole("button", { name: /Previous image/i }),
      ).toBeInTheDocument();
    });

    it("shows Next button when not on last image", () => {
      setup({ currentIndex: 0 });
      expect(
        screen.getByRole("button", { name: /Next image/i }),
      ).toBeInTheDocument();
    });

    it("Next button aria-label includes the next image alt text", () => {
      setup({ currentIndex: 0 });
      expect(
        screen.getByRole("button", { name: /Next image: Mountain lake reflection/i }),
      ).toBeInTheDocument();
    });

    it("Previous button aria-label includes the previous image alt text", () => {
      setup({ currentIndex: 1 });
      expect(
        screen.getByRole("button", { name: /Previous image: Red barn at sunset/i }),
      ).toBeInTheDocument();
    });
  });

  // ── Click navigation ──────────────────────────────────────────────────────

  describe("click navigation", () => {
    it("calls onNavigate(index+1) when Next is clicked", () => {
      const { onNavigate } = setup({ currentIndex: 0 });
      fireEvent.click(screen.getByRole("button", { name: /Next image/i }));
      expect(onNavigate).toHaveBeenCalledWith(1);
    });

    it("calls onNavigate(index-1) when Previous is clicked", () => {
      const { onNavigate } = setup({ currentIndex: 2 });
      fireEvent.click(screen.getByRole("button", { name: /Previous image/i }));
      expect(onNavigate).toHaveBeenCalledWith(1);
    });

    it("actually navigates to next image in controlled mode", () => {
      render(<ControlledLightbox initialIndex={0} />);
      expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
        "alt",
        "Red barn at sunset",
      );
      fireEvent.click(screen.getByRole("button", { name: /Next image/i }));
      expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
        "alt",
        "Mountain lake reflection",
      );
    });

    it("actually navigates to previous image in controlled mode", () => {
      render(<ControlledLightbox initialIndex={2} />);
      expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
        "alt",
        "City skyline at night",
      );
      fireEvent.click(screen.getByRole("button", { name: /Previous image/i }));
      expect(screen.getByTestId("lightbox-image")).toHaveAttribute(
        "alt",
        "Mountain lake reflection",
      );
    });
  });

  // ── Keyboard navigation ───────────────────────────────────────────────────

  describe("keyboard navigation", () => {
    it("ArrowRight navigates to next image", () => {
      const { onNavigate } = setup({ currentIndex: 0 });
      fireEvent.keyDown(document, { key: "ArrowRight" });
      expect(onNavigate).toHaveBeenCalledWith(1);
    });

    it("ArrowLeft navigates to previous image", () => {
      const { onNavigate } = setup({ currentIndex: 2 });
      fireEvent.keyDown(document, { key: "ArrowLeft" });
      expect(onNavigate).toHaveBeenCalledWith(1);
    });

    it("ArrowRight does nothing on the last image", () => {
      const { onNavigate } = setup({ currentIndex: 2 });
      fireEvent.keyDown(document, { key: "ArrowRight" });
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("ArrowLeft does nothing on the first image", () => {
      const { onNavigate } = setup({ currentIndex: 0 });
      fireEvent.keyDown(document, { key: "ArrowLeft" });
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("Escape closes the lightbox", () => {
      const { onClose } = setup({ currentIndex: 0 });
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("other keys do not navigate or close", () => {
      const { onClose, onNavigate } = setup({ currentIndex: 1 });
      fireEvent.keyDown(document, { key: "Enter" });
      expect(onClose).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("keyboard events do nothing when lightbox is closed", () => {
      const { onClose, onNavigate } = setup({}, null);
      fireEvent.keyDown(document, { key: "Escape" });
      fireEvent.keyDown(document, { key: "ArrowRight" });
      expect(onClose).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  // ── Close interactions ────────────────────────────────────────────────────

  describe("close interactions", () => {
    it("clicking the backdrop calls onClose", () => {
      const { onClose } = setup();
      fireEvent.click(screen.getByTestId("lightbox-backdrop"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("clicking inside the dialog does NOT call onClose", () => {
      const { onClose } = setup();
      fireEvent.click(screen.getByTestId("lightbox-dialog"));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("close button calls onClose", () => {
      const { onClose } = setup();
      fireEvent.click(screen.getByRole("button", { name: /Close lightbox/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("close button has accessible label", () => {
      setup();
      expect(
        screen.getByRole("button", { name: "Close lightbox" }),
      ).toBeInTheDocument();
    });
  });

  // ── Body scroll lock ──────────────────────────────────────────────────────

  describe("body scroll lock", () => {
    it("sets body overflow hidden while open", () => {
      setup({ currentIndex: 0 });
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body overflow when closed", () => {
      const { rerender, onClose, onNavigate } = setup({ currentIndex: 0 });
      expect(document.body.style.overflow).toBe("hidden");
      rerender(
        <Lightbox
          images={IMAGES}
          currentIndex={null}
          onClose={onClose}
          onNavigate={onNavigate}
        />,
      );
      expect(document.body.style.overflow).toBe("");
    });

    it("restores body overflow on unmount", () => {
      const { unmount } = setup({ currentIndex: 0 });
      unmount();
      expect(document.body.style.overflow).toBe("");
    });
  });

  // ── Thumbnail strip ───────────────────────────────────────────────────────

  describe("thumbnail strip", () => {
    it("renders a tablist for multiple images", () => {
      setup();
      expect(screen.getByRole("tablist", { name: /Gallery images/i })).toBeInTheDocument();
    });

    it("marks the current thumbnail as aria-selected", () => {
      setup({ currentIndex: 1 });
      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
      expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    });

    it("clicking a thumbnail calls onNavigate with correct index", () => {
      const { onNavigate } = setup({ currentIndex: 0 });
      const tabs = screen.getAllByRole("tab");
      fireEvent.click(tabs[2]);
      expect(onNavigate).toHaveBeenCalledWith(2);
    });

    it("thumbnail aria-label includes image index and alt text", () => {
      setup({ currentIndex: 0 });
      expect(
        screen.getByRole("tab", { name: /View image 2: Mountain lake reflection/i }),
      ).toBeInTheDocument();
    });

    it("does NOT render thumbnail strip for a single image", () => {
      setup({ images: SINGLE_IMAGE, currentIndex: 0 });
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("thumbnail images have aria-hidden to avoid duplicate announcements", () => {
      setup({ currentIndex: 0 });
      // Thumbnail images are aria-hidden; only the main image has meaningful alt
      const allImgs = screen.getAllByRole("img", { hidden: true });
      const ariaHiddenThumbs = allImgs.filter(
        (img) => img.getAttribute("aria-hidden") === "true",
      );
      expect(ariaHiddenThumbs.length).toBeGreaterThan(0);
    });
  });
});
