"use client";

import { useMessages } from "@/lib/i18n";

export function SkipLink() {
  const t = useMessages();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:inset-inline-start-4 focus:top-4 focus:z-50 focus:rounded focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-300"
    >
      {t("common.skipToContent")}
    </a>
  );
}
