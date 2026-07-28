import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("reduced-motion skeletons", () => {
  const css = read("src/app/globals.css");
  const dashboard = read("src/app/dashboard/loading.tsx");
  const stateCard = read("src/components/dashboard/state-card.tsx");
  const roleChip = read("src/app/components/ui/RoleChip.tsx");

  it("animates shimmer only when reduced motion is not requested", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\.skeleton::after[\s\S]*?animation: skeleton-shimmer/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.skeleton::after[\s\S]*?animation: none/);
  });

  it("keeps a theme-aware static tint when animation is removed", () => {
    expect(css).toContain("background-color: var(--skeleton-base)");
    expect(css).toContain("--skeleton-base:");
    expect(css).toContain("content: none");
  });

  it("uses the shared class for every current skeleton", () => {
    expect(dashboard.match(/skeleton/g)?.length).toBe(7);
    expect(stateCard.match(/skeleton/g)?.length).toBe(3);
    expect(roleChip.match(/skeleton/g)?.length).toBe(3);
    expect(`${dashboard}${stateCard}${roleChip}`).not.toContain("animate-pulse");
  });

  it("documents long loads, RTL, and screen-reader behavior", () => {
    const guide = read("docs/skeleton-loading.md");

    expect(guide).toContain("long-running loads");
    expect(guide).toContain("RTL");
    expect(guide).toContain("screen reader");
  });
});
