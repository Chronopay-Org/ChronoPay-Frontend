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
 */

/**
 * Get uptime color class based on percentage and mode
 * @param uptimePercent Uptime percentage (0-100)
 * @returns Tailwind class for the appropriate color
 */
export function getUptimeColorClass(uptimePercent: number): string {
  if (uptimePercent === 100) {
    return 'bg-emerald-500'; // success green (100%)
  } else if (uptimePercent >= 99) {
    return 'bg-amber-400'; // warning yellow (99-99.9%)
  } else if (uptimePercent >= 95) {
    return 'bg-orange-400'; // orange (95-98.9%)
  } else {
    return 'bg-red-500'; // error red (<95%)
  }
}

/**
 * Get uptime color for dark mode (CSS variable based)
 * Returns appropriate semantic color variable for dark theme
 */
export function getUptimeColorVarDark(uptimePercent: number): string {
  if (uptimePercent === 100) {
    return 'var(--success)'; // #34d399 - emerald-500
  } else if (uptimePercent >= 99) {
    return '#fbbf24'; // amber-400 - warning
  } else if (uptimePercent >= 95) {
    return '#fb923c'; // orange-400
  } else {
    return 'var(--danger)'; // #f87171 - red-500
  }
}

/**
 * Get uptime color for light mode (CSS variable based)
 * Returns appropriate semantic color variable for light theme
 */
export function getUptimeColorVarLight(uptimePercent: number): string {
  if (uptimePercent === 100) {
    return '#059669'; // emerald-600 - success
  } else if (uptimePercent >= 99) {
    return '#d97706'; // amber-600 - warning
  } else if (uptimePercent >= 95) {
    return '#ea580c'; // orange-600
  } else {
    return '#dc2626'; // red-600 - error
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
export const UPTIME_NONE = 'bg-slate-500';

/**
 * No data color CSS variable (dark mode)
 */
export const UPTIME_NONE_VAR_DARK = 'var(--muted)'; // #9fb0c7

/**
 * No data color CSS variable (light mode)
 */
export const UPTIME_NONE_VAR_LIGHT = '#4a6080';
