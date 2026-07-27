import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
const slotPage = readFileSync(
  resolve(root, "src/app/dashboard/slots/[id]/page.tsx"),
  "utf8",
);
const receiptPage = readFileSync(
  resolve(root, "src/app/dashboard/slots/[id]/receipt/page.tsx"),
  "utf8",
);
const documentation = readFileSync(
  resolve(root, "docs/directional-icons.md"),
  "utf8",
);

describe("directional icon design contract", () => {
  it("mirrors directional icons from computed RTL state", () => {
    expect(css).toMatch(/\.icon-directional:dir\(rtl\)/);
    expect(css).toMatch(/transform:\s*scaleX\(-1\)/);
  });

  it("marks every current ArrowLeft navigation icon", () => {
    expect(slotPage).toContain('className="icon-directional');
    expect(receiptPage).toContain('className="icon-directional');
  });

  it("documents directional and non-directional icon decisions", () => {
    expect(documentation).toContain("Back navigation (`ArrowLeft`)");
    expect(documentation).toContain("Never mirror");
    expect(documentation).toContain('dir="rtl"');
  });
});
