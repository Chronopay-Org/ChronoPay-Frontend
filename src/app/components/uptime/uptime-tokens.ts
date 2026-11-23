/**
 * uptime-tokens.ts
 * Design tokens for the uptime bar chart component.
 *
 * Provides sequential color palette tokens for dark and light modes.
 * Color mapping:
 * - 100% uptime: success green
 * - 99-99.9% uptime: warning yellow
 * - 95-98.9% uptime: orange
 * - <95% uptime: error red
 * - No data: neutral gray
 *
 * Values are sourced from the typed design token source in src/design/tokens.ts.
 */

interface UptimeTokenGroup {
  success: string;
  warning: string;
  orange: string;
  error: string;
  none: string;
}

interface UptimeTokens {
  classes: UptimeTokenGroup;
  dark: UptimeTokenGroup;
  light: UptimeTokenGroup;
}

const uptimeTokens: UptimeTokens = {
  classes: {
    success: 'text-emerald-500',
    warning: 'text-amber-400',
    orange: 'text-orange-400',
    error: 'text-red-500',
    none: 'text-slate-400',
  },
  dark: {
    success: '#34d399',
    warning: '#fbbf24',
    orange: '#fb923c',
    error: '#f87171',
    none: '#9fb0c7',
  },
  light: {
    success: '#059669',
    warning: '#d97706',
    orange: '#ea580c',
    error: '#dc2626',
    none: '#64748b',
  },
};

/**
 * Get uptime color class based on percentage and mode
 * @param uptimePercent Uptime percentage (0-100)
 * @returns Tailwind class for the appropriate color
 */
export function getUptimeColorClass(uptimePercent: number): string {
  if (uptimePercent === 100) {
    return uptimeTokens.classes.success; // success green (100%)
  } else if (uptimePercent >= 99) {
    return uptimeTokens.classes.warning; // warning yellow (99-99.9%)
  } else if (uptimePercent >= 95) {
    return uptimeTokens.classes.orange; // orange (95-98.9%)
  } else {
    return uptimeTokens.classes.error; // error red (<95%)
  }
}

/**
 * Get uptime color for dark mode (CSS variable based)
 * Returns appropriate semantic color variable for dark theme
 */
export function getUptimeColorVarDark(uptimePercent: number): string {
  if (uptimePercent === 100) {
    return uptimeTokens.dark.success; // #34d399 - emerald-500
  } else if (uptimePercent >= 99) {
    return uptimeTokens.dark.warning; // amber-400 - warning
  } else if (uptimePercent >= 95) {
    return uptimeTokens.dark.orange; // orange-400
  } else {
    return uptimeTokens.dark.error; // #f87171 - red-500
  }
}

/**
 * Get uptime color for light mode (CSS variable based)
 * Returns appropriate semantic color variable for light theme
 */
export function getUptimeColorVarLight(uptimePercent: number): string {
  if (uptimePercent === 100) {
    return uptimeTokens.light.success; // emerald-600 - success
  } else if (uptimePercent >= 99) {
    return uptimeTokens.light.warning; // amber-600 - warning
  } else if (uptimePercent >= 95) {
    return uptimeTokens.light.orange; // orange-600
  } else {
    return uptimeTokens.light.error; // red-600 - error
  }
}

/**
 * Get incident indicator pattern/icon based on severity
 * Used to ensure color is not the only indicator
 */
export function getIncidentIndicator(severity: 'minor' | 'major' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return '●'; // filled circle
    case 'major':
      return '◆'; // diamond
    case 'minor':
      return '◇'; // open diamond
  }
}

/**
 * No data color class (neutral gray)
 */
export const UPTIME_NONE = uptimeTokens.classes.none;

/**
 * No data color CSS variable (dark mode)
 */
export const UPTIME_NONE_VAR_DARK = uptimeTokens.dark.none; // #9fb0c7

/**
 * No data color CSS variable (light mode)
 */
export const UPTIME_NONE_VAR_LIGHT = uptimeTokens.light.none;
