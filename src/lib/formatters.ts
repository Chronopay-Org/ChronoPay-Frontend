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
