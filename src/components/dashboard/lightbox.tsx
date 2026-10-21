"use client";

/**
 * Lightbox
 *
 * An accessible, keyboard-navigable overlay for viewing enlarged portfolio
 * images with alt-text-driven captions.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - role="dialog" with aria-label and aria-modal
 *   - Focus trap: all interactive elements cycle within the overlay (FocusTrap)
 *   - Focus returns to the triggering thumbnail on close
 *   - Esc closes the dialog
 *   - ArrowRight / ArrowLeft navigate between images
 *   - Backdrop click closes the dialog
 *   - alt text surfaced as visible caption beneath the image
 *   - Previous/next buttons carry aria-label describing target image
 *   - Image has role="img" with the alt text (not aria-hidden)
 *   - Respects prefers-reduced-motion
 *   - Works in RTL layouts (Previous/Next swap their meanings via dir)
 */

import {
  useEffect,
  useCallback,
  useId,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { FocusTrap } from "@/components/common/FocusTrap";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LightboxImage {
  /** URL of the full-resolution (or largest available) image. */
  src: string;
  /** Descriptive alt text; also rendered as a caption below the image. */
  alt: string;
  /** Optional thumbnail URL for the grid (falls back to `src`). */
  thumbSrc?: string;
}

export interface LightboxProps {
  /** All images in the gallery. */
  images: LightboxImage[];
  /** Index of the currently open image. Pass `null` to close. */
  currentIndex: number | null;
  /** Called when the lightbox should close (Esc, backdrop click, close btn). */
  onClose: () => void;
  /** Called when navigation changes the active image. */
  onNavigate: (index: number) => void;
  /** Additional class names on the backdrop element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Lightbox overlay.  Mount/unmount is controlled by the parent via
 * `currentIndex` — pass `null` to unmount.
 *
 * ```tsx
 * const [open, setOpen] = useState<number | null>(null);
 * <Lightbox
 *   images={items}
 *   currentIndex={open}
 *   onClose={() => setOpen(null)}
 *   onNavigate={setOpen}
 * />
 * ```
 */
export function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  className,
}: LightboxProps) {
  const dialogId = useId();
  const titleId = `${dialogId}-title`;

  const isOpen = currentIndex !== null;
  const image = isOpen ? images[currentIndex] : null;
  const hasPrev = isOpen && currentIndex > 0;
  const hasNext = isOpen && currentIndex < images.length - 1;

  // Global keyboard handler: Esc + arrow keys
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        if (hasNext) onNavigate(currentIndex! + 1);
      } else if (e.key === "ArrowLeft") {
        if (hasPrev) onNavigate(currentIndex! - 1);
      }
    },
    [isOpen, onClose, onNavigate, currentIndex, hasPrev, hasNext],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !image) return null;

  const prevImage = hasPrev ? images[currentIndex! - 1] : null;
  const nextImage = hasNext ? images[currentIndex! + 1] : null;

  return (
    // Portal-style backdrop — renders in the normal DOM tree; z-index ensures
    // it covers everything.
    <div
      data-testid="lightbox-backdrop"
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-slate-950/90 backdrop-blur-sm",
        // Reduced-motion: skip the fade animation
        "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150",
        className,
      )}
      onClick={onClose}
      aria-hidden={false}
    >
      {/* FocusTrap wraps the entire dialog so Tab cycles within it */}
      <FocusTrap>
        {/* Stop propagation so clicks inside do NOT close the dialog */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id={dialogId}
          data-testid="lightbox-dialog"
          className={clsx(
            "relative flex max-h-[92dvh] w-full max-w-5xl flex-col",
            "mx-4 rounded-[28px] border border-white/10 bg-slate-900 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)]",
            "overflow-hidden",
          )}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
            // Keep arrow-key navigation working even if focus is inside the
            // dialog box rather than the backdrop.
            if (e.key === "ArrowRight" && hasNext) {
              onNavigate(currentIndex! + 1);
            } else if (e.key === "ArrowLeft" && hasPrev) {
              onNavigate(currentIndex! - 1);
            }
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
            {/* Visually hidden title (screen reader landmark) */}
            <p
              id={titleId}
              className="text-sm font-medium text-slate-300 sm:text-base"
            >
              {/* Counter: "Image 2 of 5" */}
              <span className="sr-only">Lightbox — </span>
              Image {currentIndex! + 1} of {images.length}
            </p>

            {/* Close button */}
            <button
              type="button"
              aria-label="Close lightbox"
              onClick={onClose}
              className={clsx(
                "inline-flex h-8 w-8 items-center justify-center rounded-full",
                "text-slate-400 transition-colors hover:bg-white/10 hover:text-white",
                "focus:outline-none focus-ring-cyan",
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* ── Image area ─────────────────────────────────────────────── */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center bg-slate-950/60 p-4 sm:p-6">
            {/* Previous button */}
            {hasPrev && (
              <button
                type="button"
                aria-label={`Previous image: ${prevImage?.alt ?? ""}`}
                onClick={() => onNavigate(currentIndex! - 1)}
                className={clsx(
                  "absolute start-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full",
                  "border border-white/10 bg-slate-900/80 text-slate-300 backdrop-blur-sm",
                  "transition-colors hover:border-cyan-300/40 hover:bg-slate-800 hover:text-white",
                  "focus:outline-none focus-ring-cyan",
                  "sm:start-4",
                )}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              data-testid="lightbox-image"
              className={clsx(
                "max-h-[60dvh] w-auto max-w-full rounded-xl object-contain",
                "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200",
              )}
            />

            {/* Next button */}
            {hasNext && (
              <button
                type="button"
                aria-label={`Next image: ${nextImage?.alt ?? ""}`}
                onClick={() => onNavigate(currentIndex! + 1)}
                className={clsx(
                  "absolute end-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full",
                  "border border-white/10 bg-slate-900/80 text-slate-300 backdrop-blur-sm",
                  "transition-colors hover:border-cyan-300/40 hover:bg-slate-800 hover:text-white",
                  "focus:outline-none focus-ring-cyan",
                  "sm:end-4",
                )}
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* ── Caption ────────────────────────────────────────────────── */}
          {image.alt && (
            <div
              className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-5"
              data-testid="lightbox-caption"
            >
              <p
                className="text-sm leading-6 text-slate-300"
                style={{ overflowWrap: "anywhere" }}
              >
                {image.alt}
              </p>
            </div>
          )}

          {/* ── Thumbnail strip ────────────────────────────────────────── */}
          {images.length > 1 && (
            <div
              role="tablist"
              aria-label="Gallery images"
              className="flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 scrollbar-none sm:px-5"
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentIndex}
                  aria-label={`View image ${idx + 1}: ${img.alt}`}
                  onClick={() => onNavigate(idx)}
                  className={clsx(
                    "inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                    "focus:outline-none focus-ring-cyan",
                    idx === currentIndex
                      ? "border-cyan-300"
                      : "border-white/10 hover:border-white/30",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbSrc ?? img.src}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </FocusTrap>
    </div>
  );
}
