import { describe, expect, it } from "vitest";
import { DEMO_URL, ISSUES_URL, REPO_URL } from "./site-links";

describe("site-links", () => {
  it("exports the repository URL", () => {
    expect(REPO_URL).toBe("https://github.com/Chronopay-Org/ChronoPay-Frontend");
  });

  it("derives the issues URL from the repository URL", () => {
    expect(ISSUES_URL).toBe(`${REPO_URL}/issues`);
  });

  it("exports an https demo URL without a trailing slash", () => {
    expect(DEMO_URL).toBe("https://chronopay-frontend-omega.vercel.app");
    expect(DEMO_URL.startsWith("https://")).toBe(true);
    expect(DEMO_URL.endsWith("/")).toBe(false);
  });
});
