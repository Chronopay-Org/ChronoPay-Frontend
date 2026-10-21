"use client";

import React from "react";

/**
 * RTL script locales that require bidi isolation for embedded LTR content
 * (e.g. time strings, numeric dates) within RTL paragraph text.
 */
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

export function isRTL(locale: string): boolean {
  return RTL_LOCALES.has(locale.split("-")[0]);
}

/**
 * Unicode bidi isolate wrapper.
 *
 * Wraps content in LRI (\u2066) ... PDI (\u2069) so that a time string like
 * "14:00" embedded in Arabic text is rendered left-to-right without反转
 * the surrounding RTL paragraph direction.
 *
 * WCAG 1.3.2 / 1.3.3 — meaningful reading order in bidirectional text.
 */
export function BidiIsolate({
  children,
  locale,
  className,
  as: Tag = "span",
}: {
  children: React.ReactNode;
  locale?: string;
  className?: string;
  as?: React.ElementType;
}) {
  const needsIsolation = locale ? isRTL(locale) : false;

  if (!needsIsolation) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={className}
      dir="ltr"
      style={{ unicodeBidi: "isolate" }}
    >
      {children}
    </Tag>
  );
}

/**
 * Formats a date using the given locale, returning an object ready for
 * rendering inside a BidiIsolate wrapper.
 *
 * Uses Intl.DateTimeFormat for correct locale-aware ordering (e.g.
 * day-month-year in Arabic, month-day-year in en-US).
 */
export function formatDateParts(
  date: Date | number | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): { text: string; isRTL: boolean } {
  const d = new Date(date);
  const fmt = new Intl.DateTimeFormat(locale, options);
  return {
    text: fmt.format(d),
    isRTL: isRTL(locale),
  };
}

/**
 * Formats a time string using the given locale.
 * Always returns an object suitable for BidiIsolate rendering.
 */
export function formatTimeParts(
  date: Date | number | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): { text: string; isRTL: boolean } {
  const d = new Date(date);
  const fmt = new Intl.DateTimeFormat(locale, options);
  return {
    text: fmt.format(d),
    isRTL: isRTL(locale),
  };
}
