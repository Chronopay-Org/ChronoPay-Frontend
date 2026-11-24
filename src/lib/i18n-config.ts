export const SUPPORTED_LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "ar",
  "he",
  "hi",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const LOCALE_COOKIE_NAME = "locale";

export const LOCALE_DIR: Record<SupportedLocale, "ltr" | "rtl"> = {
  en: "ltr",
  es: "ltr",
  fr: "ltr",
  de: "ltr",
  ar: "rtl",
  he: "rtl",
  hi: "ltr",
};

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ar: "العربية",
  he: "עברית",
  hi: "हिन्दी",
};

export function isSupportedLocale(
  value: string | null | undefined,
): value is SupportedLocale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

export function resolveLocale(
  value: string | null | undefined,
): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}
