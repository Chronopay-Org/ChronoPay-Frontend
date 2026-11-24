"use client";

import { useEffect, useState } from "react";

const locales = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "he", label: "עברית", dir: "rtl" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
];

export default function LocalePicker() {
  const [locale, setLocale] = useState(() => {
    try {
      const saved = document.cookie
        .split("; ")
        .find((c) => c.startsWith("locale="));
      if (saved) {
        const value = saved.split("=")[1];
        const current = locales.find((l) => l.code === value);
        if (current) {
          document.documentElement.lang = current.code;
          document.documentElement.dir = current.dir;
          return current.code;
        }
      }

      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    } catch {
      // cookie may be unavailable
    }
    return "en";
  });

  function changeLocale(value: string) {
    const current = locales.find((l) => l.code === value);
    if (!current) return;

    setLocale(current.code);

    document.documentElement.lang = current.code;
    document.documentElement.dir = current.dir;

    document.cookie = `locale=${current.code}; path=/; max-age=31536000`;
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span>Language</span>

      <select
        aria-label="Language selector"
        value={locale}
        onChange={(e) => changeLocale(e.target.value)}
        className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
      >
        {locales.map((item) => (
          <option
            key={item.code}
            value={item.code}
            lang={item.code}
          >
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}