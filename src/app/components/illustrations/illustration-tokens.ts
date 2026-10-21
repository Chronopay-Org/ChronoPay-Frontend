/**
 * Illustration Design Tokens
 * 
 * Color tokens used across empty booking history illustrations.
 * Supports light and dark mode via CSS variables.
 * 
 * Usage:
 * - In SVG fills/strokes: fill="var(--illus-primary-light)" className="dark:fill-[var(--illus-primary-dark)]"
 * - In Tailwind: className="fill-[var(--illus-primary-light)] dark:fill-[var(--illus-primary-dark)]"
 */

export const ILLUSTRATION_TOKENS = {
  // Primary accent colors (cyan/teal family)
  PRIMARY_LIGHT: '#0891b2',
  PRIMARY_DARK: '#67e8f9',
  
  // Secondary accent colors (amber/orange family)
  SECONDARY_LIGHT: '#d97706',
  SECONDARY_DARK: '#f59e0b',
  
  // Surface/fill colors
  SURFACE_LIGHT: '#f0f5fb',
  SURFACE_DARK: '#0f172a',
  
  // Text colors
  TEXT_PRIMARY_LIGHT: '#0a1628',
  TEXT_PRIMARY_DARK: '#f4f7fb',
  TEXT_SECONDARY_LIGHT: '#4a6080',
  TEXT_SECONDARY_DARK: '#cbd5e1',
  
  // Border colors
  BORDER_LIGHT: '#cbd5e1',
  BORDER_DARK: '#334155',
  
  // Component-specific colors
  CALENDAR_ACCENT_LIGHT: '#06b6d4',
  CALENDAR_ACCENT_DARK: '#22d3ee',
  
  INBOX_ACCENT_LIGHT: '#0ea5e9',
  INBOX_ACCENT_DARK: '#38bdf8',
  
  CHART_ACCENT_LIGHT: '#8b5cf6',
  CHART_ACCENT_DARK: '#a78bfa',
  
  // Opacity/muted versions
  ACCENT_MUTED_LIGHT: 'rgba(8, 145, 178, 0.2)',
  ACCENT_MUTED_DARK: 'rgba(103, 232, 249, 0.2)',
} as const;

/**
 * CSS variable names for use in style attributes
 */
export const ILLUSTRATION_CSS_VARS = {
  PRIMARY_LIGHT: 'var(--illus-primary-light)',
  PRIMARY_DARK: 'var(--illus-primary-dark)',
  SECONDARY_LIGHT: 'var(--illus-secondary-light)',
  SECONDARY_DARK: 'var(--illus-secondary-dark)',
  SURFACE_LIGHT: 'var(--illus-surface-light)',
  SURFACE_DARK: 'var(--illus-surface-dark)',
  TEXT_PRIMARY_LIGHT: 'var(--illus-text-primary-light)',
  TEXT_PRIMARY_DARK: 'var(--illus-text-primary-dark)',
  BORDER_LIGHT: 'var(--illus-border-light)',
  BORDER_DARK: 'var(--illus-border-dark)',
} as const;

/**
 * Role-specific color schemes for consistency
 */
export const ROLE_COLOR_SCHEMES = {
  buyer: {
    accent: ILLUSTRATION_TOKENS.CALENDAR_ACCENT_LIGHT,
    accentDark: ILLUSTRATION_TOKENS.CALENDAR_ACCENT_DARK,
    secondary: ILLUSTRATION_TOKENS.SECONDARY_LIGHT,
    secondaryDark: ILLUSTRATION_TOKENS.SECONDARY_DARK,
  },
  supplier: {
    accent: ILLUSTRATION_TOKENS.INBOX_ACCENT_LIGHT,
    accentDark: ILLUSTRATION_TOKENS.INBOX_ACCENT_DARK,
    secondary: ILLUSTRATION_TOKENS.PRIMARY_LIGHT,
    secondaryDark: ILLUSTRATION_TOKENS.PRIMARY_DARK,
  },
  admin: {
    accent: ILLUSTRATION_TOKENS.CHART_ACCENT_LIGHT,
    accentDark: ILLUSTRATION_TOKENS.CHART_ACCENT_DARK,
    secondary: ILLUSTRATION_TOKENS.PRIMARY_LIGHT,
    secondaryDark: ILLUSTRATION_TOKENS.PRIMARY_DARK,
  },
} as const;
