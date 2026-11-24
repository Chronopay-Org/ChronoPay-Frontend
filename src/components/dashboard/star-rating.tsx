import React, { useId } from "react";
import { Star } from "lucide-react";
import clsx from "clsx";

export interface StarRatingProps {
  /** The rating value, e.g. 4.5 */
  rating: number;
  /** Maximum number of stars, default is 5 */
  max?: number;
  /** Size of the stars in pixels, default is 16 */
  size?: number;
  className?: string;
  /** Custom aria-label for the rating. If not provided, defaults to "{rating} out of {max} stars" */
  ariaLabel?: string;
}

/**
 * StarRating
 *
 * Renders a row of stars representing a rating. Supports half-stars via an SVG linear gradient.
 *
 * Accessibility:
 * - Uses an aria-label with the numeric rating on a container div, not on decorative SVGs.
 * - SVGs have aria-hidden="true".
 */
export function StarRating({
  rating,
  max = 5,
  size = 16,
  className = "",
  ariaLabel,
}: StarRatingProps) {
  const gradientId = useId();

  return (
    <div
      className={clsx("flex items-center gap-0.5", className)}
      role="img"
      aria-label={ariaLabel ?? `${rating} out of ${max} stars`}
    >
      {/* Define the gradient once for the half-filled star */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {Array.from({ length: max }).map((_, i) => {
        const starNumber = i + 1;
        const isFull = rating >= starNumber;
        const isHalf = rating > starNumber - 1 && rating < starNumber;
        const isEmpty = rating <= starNumber - 1;

        if (isFull) {
          return (
            <Star
              key={i}
              size={size}
              className="fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
          );
        }

        if (isHalf) {
          return (
            <Star
              key={i}
              size={size}
              className="text-amber-400"
              style={{ fill: `url(#${gradientId})` }}
              aria-hidden="true"
            />
          );
        }

        return (
          <Star
            key={i}
            size={size}
            className="text-slate-600"
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
