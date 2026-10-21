import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const indexFile = "src/components/dashboard/index.ts";
const indexPath = path.join(root, indexFile);

describe("src/components/dashboard barrel (index.ts)", () => {
  it("exists at the expected path", () => {
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  it("is a named-export barrel (no default export, no side effects)", () => {
    const content = fs.readFileSync(indexPath, "utf8");
    expect(content).not.toMatch(/export\s+default\s/);
    expect(content).not.toMatch(/^\s*import\s/m);
  });

  it("every re-export targets a sibling module with a relative path", () => {
    const content = fs.readFileSync(indexPath, "utf8");
    const reExportLines = content.match(/^export \* from "\.\/[^"]+";?$/gm) ?? [];
    expect(reExportLines.length).toBeGreaterThan(0);
    for (const line of reExportLines) {
      expect(line).toMatch(/^export \* from "\.\/[^"]+"(;)?$/);
    }
  });

    it("does not re-export from a parent or absolute path (barrel stays scoped to this folder)", () => {
    const content = fs.readFileSync(indexPath, "utf8");
    expect(content).not.toMatch(/^export \* from "\.\.\//m);
    expect(content).not.toMatch(/^export \* from "@\//m);
  });

  it("re-exports at least 40 modules (sanity check on barrel completeness)", () => {
    const content = fs.readFileSync(indexPath, "utf8");
    const matches = content.match(/^export \* from "\.\/[^"]+";?$/gm) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(40);
  });

  it("contains no duplicate module paths", () => {
    const content = fs.readFileSync(indexPath, "utf8");
    const matches = content.match(/^export \* from "\.\/([^"]+)";?$/gm) ?? [];
    const paths = matches.map((m) => m.replace(/^export \* from "\.\//, "").replace(/";?$/, ""));
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });
});