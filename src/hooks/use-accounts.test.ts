import { describe, expect, it } from "vitest";
import {
  avatarColour,
  avatarInitials,
  MAX_RECENTS,
  truncateAddress,
} from "./use-accounts";

describe("MAX_RECENTS", () => {
  it("equals 5", () => {
    expect(MAX_RECENTS).toBe(5);
  });
});

describe("truncateAddress", () => {
  it("keeps the first 6 and last 4 characters separated by an ellipsis for long addresses", () => {
    const address = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
    expect(truncateAddress(address)).toBe("GAAZI4…CCWN");
  });

  it("returns short addresses (12 chars or fewer) as-is", () => {
    expect(truncateAddress("GAAZI4")).toBe("GAAZI4");
    expect(truncateAddress("123456789012")).toBe("123456789012");
  });

  it("truncates addresses longer than 12 characters", () => {
    expect(truncateAddress("1234567890123")).toBe("123456…0123");
  });

  it("returns an empty string as-is", () => {
    expect(truncateAddress("")).toBe("");
  });
});

describe("avatarColour", () => {
  const VALID_COLOURS = [
    "bg-cyan-600",
    "bg-violet-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-sky-600",
    "bg-indigo-600",
    "bg-teal-600",
  ];

  it("is deterministic for the same address", () => {
    const address = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
    const first = avatarColour(address);
    const second = avatarColour(address);
    expect(first).toBe(second);
    expect(VALID_COLOURS).toContain(first);
  });

  it("returns a fallback colour for empty input", () => {
    const colour = avatarColour("");
    expect(colour).toBe("bg-cyan-600");
    expect(VALID_COLOURS).toContain(colour);
  });

  it("returns valid Tailwind colour classes across different addresses", () => {
    const addresses = [
      "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
      "GD6WNTESP5HB7SRDKOZNVPHKBF7BQHK7VMQFHPVDG3XMHXF3CRXOYZK",
      "GCLRFH5J3ZY7E5QFU65S2QOAJF7Q4XJSE4Z6NVKZX3F6P3VK4LQMG5JR",
    ];
    for (const addr of addresses) {
      expect(VALID_COLOURS).toContain(avatarColour(addr));
    }
  });
});

describe("avatarInitials", () => {
  it("uses the first two characters of the account label uppercased", () => {
    expect(
      avatarInitials({
        address: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
        label: "Savings",
      }),
    ).toBe("SA");
  });

  it("handles a single-character label", () => {
    expect(
      avatarInitials({
        address: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
        label: "x",
      }),
    ).toBe("X");
  });

  it("falls back to the first two characters of the address when label is missing or empty", () => {
    expect(
      avatarInitials({
        address: "gaazi4tcr3ty5ojhctjc2a4qsy6cjwjh5iajtgkin2er7lbnvkoccwn",
      }),
    ).toBe("GA");

    expect(
      avatarInitials({
        address: "GD6WNTESP5HB7SRDKOZNVPHKBF7BQHK7VMQFHPVDG3XMHXF3CRXOYZK",
        label: "",
      }),
    ).toBe("GD");
  });

  it("does not throw when both label and address are empty", () => {
    expect(avatarInitials({ address: "", label: "" })).toBe("");
  });
});
