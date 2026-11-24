import { afterEach, describe, expect, it } from "vitest";
import { buildCatalogue } from "@/app/marketplace/catalogue";
import sitemap, { STATIC_ROUTES } from "./sitemap";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("sitemap", () => {
  it("lists all static public routes and every marketplace catalogue item", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    const catalogue = buildCatalogue();

    expect(entries).toHaveLength(STATIC_ROUTES.length + catalogue.length);

    expect(urls).toContain("https://chronopay.app");
    expect(urls).toContain("https://chronopay.app/marketplace");
    expect(urls).toContain("https://chronopay.app/pricing");
    expect(urls).toContain("https://chronopay.app/status");

    for (const item of catalogue) {
      expect(urls).toContain(`https://chronopay.app/marketplace/${item.id}`);
    }
  });

  it("does not include internal routes", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const urls = sitemap().map((entry) => entry.url);

    for (const url of urls) {
      expect(url).not.toContain("/dashboard");
      expect(url).not.toContain("/admin");
      expect(url).not.toContain("/design-review");
    }
  });

  it("respects NEXT_PUBLIC_SITE_URL and strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://preview.chronopay.app/";
    const urls = sitemap().map((entry) => entry.url);

    expect(urls[0]).toBe("https://preview.chronopay.app");
    expect(urls).toContain("https://preview.chronopay.app/marketplace");
    expect(urls).toContain("https://preview.chronopay.app/marketplace/demo-1");
  });
});
