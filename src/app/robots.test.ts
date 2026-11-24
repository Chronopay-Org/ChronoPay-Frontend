import { afterEach, describe, expect, it } from "vitest";
import robots from "./robots";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("robots", () => {
  it("allows public routes and disallows internal routes", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const result = robots();

    expect(result.rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/design-review"],
    });
    expect(result.sitemap).toBe("https://chronopay.app/sitemap.xml");
  });

  it("uses NEXT_PUBLIC_SITE_URL for the sitemap URL and strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://staging.chronopay.app///";
    const result = robots();

    expect(result.sitemap).toBe("https://staging.chronopay.app/sitemap.xml");
  });
});
