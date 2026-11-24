/**
 * Illustration Design Tokens
 * 
 * Color tokens used across empty booking history illustrations.
 * Supports light and dark mode via CSS variables.
 * 
 * Source of truth: src/design/tokens.ts (illustration group).
 * This module re-exports the illustration tokens so existing consumers keep working.
 * 
 * Usage:
 * - In SVG fills/strokes: fill="var(--illus-primary-light)" className="dark:fill-[var(--illus-primary-dark)]"
 * - In Tailwind: className="fill-[var(--illus-primary-light)] dark:fill-[var(--illus-primary-dark)]"
 */

const illustrationTokens = {
  primaryLight: 'var(--illus-primary-light)',
  primaryDark: 'var(--illus-primary-dark)',
  secondaryLight: 'var(--illus-secondary-light)',
  secondaryDark: 'var(--illus-secondary-dark)',
  surfaceLight: 'var(--illus-surface-light)',
  surfaceDark: 'var(--illus-surface-dark)',
  textPrimaryLight: 'var(--illus-text-primary-light)',
  textPrimaryDark: 'var(--illus-text-primary-dark)',
  textSecondaryLight: 'var(--illus-text-secondary-light)',
  textSecondaryDark: 'var(--illus-text-secondary-dark)',
  borderLight: 'var(--illus-border-light)',
  borderDark: 'var(--illus-border-dark)',
  calendarAccentLight: 'var(--illus-calendar-accent-light)',
  calendarAccentDark: 'var(--illus-calendar-accent-dark)',
  inboxAccentLight: 'var(--illus-inbox-accent-light)',
  inboxAccentDark: 'var(--illus-inbox-accent-dark)',
  chartAccentLight: 'var(--illus-chart-accent-light)',
  chartAccentDark: 'var(--illus-chart-accent-dark)',
  accentMutedLight: 'var(--illus-accent-muted-light)',
  accentMutedDark: 'var(--illus-accent-muted-dark)',
} as const;

export const ILLUSTRATION_TOKENS = {
  PRIMARY_LIGHT: illustrationTokens.primaryLight,
  PRIMARY_DARK: illustrationTokens.primaryDark,
  SECONDARY_LIGHT: illustrationTokens.secondaryLight,
  SECONDARY_DARK: illustrationTokens.secondaryDark,
  SURFACE_LIGHT: illustrationTokens.surfaceLight,
  SURFACE_DARK: illustrationTokens.surfaceDark,
  TEXT_PRIMARY_LIGHT: illustrationTokens.textPrimaryLight,
  TEXT_PRIMARY_DARK: illustrationTokens.textPrimaryDark,
  TEXT_SECONDARY_LIGHT: illustrationTokens.textSecondaryLight,
  TEXT_SECONDARY_DARK: illustrationTokens.textSecondaryDark,
  BORDER_LIGHT: illustrationTokens.borderLight,
  BORDER_DARK: illustrationTokens.borderDark,
  CALENDAR_ACCENT_LIGHT: illustrationTokens.calendarAccentLight,
  CALENDAR_ACCENT_DARK: illustrationTokens.calendarAccentDark,
  INBOX_ACCENT_LIGHT: illustrationTokens.inboxAccentLight,
  INBOX_ACCENT_DARK: illustrationTokens.inboxAccentDark,
  CHART_ACCENT_LIGHT: illustrationTokens.chartAccentLight,
  CHART_ACCENT_DARK: illustrationTokens.chartAccentDark,
  ACCENT_MUTED_LIGHT: illustrationTokens.accentMutedLight,
  ACCENT_MUTED_DARK: illustrationTokens.accentMutedDark,
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
