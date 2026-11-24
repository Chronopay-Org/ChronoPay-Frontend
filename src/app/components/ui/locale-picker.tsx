"use client";

import {
  LOCALE_COOKIE_NAME,
  LOCALE_DIR,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  useLocale,
  useMessages,
} from "@/lib/i18n";

export default function LocalePicker() {
  const { locale, setLocale } = useLocale();
  const t = useMessages();

  function changeLocale(value: string) {
    if (!isSupportedLocale(value)) return;

    setLocale(value);

    if (typeof document !== "undefined") {
      document.documentElement.lang = value;
      document.documentElement.dir = LOCALE_DIR[value];
      document.cookie = `${LOCALE_COOKIE_NAME}=${value}; path=/; max-age=31536000; samesite=lax`;
    }
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">{t("common.language")}</span>

      <select
        aria-label={t("localePicker.label")}
        value={locale}
        onChange={(e) => changeLocale(e.target.value)}
        className="rounded-full border px-3 py-1.5 text-sm transition hover:bg-slate-500/10"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border-subtle)",
          color: "var(--foreground)",
        }}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
