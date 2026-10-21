"use client";

/**
 * PortfolioGallery
 *
 * A responsive masonry-style grid of portfolio images for the supplier profile,
 * with an accessible lightbox for enlarged viewing.
 *
 * Design system conventions:
 *   - Uses PanelShell for chrome (matching all other dashboard panels)
 *   - Aspect-aware cells: 16/9 by default, overridable per image
 *   - Dark background, rounded-[28px] panel, cyan focus rings
 *   - Empty and loading states as first-class layout states
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Thumbnail buttons have aria-label describing which image opens
 *   - aria-haspopup="dialog" signals that clicking opens a dialog
 *   - Lightbox is role="dialog" aria-modal with focus trap (see Lightbox)
 *   - Grid is labelled via region / aria-labelledby from PanelShell
 *   - Keyboard: Enter/Space on thumbnail opens lightbox
 *   - Visible focus rings (focus-ring-cyan)
 *
 * Responsive layout:
 *   - 2 columns on mobile, 3 on sm, 4 on lg
 *   - Cells use aspect-ratio: 16/9 by default; tall images crop without overflow
 *   - RTL supported via logical properties (start/end)
 */

import { useState, useId } from "react";
import clsx from "clsx";
import { ImageOff } from "lucide-react";
import { PanelShell } from "./panel-shell";
import { Lightbox, type LightboxImage } from "./lightbox";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { LightboxImage };

export interface PortfolioGalleryProps {
  /** Array of images to display. */
  images: LightboxImage[];
  /** Panel title (passed to PanelShell). */
  title?: string;
  /** Panel eyebrow label (passed to PanelShell). */
  eyebrow?: string;
  /** Panel description (passed to PanelShell). */
  description?: string;
  /** Maximum images to display in the grid (rest are hidden). Defaults to 12. */
  maxVisible?: number;
  /** Additional class names on the outer PanelShell section. */
  className?: string;
  /**
   * When `true`, skips PanelShell chrome and renders only the grid.
   * Useful when embedding inside an existing panel.
   */
  bare?: boolean;
  /**
   * Aspect ratio CSS value for each cell, e.g. "16 / 9" or "1 / 1".
   * Defaults to "16 / 9".
   */
  cellAspectRatio?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PortfolioGallery — responsive image grid with accessible lightbox.
 *
 * ```tsx
 * import { PortfolioGallery } from "@/components/dashboard";
 *
 * <PortfolioGallery
 *   images={supplier.portfolio}
 *   eyebrow="Portfolio"
 *   title="Work samples"
 *   description="Browse the supplier's recent projects."
 * />
 * ```
 */
export function PortfolioGallery({
  images,
  title = "Portfolio",
  eyebrow = "Gallery",
  description,
  maxVisible = 12,
  className,
  bare = false,
  cellAspectRatio = "16 / 9",
}: PortfolioGalleryProps) {
  const baseId = useId();
  const gridId = `${baseId}-grid`;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visible = images.slice(0, maxVisible);
  const hiddenCount = Math.max(0, images.length - maxVisible);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const grid = (
    <>
      {images.length === 0 ? (
        // Empty state
        <div
          data-testid="portfolio-empty"
          className="flex flex-col items-center justify-center gap-3 py-12 text-center"
          aria-live="polite"
        >
          <ImageOff className="h-8 w-8 text-slate-600" aria-hidden="true" />
          <p className="helper-text helper-text--muted">
            No portfolio images yet.
          </p>
        </div>
      ) : (
        <div
          id={gridId}
          data-testid="portfolio-grid"
          className={clsx(
            "grid gap-2 sm:gap-3",
            "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          )}
        >
          {visible.map((img, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Open image ${idx + 1}: ${img.alt}`}
              aria-haspopup="dialog"
              onClick={() => openLightbox(idx)}
              data-testid={`portfolio-thumb-${idx}`}
              className={clsx(
                "group relative w-full overflow-hidden rounded-xl border border-white/10",
                "bg-slate-900 transition-colors",
                "hover:border-cyan-300/40 hover:bg-slate-800",
                "active:border-cyan-300/60 active:bg-slate-700",
                "focus:outline-none focus-ring-cyan",
              )}
              style={{ aspectRatio: cellAspectRatio }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbSrc ?? img.src}
                alt={img.alt}
                loading="lazy"
                className={clsx(
                  "h-full w-full object-cover",
                  "transition-transform duration-300 motion-safe:group-hover:scale-105",
                )}
              />

              {/* Hover overlay — hints that click opens a larger view */}
              <div
                className={clsx(
                  "absolute inset-0 flex items-center justify-center",
                  "bg-slate-950/0 transition-colors duration-200",
                  "group-hover:bg-slate-950/30 group-active:bg-slate-950/50",
                )}
                aria-hidden="true"
              />
            </button>
          ))}

          {/* "+N more" overflow cell */}
          {hiddenCount > 0 && (
            <button
              type="button"
              aria-label={`Open lightbox to view ${hiddenCount} more image${hiddenCount !== 1 ? "s" : ""}`}
              aria-haspopup="dialog"
              onClick={() => openLightbox(maxVisible - 1)}
              data-testid="portfolio-overflow"
              className={clsx(
                "group relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/10",
                "bg-slate-900 transition-colors",
                "hover:border-cyan-300/40 hover:bg-slate-800",
                "active:border-cyan-300/60",
                "focus:outline-none focus-ring-cyan",
              )}
              style={{ aspectRatio: cellAspectRatio }}
            >
              {/* Blurred thumbnail of the next hidden image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[maxVisible]?.thumbSrc ?? images[maxVisible]?.src}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-30 blur-sm"
              />
              <span
                className="relative text-lg font-semibold text-white"
                aria-hidden="true"
              >
                +{hiddenCount}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        images={images}
        currentIndex={lightboxIndex}
        onClose={closeLightbox}
        onNavigate={setLightboxIndex}
      />
    </>
  );

  if (bare) {
    return <div className={className}>{grid}</div>;
  }

  return (
    <div className={className}>
      <PanelShell
        eyebrow={eyebrow}
        title={title}
        description={description}
        id={`${baseId}-panel`}
      >
        {grid}
      </PanelShell>
    </div>
  );
}
