/**
 * Date utility helpers for calendar navigation and manipulation.
 */

/**
 * Adds (or subtracts) a specified number of months to a given date,
 * clamping the resulting day to the last day of the target month to prevent
 * month-overflowing (e.g. Jan 31 + 1 month -> Feb 28/29, Mar 31 - 1 month -> Feb 28/29).
 *
 * @param date - The initial date
 * @param count - The number of months to add (positive or negative)
 * @returns A new Date with months added and day clamped to the target month's end
 */
export function addMonths(date: Date, count: number): Date {
  const result = new Date(date.getTime());
  const originalDay = result.getDate();

  // Set the date to the 1st first to avoid month overflow during setMonth
  result.setDate(1);
  result.setMonth(result.getMonth() + count);

  // Find the maximum number of days in the new month
  // (Day 0 of month + 1 is the last day of month)
  const daysInTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  // Clamp the day to the last day of the target month if needed
  result.setDate(Math.min(originalDay, daysInTargetMonth));

  return result;
}
