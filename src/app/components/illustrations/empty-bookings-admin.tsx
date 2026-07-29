"use client";

import { ROLE_COLOR_SCHEMES, ILLUSTRATION_TOKENS } from "./illustration-tokens";

export type EmptyBookingsAdminProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
};

/**
 * EmptyBookingsAdmin Illustration
 *
 * Visual concept: Dashboard/chart with empty data
 * Represents an admin with no booking activity to review.
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
export function EmptyBookingsAdmin({
  width = 240,
  height = 200,
  className = "",
}: EmptyBookingsAdminProps) {
  const colors = ROLE_COLOR_SCHEMES.admin;

  return (
    <svg
      role="img"
      aria-label="Dashboard chart with empty data - no booking activity to display"
      viewBox="0 0 240 200"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <defs>
        <linearGradient id="admin-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={colors.accent}
            stopOpacity="0.05"
            className="dark:stop-color-[var(--illus-color-admin-grad-start)]"
          />
          <stop
            offset="100%"
            stopColor={colors.accent}
            stopOpacity="0.02"
            className="dark:stop-color-[var(--illus-color-admin-grad-end)]"
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
        fill="url(#admin-gradient)"
        rx="12"
      />

      {/* Dashboard panel/card */}
      <rect
        x="30"
        y="35"
        width="180"
        height="130"
        fill="none"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-admin)]"
        strokeWidth="1.5"
        rx="8"
        opacity="0.6"
      />

      {/* Chart header area */}
      <rect
        x="30"
        y="35"
        width="180"
        height="20"
        fill={colors.accent}
        className="dark:fill-[var(--illus-accent-dark-admin)]"
        opacity="0.1"
        rx="7"
      />

      {/* Chart title text */}
      <text
        x="40"
        y="50"
        fontSize="10"
        fontWeight="600"
        fill={ILLUSTRATION_TOKENS.TEXT_SECONDARY_LIGHT}
        className="dark:fill-[var(--illus-text-secondary-dark)]"
        opacity="0.7"
      >
        Bookings Overview
      </text>

      {/* Chart grid area */}
      <g>
        {/* Y-axis labels (left side) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={`y-label-${i}`}>
            <text
              x="35"
              y={130 - i * 18}
              fontSize="8"
              fill={ILLUSTRATION_TOKENS.TEXT_SECONDARY_LIGHT}
              className="dark:fill-[var(--illus-text-secondary-dark)]"
              opacity="0.4"
              textAnchor="end"
            >
              {(i * 25).toString()}
            </text>
          </g>
        ))}

        {/* Horizontal grid lines (subtle) */}
        {[1, 2, 3, 4].map((i) => (
          <line
            key={`grid-line-${i}`}
            x1="45"
            y1={130 - i * 18}
            x2="200"
            y2={130 - i * 18}
            stroke={colors.accent}
            className="dark:stroke-[var(--illus-accent-dark-admin)]"
            strokeWidth="0.5"
            opacity="0.15"
            strokeDasharray="2,2"
          />
        ))}
      </g>

      {/* X-axis line */}
      <line
        x1="45"
        y1="130"
        x2="200"
        y2="130"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-admin)]"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Y-axis line */}
      <line
        x1="45"
        y1="60"
        x2="45"
        y2="130"
        stroke={colors.accent}
        className="dark:stroke-[var(--illus-accent-dark-admin)]"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Empty column placeholders - showing baseline only */}
      <g>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={`column-${i}`}>
            {/* Column outline */}
            <rect
              x={55 + i * 27}
              y="128"
              width="18"
              height="4"
              fill="none"
              stroke={colors.secondary}
              className="dark:stroke-[var(--illus-secondary-dark)]"
              strokeWidth="1"
              opacity="0.3"
              rx="1"
            />

            {/* Baseline indicator */}
            <line
              x1={55 + i * 27}
              y1="130"
              x2={73 + i * 27}
              y2="130"
              stroke={colors.secondary}
              className="dark:stroke-[var(--illus-secondary-dark)]"
              strokeWidth="1.5"
              opacity="0.5"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>

      {/* "No data" indicator - floating text and icon */}
      <g transform="translate(120, 85)">
        {/* Circle with dash - universal empty state */}
        <circle
          cx="0"
          cy="0"
          r="10"
          fill="none"
          stroke={colors.secondary}
          className="dark:stroke-[var(--illus-secondary-dark)]"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <line
          x1="-5"
          y1="0"
          x2="5"
          y2="0"
          stroke={colors.secondary}
          className="dark:stroke-[var(--illus-secondary-dark)]"
          strokeWidth="1"
          opacity="0.4"
          strokeLinecap="round"
        />
      </g>

      {/* Legend area - empty */}
      <g transform="translate(50, 155)">
        {/* Legend item 1 */}
        <rect
          x="0"
          y="0"
          width="6"
          height="6"
          fill="none"
          stroke={colors.accent}
          className="dark:stroke-[var(--illus-accent-dark-admin)]"
          strokeWidth="1"
          opacity="0.3"
          rx="1"
        />
        <text
          x="12"
          y="5"
          fontSize="8"
          fill={ILLUSTRATION_TOKENS.TEXT_SECONDARY_LIGHT}
          className="dark:fill-[var(--illus-text-secondary-dark)]"
          opacity="0.4"
        >
          Pending
        </text>

        {/* Legend item 2 */}
        <rect
          x="80"
          y="0"
          width="6"
          height="6"
          fill="none"
          stroke={colors.secondary}
          className="dark:stroke-[var(--illus-secondary-dark)]"
          strokeWidth="1"
          opacity="0.3"
          rx="1"
        />
        <text
          x="92"
          y="5"
          fontSize="8"
          fill={ILLUSTRATION_TOKENS.TEXT_SECONDARY_LIGHT}
          className="dark:fill-[var(--illus-text-secondary-dark)]"
          opacity="0.4"
        >
          Completed
        </text>
      </g>
    </svg>
  );
}
