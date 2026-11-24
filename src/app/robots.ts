import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://chronopay.app";

function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/design-review"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
