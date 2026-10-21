"use client";

import { ROLE_COLOR_SCHEMES, ILLUSTRATION_TOKENS } from "./illustration-tokens";

export type EmptyBookingsSupplierProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
};

/**
 * EmptyBookingsSupplier Illustration
 *
 * Visual concept: Empty inbox/tray
 * Represents a supplier with no bookings received yet.
 *
 * Accessibility:
 * - role="img" for semantic meaning
 * - aria-label describes the illustration
 * - Uses CSS variables for light/dark mode support
 * - Color contrast ratio >= 4.5:1 (text), >= 3:1 (UI components)
 *
 * Responsive:
 * - Scalable via viewBox and CSS
 * - Default 240x200px, adjustable via props
 */
export function EmptyBookingsSupplier({
  width = 240,
  height = 200,
  className = "",
}: EmptyBookingsSupplierProps) {
  const colors = ROLE_COLOR_SCHEMES.supplier;

  return (
    <svg
      role="img"
      aria-label="Empty inbox tray - no bookings received yet"
      viewBox="0 0 240 200"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <defs>
        <linearGradient id="supplier-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={colors.accent}
            stopOpacity="0.05"
            className="dark:stop-color-[var(--illus-color-supplier-grad-start)]"
          />
          <stop
            offset="100%"
            stopColor={colors.accent}
            stopOpacity="0.02"
            className="dark:stop-color-[var(--illus-color-supplier-grad-end)]"
          />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect
        width="240"
        height="200"
        fill={ILLUSTRATION_TOKENS.SURFACE_LIGHT}
        className="dark:fill-[var(--illus-surface-dark)]"
        rx="12"
      />

      {/* Gradient overlay */}
      <rect
        width="240"
        height="200"
        fill="url(#supplier-gradient)"
        rx="12"
      />

      {/* Inbox tray base - main container */}
      <path
        d="M 50 70 L 50 130 Q 50 145 65 145 L 175 145 Q 190 145 190 130 L 190 70 Z"
        fill="none"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-supplier)]"
        strokeWidth="2"
      />

      {/* Tray side walls - left */}
      <path
        d="M 50 70 L 55 60 L 55 75"
        fill="none"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-supplier)]"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Tray side walls - right */}
      <path
        d="M 190 70 L 185 60 L 185 75"
        fill="none"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-supplier)]"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Tray front rim */}
      <path
        d="M 55 60 L 185 60"
        fill="none"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-supplier)]"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Vertical dividers in tray (suggested slots) */}
      <line
        x1="100"
        y1="75"
        x2="100"
        y2="140"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-supplier)]"
        strokeWidth="1"
        opacity="0.3"
        strokeDasharray="2,3"
      />

      <line
        x1="140"
        y1="75"
        x2="140"
        y2="140"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-supplier)]"
        strokeWidth="1"
        opacity="0.3"
        strokeDasharray="2,3"
      />

      {/* Horizontal guideline in tray */}
      <line
        x1="60"
        y1="105"
        x2="180"
        y2="105"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-supplier)]"
        strokeWidth="1"
        opacity="0.2"
        strokeDasharray="2,2"
      />

      {/* "No items" indicator - floating inside tray */}
      <g transform="translate(120, 100)">
        {/* Empty state icon - simple dash */}
        <line
          x1="-8"
          y1="0"
          x2="8"
          y2="0"
          stroke={colors.secondary}
          className="dark:stroke-[var(--illus-secondary-dark)]"
          strokeWidth="1.5"
          opacity="0.5"
          strokeLinecap="round"
        />
      </g>

      {/* Floating document/card indicators */}
      <g>
        {/* Document 1 - subtle */}
        <rect
          x="65"
          y="80"
          width="14"
          height="10"
          fill="none"
          stroke={colors.secondary}
          className="dark:stroke-[var(--illus-secondary-dark)]"
          strokeWidth="1"
          opacity="0.2"
          rx="1"
          transform="rotate(-15 72 85)"
        />

        {/* Document 2 - subtle */}
        <rect
          x="155"
          y="82"
          width="14"
          height="10"
          fill="none"
          stroke={colors.secondary}
          className="dark:stroke-[var(--illus-secondary-dark)]"
          strokeWidth="1"
          opacity="0.2"
          rx="1"
          transform="rotate(12 162 87)"
        />
      </g>

      {/* Emphasis circle around empty state */}
      <circle
        cx="120"
        cy="102"
        r="22"
        fill="none"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-supplier)]"
        strokeWidth="1"
        opacity="0.25"
        strokeDasharray="3,3"
      />
    </svg>
  );
}
