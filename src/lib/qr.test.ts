/**
 * src/lib/qr.test.ts
 *
 * Unit tests and conformance tests for the QR encoder and reference decoder:
 *  - Round-trip encode -> decode for ASCII, URLs, Stellar deep links, and addresses
 *  - Conformance against QR structural invariants (finder patterns, timing, dark module)
 *  - Format info and error correction levels (L, M, Q, H)
 *  - SVG output generation and decoding from SVG
 *  - Known QR test vectors
 */

import { describe, it, expect } from "vitest";
import {
  encodeQr,
  generateQrMatrix,
  renderQrSvg,
  decodeQrMatrix,
  decodeQrSvg,
  getNumDataCodewords,
} from "./qr";

describe("qr encoder and reference decoder", () => {
  const TEST_INPUTS = [
    "HELLO WORLD",
    "https://chronopay.io",
    "GCDQ7M3F6JH2K4N8Q5RLP9TZB3YH4W8F1S7N6U0X2A5V8E1C",
    "web+stellar:pay?destination=GCDQ7M3F6JH2K4N8Q5RLP9TZB3YH4W8F1S7N6U0X2A5V8E1C&network_passphrase=Test%20SDF%20Network%20%3B%20September%202015",
    "1234567890",
    "Simple test message with spaces and symbols: !@#$%^&*()_+",
  ];

  describe("round-trip decodeQrMatrix", () => {
    for (const input of TEST_INPUTS) {
      it(`encodes and decodes "${input.slice(0, 30)}..." accurately`, () => {
        const matrix = generateQrMatrix(input, "M");
        const decoded = decodeQrMatrix(matrix);
        expect(decoded).toBe(input);
      });
    }
  });

  describe("error correction levels", () => {
    const eccLevels: Array<"L" | "M" | "Q" | "H"> = ["L", "M", "Q", "H"];
    for (const ecc of eccLevels) {
      it(`round-trips successfully with ECC level ${ecc}`, () => {
        const input = "https://stellar.expert/explorer/testnet/tx/12345678";
        const result = encodeQr(input, { ecc });
        expect(result.ecc).toBe(ecc);
        const decoded = decodeQrMatrix(result.matrix);
        expect(decoded).toBe(input);
      });
    }
  });

  describe("QR structural invariants", () => {
    it("places 7x7 finder patterns at the three corners", () => {
      const { matrix, size } = encodeQr("test invariant");

      // Top-left finder (center 3x3 is dark, ring is light, border is dark)
      expect(matrix[0][0]).toBe(true);
      expect(matrix[0][6]).toBe(true);
      expect(matrix[6][0]).toBe(true);
      expect(matrix[6][6]).toBe(true);
      expect(matrix[1][1]).toBe(false); // light ring
      expect(matrix[3][3]).toBe(true);  // dark center

      // Top-right finder
      expect(matrix[0][size - 7]).toBe(true);
      expect(matrix[0][size - 1]).toBe(true);
      expect(matrix[6][size - 7]).toBe(true);
      expect(matrix[6][size - 1]).toBe(true);
      expect(matrix[1][size - 2]).toBe(false);
      expect(matrix[3][size - 4]).toBe(true);

      // Bottom-left finder
      expect(matrix[size - 7][0]).toBe(true);
      expect(matrix[size - 7][6]).toBe(true);
      expect(matrix[size - 1][0]).toBe(true);
      expect(matrix[size - 1][6]).toBe(true);
      expect(matrix[size - 2][1]).toBe(false);
      expect(matrix[size - 4][3]).toBe(true);
    });

    it("has alternating timing patterns on row 6 and col 6 between finders", () => {
      const { matrix, size } = encodeQr("timing test");
      for (let i = 8; i < size - 8; i++) {
        expect(matrix[6][i]).toBe(i % 2 === 0);
        expect(matrix[i][6]).toBe(i % 2 === 0);
      }
    });

    it("has dark module at (4*version + 9, 8)", () => {
      const { matrix, version } = encodeQr("dark module check");
      expect(matrix[4 * version + 9][8]).toBe(true);
    });
  });

  describe("renderQrSvg and decodeQrSvg", () => {
    it("renders valid inline SVG without external requests", () => {
      const input = "https://chronopay.app/receipt/0x123";
      const svg = renderQrSvg(input, {
        size: 120,
        "aria-label": "Receipt QR",
      });

      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      expect(svg).toContain('width="120"');
      expect(svg).toContain('height="120"');
      expect(svg).toContain('aria-label="Receipt QR"');
      expect(svg).not.toContain("qrserver");
      expect(svg).not.toContain("api.qrserver.com");
    });

    it("decodes the generated SVG matrix back to the input string", () => {
      const testCases = [
        "https://stellar.expert/explorer/public/tx/abcdef",
        "web+stellar:pay?destination=GABC&network_passphrase=Test%20SDF%20Network%20%3B%20September%202015",
        "Hello from ChronoPay offline QR!",
      ];

      for (const text of testCases) {
        const svg = renderQrSvg(text);
        const decoded = decodeQrSvg(svg);
        expect(decoded).toBe(text);
      }
    });
  });

  describe("getNumDataCodewords", () => {
    it("returns expected ISO 18004 capacity for Version 1", () => {
      expect(getNumDataCodewords(1, "L")).toBe(19);
      expect(getNumDataCodewords(1, "M")).toBe(16);
      expect(getNumDataCodewords(1, "Q")).toBe(13);
      expect(getNumDataCodewords(1, "H")).toBe(9);
    });

    it("returns expected ISO 18004 capacity for Version 2", () => {
      expect(getNumDataCodewords(2, "L")).toBe(34);
      expect(getNumDataCodewords(2, "M")).toBe(28);
      expect(getNumDataCodewords(2, "Q")).toBe(22);
      expect(getNumDataCodewords(2, "H")).toBe(16);
    });
  });
});
