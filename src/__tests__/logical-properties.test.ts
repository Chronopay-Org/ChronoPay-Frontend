import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(process.cwd(), "src");
const physicalUtilityAllowlist: Readonly<Record<string, readonly string[]>> = {};
const utilityPatterns = [
  /(?<![\w-])(?:[\w-]+:)*-?(?:ml|mr|pl|pr|left|right)-(?:auto|full|px|\d+(?:\.\d+)?(?:\/\d+)?|\[[^\]\s]+\])/g,
  /(?<![\w-])(?:[\w-]+:)*(?:border|rounded)-(?:l|r)(?:-[A-Za-z0-9_./%[\]-]+)?(?=$|[\s"'`])/g,
  /(?<![\w-])(?:[\w-]+:)*(?:text-(?:left|right)|float-(?:left|right)|clear-(?:left|right))(?=$|[\s"'`])/g,
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(file);
    }

    return /\.(?:ts|tsx)$/.test(entry.name) && !/\.test\.(?:ts|tsx)$/.test(entry.name)
      ? [file]
      : [];
  });
}

describe("logical CSS properties", () => {
  it("does not use physical-direction utilities outside the allowlist", () => {
    const violations = sourceFiles(sourceRoot).flatMap((file) => {
      const path = relative(sourceRoot, file).replace(/\\/g, "/");
      const source = readFileSync(file, "utf8");
      return utilityPatterns.flatMap((pattern) => {
        pattern.lastIndex = 0;
        return [...source.matchAll(pattern)]
          .map(([utility]) => `${path}: ${utility}`)
          .filter((violation) => {
            const utility = violation.slice(path.length + 2);
            return !physicalUtilityAllowlist[path]?.includes(utility);
          });
      });
    });

    expect(violations).toEqual([]);
  });

  it("uses logical offsets in global styles", () => {
    const globalStyles = readFileSync(resolve(sourceRoot, "app/globals.css"), "utf8");
    expect(globalStyles).not.toMatch(/(?:^|[;{\s])(?:left|right)\s*:/m);
  });
});
