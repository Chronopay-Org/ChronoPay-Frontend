/**
 * Timezone utility helpers for ChronoPay calendar view.
 */

export type TimezoneMode = "viewer" | "supplier";

export interface TimezoneInfo {
  timeZone: string;
  offsetFormatted: string;
  offsetMinutes: number;
}

/**
 * Detects the user viewer timezone using the browser Intl API.
 */
export function getViewerTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Calculates current UTC offset in minutes for a given timezone and date.
 */
export function getTimezoneOffsetMinutes(timeZone: string, date = new Date()): number {
  try {
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  } catch {
    return 0;
  }
}

/**
 * Formats offset minutes into standard UTC string representation (e.g. "UTC+5:30", "UTC-5").
 */
export function formatUTCOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;

  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `UTC${sign}${hours}:${paddedMinutes}`;
}

/**
 * Calculates the offset difference string between viewer timezone and supplier timezone.
 * Returns formatted text like "+3 hrs ahead", "-5 hrs behind", "Same time", or "+5.5 hrs ahead".
 */
export function getOffsetDeltaText(
  viewerTimeZone: string,
  supplierTimeZone: string,
  date = new Date()
): string {
  const viewerOffset = getTimezoneOffsetMinutes(viewerTimeZone, date);
  const supplierOffset = getTimezoneOffsetMinutes(supplierTimeZone, date);
  const deltaMinutes = supplierOffset - viewerOffset;

  if (deltaMinutes === 0) {
    return "Same time";
  }

  const deltaHours = Math.abs(deltaMinutes) / 60;
  const direction = deltaMinutes > 0 ? "ahead" : "behind";
  const formattedHours = Number.isInteger(deltaHours)
    ? deltaHours.toString()
    : deltaHours.toFixed(1);

  const unit = deltaHours === 1 ? "hr" : "hrs";
  return `${formattedHours} ${unit} ${direction}`;
}

/**
 * Returns localStorage key for persisting timezone mode per supplier profile.
 */
export function getStorageKey(supplierId: string): string {
  return `chronopay_tz_pref_${supplierId}`;
}

/**
 * Loads stored timezone preference from localStorage.
 */
export function getStoredTimezoneMode(supplierId: string): TimezoneMode | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(getStorageKey(supplierId));
    return val === "viewer" || val === "supplier" ? val : null;
  } catch {
    return null;
  }
}

/**
 * Persists selected timezone preference to localStorage.
 */
export function setStoredTimezoneMode(supplierId: string, mode: TimezoneMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(supplierId), mode);
  } catch {
    // Fail silently if localStorage is disabled/restricted
  }
}
