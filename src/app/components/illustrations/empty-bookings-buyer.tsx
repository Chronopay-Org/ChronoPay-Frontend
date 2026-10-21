"use client";

import { ROLE_COLOR_SCHEMES, ILLUSTRATION_TOKENS } from "./illustration-tokens";

export type EmptyBookingsBuyerProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
};

/**
 * EmptyBookingsBuyer Illustration
 *
 * Visual concept: Calendar with empty time slots
 * Represents a buyer with no bookings made yet.
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
export function EmptyBookingsBuyer({
  width = 240,
  height = 200,
  className = "",
}: EmptyBookingsBuyerProps) {
  const colors = ROLE_COLOR_SCHEMES.buyer;

  return (
    <svg
      role="img"
      aria-label="Calendar with empty booking slots - no bookings made yet"
      viewBox="0 0 240 200"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background subtle grid */}
      <defs>
        <linearGradient id="buyer-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={colors.accent}
            stopOpacity="0.05"
            className="dark:stop-color-[var(--illus-color-buyer-grad-start)]"
          />
          <stop
            offset="100%"
            stopColor={colors.accent}
            stopOpacity="0.02"
            className="dark:stop-color-[var(--illus-color-buyer-grad-end)]"
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
        fill="url(#buyer-gradient)"
        rx="12"
      />

      {/* Calendar header bar */}
      <rect
        x="30"
        y="35"
        width="180"
        height="12"
        fill={colors.accent}
        className="dark:fill-[var(--illus-accent-dark-buyer)]"
        rx="6"
        opacity="0.15"
      />

      {/* Calendar title (month indicator) */}
      <text
        x="120"
        y="52"
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill={ILLUSTRATION_TOKENS.TEXT_PRIMARY_LIGHT}
        className="dark:fill-[var(--illus-text-primary-dark)]"
      >
        July 2026
      </text>

      {/* Calendar grid - left column of days */}
      <g>
        {[0, 1, 2].map((row) => (
          <g key={`col-0-${row}`}>
            {/* Day number */}
            <text
              x="50"
              y={65 + row * 35}
              fontSize="10"
              fontWeight="500"
              fill={ILLUSTRATION_TOKENS.TEXT_SECONDARY_LIGHT}
              className="dark:fill-[var(--illus-text-secondary-dark)]"
              opacity="0.6"
            >
              {15 + row}
            </text>

            {/* Empty slot indicator */}
            <rect
              x="38"
              y={70 + row * 35}
              width="24"
              height="20"
              fill="none"
              stroke={colors.accent}
              className="dark:stroke-[var(--illus-accent-dark-buyer)]"
              strokeWidth="1.5"
              strokeDasharray="2,2"
              rx="3"
              opacity="0.4"
            />
          </g>
        ))}
      </g>

      {/* Calendar grid - right column of days */}
      <g>
        {[0, 1, 2].map((row) => (
          <g key={`col-1-${row}`}>
            {/* Day number */}
            <text
              x="140"
              y={65 + row * 35}
              fontSize="10"
              fontWeight="500"
              fill={ILLUSTRATION_TOKENS.TEXT_SECONDARY_LIGHT}
              className="dark:fill-[var(--illus-text-secondary-dark)]"
              opacity="0.6"
            >
              {18 + row}
            </text>

            {/* Empty slot indicator */}
            <rect
              x="128"
              y={70 + row * 35}
              width="24"
              height="20"
              fill="none"
              stroke={colors.accent}
              className="dark:stroke-[var(--illus-accent-dark-buyer)]"
              strokeWidth="1.5"
              strokeDasharray="2,2"
              rx="3"
              opacity="0.4"
            />
          </g>
        ))}
      </g>

      {/* Clock icon (time element) */}
      <g transform="translate(180, 155)">
        {/* Clock circle */}
        <circle
          cx="0"
          cy="0"
          r="12"
          fill="none"
          stroke={colors.secondary}
          className="dark:stroke-[var(--illus-secondary-dark)]"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Hour hand */}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="-6"
          stroke={colors.secondary}
          className="dark:stroke-[var(--illus-secondary-dark)]"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Minute hand */}
        <line
          x1="0"
          y1="0"
          x2="5"
          y2="4"
          stroke={colors.secondary}
          className="dark:stroke-[var(--illus-secondary-dark)]"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      </g>

      {/* Connecting line from calendar to clock */}
      <path
        d="M 152 135 Q 165 145 172 152"
        fill="none"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-buyer)]"
        strokeWidth="1"
        opacity="0.3"
        strokeDasharray="2,2"
      />
    </svg>
  );
}
