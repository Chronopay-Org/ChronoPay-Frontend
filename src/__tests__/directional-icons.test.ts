import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
const receiptPage = readFileSync(
  resolve(root, "src/app/dashboard/slots/[id]/receipt/page.tsx"),
  "utf8",
);
const slotHeader = readFileSync(
  resolve(root, "src/components/dashboard/slot-detail/slot-header-section.tsx"),
  "utf8",
);
const marketplacePage = readFileSync(
  resolve(root, "src/app/marketplace/[id]/page.tsx"),
  "utf8",
);
const documentation = readFileSync(
  resolve(root, "docs/directional-icons.md"),
  "utf8",
);
const directionAwareIconFiles = [
  "src/app/components/header-search.tsx",
  "src/app/components/ui/breadcrumb-overflow.tsx",
  "src/components/dashboard/availability-conflict-detector.tsx",
  "src/components/dashboard/booking-progress.tsx",
  "src/components/dashboard/dispute-filing-form.tsx",
  "src/components/dashboard/lightbox.tsx",
  "src/components/dashboard/mini-calendar-navigator.tsx",
  "src/components/dashboard/month-calendar-view.tsx",
  "src/components/dashboard/onboarding-tour.tsx",
  "src/components/dashboard/supplier-onboarding-wizard.tsx",
];

describe("directional icon design contract", () => {
  it("mirrors directional icons under dir=rtl", () => {
    expect(css).toMatch(/\[dir="rtl"\]\s+\.icon-directional/);
    expect(css).toMatch(/transform:\s*scaleX\(-1\)/);
  });

  it("marks every current ArrowLeft navigation icon", () => {
    expect(slotHeader).toContain('className="icon-directional');
    expect(receiptPage).toContain('className="icon-directional');
    expect(marketplacePage).toContain('className="icon-directional');
  });

  it("marks inline navigation arrows for mirroring", () => {
    for (const file of directionAwareIconFiles) {
      const source = readFileSync(resolve(root, file), "utf8");
      const icons = [
        ...source.matchAll(/<(?:ArrowLeft|ArrowRight|ChevronLeft|ChevronRight)\b[^>]*>/g),
      ];

      expect(icons.length, file).toBeGreaterThan(0);
      expect(
        icons.every((icon) => icon[0].includes('className="icon-directional')),
        file,
      ).toBe(true);
    }
  });

  it("documents directional and non-directional icon decisions", () => {
    expect(documentation).toContain("Back navigation (`ArrowLeft`)");
    expect(documentation).toContain("Never mirror");
    expect(documentation).toContain('dir="rtl"');
  });
});
