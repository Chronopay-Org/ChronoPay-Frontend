export function formatNumber(value: number, locale = 'en-US', options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(value: number, currency: string, locale = 'en-US', options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
}

export function formatDate(date: Date | number | string, locale = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * RTL-aware date label (e.g. "Tue, Apr 1" → Arabic locale ordering).
 * Uses the locale's natural date ordering via Intl.DateTimeFormat.
 */
export function formatDateLabel(date: Date | number | string, locale = 'en-US'): string {
  return formatDate(date, locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * RTL-aware time range string (e.g. "10:00 – 11:30").
 * Formats start and end times separately so each is locale-correct,
 * then joins them with an en-dash that renders properly in both
 * LTR and RTL contexts.
 */
export function formatTimeRange(
  start: Date | number | string,
  end: Date | number | string,
  locale = 'en-US'
): string {
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
  const startTime = formatDate(start, locale, opts);
  const endTime = formatDate(end, locale, opts);
  return `${startTime} – ${endTime}`;
}

/**
 * Returns the text-direction attribute value for a given locale.
 */
export function getDir(locale: string): 'ltr' | 'rtl' {
  const lang = locale.split('-')[0];
  return lang === 'ar' || lang === 'he' || lang === 'fa' || lang === 'ur' ? 'rtl' : 'ltr';
}
