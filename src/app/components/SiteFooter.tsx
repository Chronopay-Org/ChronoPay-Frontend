"use client";

import { useMessages } from "@/lib/i18n";
import { DEMO_URL, REPO_URL } from "@/lib/site-links";

export function SiteFooter() {
  const t = useMessages();

  return (
    <footer
      className="mt-auto border-t px-6 py-6 pb-24 text-sm sm:pb-6"
      style={{
        borderColor: "var(--border-subtle)",
        color: "var(--muted)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p>{t("footer.demoNotice")}</p>
        <a
          href={DEMO_URL}
          className="font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          {t("footer.liveDemo")}
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          {t("footer.sourceOnGithub")}
        </a>
      </div>
    </footer>
  );
}
