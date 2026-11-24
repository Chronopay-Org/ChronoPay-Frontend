import type { MetadataRoute } from "next";
import { buildCatalogue } from "@/app/marketplace/catalogue";

const DEFAULT_SITE_URL = "https://chronopay.app";

export const STATIC_ROUTES = ["/", "/marketplace", "/pricing", "/status"] as const;

function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: route === "/" ? siteUrl : `${siteUrl}${route}`,
    changeFrequency: route === "/status" ? "hourly" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));

  const marketplaceEntries: MetadataRoute.Sitemap = buildCatalogue().map((item) => ({
    url: `${siteUrl}/marketplace/${item.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...marketplaceEntries];
}
