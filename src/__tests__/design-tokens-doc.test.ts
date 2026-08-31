import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("design tokens documentation", () => {
  it("publishes a canonical design token guide with the required categories", () => {
    const guide = read("docs/design-tokens.md");

    expect(guide).toContain("# Design Tokens");
    expect(guide).toContain("## Color");
    expect(guide).toContain("## Space");
    expect(guide).toContain("## Radius");
    expect(guide).toContain("## Motion");
    expect(guide).toContain("## Typography");
    expect(guide).toContain("Do");
    expect(guide).toContain("Don't");
  });

  it("defines the documented spacing, radius, motion, and type tokens in globals.css", () => {
    const css = read("src/app/globals.css");

    expect(css).toContain("--space-1:");
    expect(css).toContain("--radius-sm:");
    expect(css).toContain("--motion-duration-fast:");
    expect(css).toContain("--font-size-md:");
  });
});
