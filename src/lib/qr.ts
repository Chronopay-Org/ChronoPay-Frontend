/**
 * src/lib/qr.ts
 *
 * Self-contained ISO/IEC 18004 compliant QR Code encoder and reference decoder.
 * Supports Byte mode (UTF-8), Error Correction Levels L, M, Q, H,
 * versions 1 to 40, optimal mask evaluation, and inline SVG rendering.
 *
 * Zero external dependencies. Safe for browser, SSR, edge, and tests.
 */

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export type EccLevel = "L" | "M" | "Q" | "H";

export interface QrCodeResult {
  version: number;
  ecc: EccLevel;
  mask: number;
  size: number;
  matrix: boolean[][];
}

export interface RenderSvgOptions {
  /** Desired pixel width/height (defaults to 120) */
  size?: number;
  /** Foreground fill color (defaults to #0f172a) */
  fgColor?: string;
  /** Background fill color (defaults to #ffffff). Set to "none" for transparent. */
  bgColor?: string;
  /** Error correction level (defaults to "M") */
  ecc?: EccLevel;
  /** Accessible label for role="img" */
  "aria-label"?: string;
  /** Additional CSS class names for <svg> */
  className?: string;
}

// ---------------------------------------------------------------------------
// Galois Field GF(256) Arithmetic
// ---------------------------------------------------------------------------

const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x >= 256) {
      x ^= 0x11d; // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsComputeGenerator(degree: number): Uint8Array {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) {
        result[j] ^= result[j + 1];
      }
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsComputeRemainder(data: Uint8Array, numEc: number): Uint8Array {
  const gen = rsComputeGenerator(numEc);
  const remainder = new Uint8Array(numEc);
  for (const b of data) {
    const factor = b ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[numEc - 1] = 0;
    for (let i = 0; i < numEc; i++) {
      remainder[i] ^= gfMul(gen[i], factor);
    }
  }
  return remainder;
}

// ---------------------------------------------------------------------------
// Error Correction & Version Block Tables (ISO/IEC 18004)
// ---------------------------------------------------------------------------

const ECC_CODEWORDS_PER_BLOCK: Record<EccLevel, number[]> = {
  L: [ 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30 ],
  M: [ 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28 ],
  Q: [ 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30 ],
  H: [ 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30 ],
};

const NUM_ERROR_CORRECTION_BLOCKS: Record<EccLevel, number[]> = {
  L: [ 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 20, 21, 20, 21, 25, 26, 28 ],
  M: [ 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49 ],
  Q: [ 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68 ],
  H: [ 1, 1, 2, 4, 4, 4, 4, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81 ],
};

function getNumRawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) {
      result -= 36;
    }
  }
  return result;
}

export function getNumDataCodewords(ver: number, ecl: EccLevel): number {
  const totalRawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
  const ecCodewordsTotal = ECC_CODEWORDS_PER_BLOCK[ecl][ver - 1] * NUM_ERROR_CORRECTION_BLOCKS[ecl][ver - 1];
  return totalRawCodewords - ecCodewordsTotal;
}

function getAlignmentPatternPositions(ver: number): number[] {
  if (ver === 1) return [];
  const numAlign = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result: number[] = [6];
  for (let pos = ver * 4 + 10, i = 0; i < numAlign - 1; i++, pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

function getFormatBits(ecl: EccLevel, mask: number): number {
  const eclBits = [1, 0, 3, 2][ecl === "L" ? 0 : ecl === "M" ? 1 : ecl === "Q" ? 2 : 3];
  const data = (eclBits << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

// ---------------------------------------------------------------------------
// Bit Buffer Helper
// ---------------------------------------------------------------------------

class BitBuffer {
  private bits: number[] = [];

  appendBits(val: number, len: number): void {
    for (let i = len - 1; i >= 0; i--) {
      this.bits.push((val >>> i) & 1);
    }
  }

  appendByte(byte: number): void {
    this.appendBits(byte, 8);
  }

  get length(): number {
    return this.bits.length;
  }

  toCodewords(): Uint8Array {
    const numBytes = Math.floor(this.bits.length / 8);
    const result = new Uint8Array(numBytes);
    for (let i = 0; i < numBytes; i++) {
      let b = 0;
      for (let j = 0; j < 8; j++) {
        b = (b << 1) | this.bits[i * 8 + j];
      }
      result[i] = b;
    }
    return result;
  }
}

// ---------------------------------------------------------------------------
// Data Encoding & Interleaving
// ---------------------------------------------------------------------------

function encodeData(data: Uint8Array, ver: number, ecl: EccLevel): Uint8Array {
  const bb = new BitBuffer();
  // 1. Mode indicator: Byte mode = 0b0100
  bb.appendBits(0b0100, 4);

  // 2. Character count indicator: 8 bits for ver 1-9, 16 bits for ver 10-40
  const countBits = ver <= 9 ? 8 : 16;
  bb.appendBits(data.length, countBits);

  // 3. Data bytes
  for (let i = 0; i < data.length; i++) {
    bb.appendByte(data[i]);
  }

  // 4. Terminator: up to 4 zeroes
  const targetCodewords = getNumDataCodewords(ver, ecl);
  const targetBits = targetCodewords * 8;
  const termLen = Math.min(4, targetBits - bb.length);
  bb.appendBits(0, termLen);

  // 5. Pad to byte boundary
  const padToByte = (8 - (bb.length % 8)) % 8;
  bb.appendBits(0, padToByte);

  // 6. Pad codewords alternating 0xEC and 0x11
  let padByte = 0xec;
  while (bb.length < targetBits) {
    bb.appendByte(padByte);
    padByte = padByte === 0xec ? 0x11 : 0xec;
  }

  return bb.toCodewords();
}

function interleaveBlocks(dataCodewords: Uint8Array, ver: number, ecl: EccLevel): Uint8Array {
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][ver - 1];
  const numEc = ECC_CODEWORDS_PER_BLOCK[ecl][ver - 1];
  const totalData = dataCodewords.length;
  const shortLen = Math.floor(totalData / numBlocks);
  const numLongBlocks = totalData % numBlocks;
  const numShortBlocks = numBlocks - numLongBlocks;

  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const len = b < numShortBlocks ? shortLen : shortLen + 1;
    const blockData = dataCodewords.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(blockData);
    ecBlocks.push(rsComputeRemainder(blockData, numEc));
  }

  const totalRawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
  const result = new Uint8Array(totalRawCodewords);
  let outIdx = 0;

  // Interleave data codewords
  const maxDataLen = shortLen + (numLongBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < dataBlocks[b].length) {
        result[outIdx++] = dataBlocks[b][i];
      }
    }
  }

  // Interleave error correction codewords
  for (let i = 0; i < numEc; i++) {
    for (let b = 0; b < numBlocks; b++) {
      result[outIdx++] = ecBlocks[b][i];
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Mask Patterns & Penalty Scoring
// ---------------------------------------------------------------------------

function isMasked(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return false;
  }
}

function calculatePenalty(matrix: boolean[][]): number {
  const size = matrix.length;
  let penalty = 0;

  // Rule 1: 5 or more same color in row/column
  for (let r = 0; r < size; r++) {
    let runColor = matrix[r][0];
    let runLen = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = matrix[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  for (let c = 0; c < size; c++) {
    let runColor = matrix[0][c];
    let runLen = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = matrix[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  // Rule 2: 2x2 blocks of same color
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const color = matrix[r][c];
      if (
        color === matrix[r + 1][c] &&
        color === matrix[r][c + 1] &&
        color === matrix[r + 1][c + 1]
      ) {
        penalty += 3;
      }
    }
  }

  // Rule 3: 1:1:3:1:1 pattern
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 10; c++) {
      const match1 =
        matrix[r][c] && !matrix[r][c + 1] && matrix[r][c + 2] && matrix[r][c + 3] &&
        matrix[r][c + 4] && !matrix[r][c + 5] && matrix[r][c + 6] &&
        !matrix[r][c + 7] && !matrix[r][c + 8] && !matrix[r][c + 9] && !matrix[r][c + 10];
      const match2 =
        !matrix[r][c] && !matrix[r][c + 1] && !matrix[r][c + 2] && !matrix[r][c + 3] &&
        matrix[r][c + 4] && !matrix[r][c + 5] && matrix[r][c + 6] && matrix[r][c + 7] &&
        matrix[r][c + 8] && !matrix[r][c + 9] && matrix[r][c + 10];
      if (match1 || match2) penalty += 40;
    }
  }

  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 10; r++) {
      const match1 =
        matrix[r][c] && !matrix[r + 1][c] && matrix[r + 2][c] && matrix[r + 3][c] &&
        matrix[r + 4][c] && !matrix[r + 5][c] && matrix[r + 6][c] &&
        !matrix[r + 7][c] && !matrix[r + 8][c] && !matrix[r + 9][c] && !matrix[r + 10][c];
      const match2 =
        !matrix[r][c] && !matrix[r + 1][c] && !matrix[r + 2][c] && !matrix[r + 3][c] &&
        matrix[r + 4][c] && !matrix[r + 5][c] && matrix[r + 6][c] && matrix[r + 7][c] &&
        matrix[r + 8][c] && !matrix[r + 9][c] && matrix[r + 10][c];
      if (match1 || match2) penalty += 40;
    }
  }

  // Rule 4: Balance of dark modules
  let darkCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) darkCount++;
    }
  }
  const total = size * size;
  const percent = (darkCount * 100) / total;
  const prevMultipleOf5 = Math.floor(percent / 5) * 5;
  const nextMultipleOf5 = prevMultipleOf5 + 5;
  const k = Math.min(Math.abs(prevMultipleOf5 - 50) / 5, Math.abs(nextMultipleOf5 - 50) / 5);
  penalty += k * 10;

  return penalty;
}

// ---------------------------------------------------------------------------
// Matrix Layout & Drawing
// ---------------------------------------------------------------------------

function createFunctionMatrix(ver: number): { matrix: boolean[][]; isFunction: boolean[][] } {
  const size = ver * 4 + 17;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunction(r: number, c: number, val: boolean) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  // 1. Finder patterns (7x7) + separators
  const finders = [
    { r: 0, c: 0 },
    { r: 0, c: size - 7 },
    { r: size - 7, c: 0 },
  ];

  for (const { r: startR, c: startC } of finders) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = startR + r;
        const nc = startC + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r < 7 && c >= 0 && c < 7) {
            const dist = Math.max(Math.abs(r - 3), Math.abs(c - 3));
            setFunction(nr, nc, dist !== 2);
          } else {
            setFunction(nr, nc, false);
          }
        }
      }
    }
  }

  // 2. Alignment patterns
  const alignPositions = getAlignmentPatternPositions(ver);
  for (const r of alignPositions) {
    for (const c of alignPositions) {
      if (
        (r < 9 && c < 9) ||
        (r < 9 && c >= size - 9) ||
        (r >= size - 9 && c < 9)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFunction(r + dr, c + dc, dist !== 1);
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 0; i < size; i++) {
    if (!isFunction[6][i]) setFunction(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setFunction(i, 6, i % 2 === 0);
  }

  // 4. Dark module
  setFunction(4 * ver + 9, 8, true);

  // 5. Reserve format info modules
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // 6. Reserve version info modules (ver >= 7)
  if (ver >= 7) {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        isFunction[r][size - 11 + c] = true;
        isFunction[size - 11 + c][r] = true;
      }
    }
  }

  return { matrix, isFunction };
}

function drawFormatBits(matrix: boolean[][], formatBits: number): void {
  const size = matrix.length;
  const coords1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8],
    [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];

  const coords2: [number, number][] = [];
  for (let i = 0; i < 7; i++) {
    coords2.push([size - 1 - i, 8]);
  }
  for (let i = 0; i < 8; i++) {
    coords2.push([8, size - 8 + i]);
  }

  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >>> i) & 1) === 1;
    matrix[coords1[i][0]][coords1[i][1]] = bit;
    matrix[coords2[i][0]][coords2[i][1]] = bit;
  }
}

function drawVersionBits(matrix: boolean[][], ver: number): void {
  if (ver < 7) return;
  const size = matrix.length;
  let rem = ver;
  for (let i = 0; i < 12; i++) {
    rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  }
  const bits = (ver << 12) | rem;

  for (let i = 0; i < 18; i++) {
    const bit = ((bits >>> i) & 1) === 1;
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    matrix[b][a] = bit;
    matrix[a][b] = bit;
  }
}

function placeDataBits(
  baseMatrix: boolean[][],
  isFunction: boolean[][],
  codewords: Uint8Array,
  ver: number,
  mask: number,
): boolean[][] {
  const size = baseMatrix.length;
  const matrix = baseMatrix.map((row) => [...row]);

  const bits: number[] = [];
  for (const byte of codewords) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >>> i) & 1);
    }
  }

  const numRemainder = getNumRawDataModules(ver) - codewords.length * 8;
  for (let i = 0; i < numRemainder; i++) {
    bits.push(0);
  }

  let bitIdx = 0;
  let upward = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;

    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          const dataBit = bitIdx < bits.length ? bits[bitIdx++] : 0;
          const maskBit = isMasked(mask, r, c) ? 1 : 0;
          matrix[r][c] = (dataBit ^ maskBit) === 1;
        }
      }
    }
    upward = !upward;
  }

  return matrix;
}

function selectBestMask(
  baseMatrix: boolean[][],
  isFunction: boolean[][],
  codewords: Uint8Array,
  ver: number,
  ecl: EccLevel,
): { matrix: boolean[][]; mask: number } {
  let bestMask = 0;
  let minPenalty = Infinity;
  let bestMatrix: boolean[][] = baseMatrix;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = placeDataBits(baseMatrix, isFunction, codewords, ver, mask);
    const formatBits = getFormatBits(ecl, mask);
    drawFormatBits(candidate, formatBits);
    drawVersionBits(candidate, ver);

    const penalty = calculatePenalty(candidate);
    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestMask = mask;
      bestMatrix = candidate;
    }
  }

  return { matrix: bestMatrix, mask: bestMask };
}

// ---------------------------------------------------------------------------
// Main Public Encoder API
// ---------------------------------------------------------------------------

export function findSmallestVersion(dataLen: number, ecl: EccLevel): number {
  for (let ver = 1; ver <= 40; ver++) {
    const countBits = ver <= 9 ? 8 : 16;
    const totalDataBits = 4 + countBits + dataLen * 8;
    const capacityBits = getNumDataCodewords(ver, ecl) * 8;
    if (totalDataBits <= capacityBits) {
      return ver;
    }
  }
  throw new Error(`Data is too long to fit in a QR code with ECC level ${ecl}`);
}

/**
 * Encode an arbitrary UTF-8 string into a standard QR code matrix.
 */
export function encodeQr(
  text: string,
  options?: { ecc?: EccLevel; minVersion?: number },
): QrCodeResult {
  const ecl = options?.ecc ?? "M";
  const data = new TextEncoder().encode(text);
  let ver = findSmallestVersion(data.length, ecl);
  if (options?.minVersion && options.minVersion > ver) {
    ver = Math.min(40, options.minVersion);
  }

  const dataCodewords = encodeData(data, ver, ecl);
  const interleavedCodewords = interleaveBlocks(dataCodewords, ver, ecl);
  const { matrix: baseMatrix, isFunction } = createFunctionMatrix(ver);
  const { matrix, mask } = selectBestMask(baseMatrix, isFunction, interleavedCodewords, ver, ecl);

  return {
    version: ver,
    ecc: ecl,
    mask,
    size: matrix.length,
    matrix,
  };
}

/**
 * Generate a boolean[][] QR matrix from an input string.
 */
export function generateQrMatrix(text: string, ecc: EccLevel = "M"): boolean[][] {
  return encodeQr(text, { ecc }).matrix;
}

/**
 * Render an inline SVG representation of a QR code.
 */
export function renderQrSvg(text: string, options?: RenderSvgOptions): string {
  const {
    size = 120,
    fgColor = "#0f172a",
    bgColor = "#ffffff",
    ecc = "M",
    "aria-label": ariaLabel,
    className = "",
  } = options ?? {};

  const { matrix } = encodeQr(text, { ecc });
  const moduleCount = matrix.length;
  const labelAttr = ariaLabel
    ? ` aria-label="${ariaLabel.replace(/"/g, "&quot;")}"`
    : ` aria-label="QR code for ${text.replace(/"/g, "&quot;")}"`;
  const classAttr = className ? ` class="${className.replace(/"/g, "&quot;")}"` : "";

  const rects: string[] = [];
  if (bgColor && bgColor !== "none") {
    rects.push(`<rect width="${moduleCount}" height="${moduleCount}" fill="${bgColor}"/>`);
  }

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        rects.push(`<rect x="${c}" y="${r}" width="1" height="1" fill="${fgColor}"/>`);
      }
    }
  }

  return `<svg role="img"${labelAttr}${classAttr} width="${size}" height="${size}" viewBox="0 0 ${moduleCount} ${moduleCount}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${rects.join("")}</svg>`;
}

// ---------------------------------------------------------------------------
// Reference Decoder (for conformance testing)
// ---------------------------------------------------------------------------

/**
 * Decodes a standard QR code boolean[][] matrix back to its UTF-8 input string.
 * Used for conformance verification in unit tests.
 */
export function decodeQrMatrix(matrix: boolean[][]): string {
  const size = matrix.length;
  const ver = (size - 17) / 4;
  if (!Number.isInteger(ver) || ver < 1 || ver > 40) {
    throw new Error(`Invalid QR matrix size: ${size}`);
  }

  // 1. Read format bits
  const coords1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8],
    [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];

  let rawFormat = 0;
  for (let i = 0; i < 15; i++) {
    if (matrix[coords1[i][0]][coords1[i][1]]) {
      rawFormat |= 1 << i;
    }
  }
  const format = rawFormat ^ 0x5412;
  const eclBits = (format >>> 13) & 0x03;
  const mask = (format >>> 10) & 0x07;

  let ecl: EccLevel = "M";
  if (eclBits === 1) ecl = "L";
  else if (eclBits === 0) ecl = "M";
  else if (eclBits === 3) ecl = "Q";
  else if (eclBits === 2) ecl = "H";

  // 2. Build function matrix to skip function modules
  const { isFunction } = createFunctionMatrix(ver);

  // 3. Extract unmasked data bits
  const bits: number[] = [];
  let upward = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          const bit = (matrix[r][c] ? 1 : 0) ^ (isMasked(mask, r, c) ? 1 : 0);
          bits.push(bit);
        }
      }
    }
    upward = !upward;
  }

  // 4. Convert to codewords
  const numRawCodewords = Math.floor(getNumRawDataModules(ver) / 8);
  const rawCodewords = new Uint8Array(numRawCodewords);
  for (let i = 0; i < numRawCodewords; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    rawCodewords[i] = b;
  }

  // 5. De-interleave blocks
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][ver - 1];
  const totalData = getNumDataCodewords(ver, ecl);
  const shortLen = Math.floor(totalData / numBlocks);
  const numLongBlocks = totalData % numBlocks;
  const numShortBlocks = numBlocks - numLongBlocks;

  const dataBlocks: number[][] = Array.from({ length: numBlocks }, () => []);
  let inIdx = 0;

  const maxDataLen = shortLen + (numLongBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      const expectedLen = b < numShortBlocks ? shortLen : shortLen + 1;
      if (i < expectedLen) {
        dataBlocks[b].push(rawCodewords[inIdx++]);
      }
    }
  }

  const dataBytes: number[] = [];
  for (const b of dataBlocks) {
    dataBytes.push(...b);
  }

  // 6. Decode bit stream from dataBytes
  let bitPos = 0;
  function readBits(count: number): number {
    let val = 0;
    for (let i = 0; i < count; i++) {
      const byteIdx = Math.floor(bitPos / 8);
      const bitOffset = 7 - (bitPos % 8);
      val = (val << 1) | ((dataBytes[byteIdx] >>> bitOffset) & 1);
      bitPos++;
    }
    return val;
  }

  const mode = readBits(4);
  if (mode !== 0b0100) {
    throw new Error(`Unsupported QR mode: ${mode}`);
  }

  const countBits = ver <= 9 ? 8 : 16;
  const charCount = readBits(countBits);

  const outBytes = new Uint8Array(charCount);
  for (let i = 0; i < charCount; i++) {
    outBytes[i] = readBits(8);
  }

  return new TextDecoder().decode(outBytes);
}

/**
 * Decodes an SVG string containing QR <rect> modules back to the encoded text.
 */
export function decodeQrSvg(svgString: string): string {
  const viewBoxMatch = svgString.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!viewBoxMatch) {
    throw new Error("Unable to parse viewBox from SVG");
  }
  const viewBoxSize = parseInt(viewBoxMatch[1], 10);

  // Determine module pixel size from first dark rect with x and y attributes
  const rects = [...svgString.matchAll(/<rect\b([^>]+)>/g)];
  let modulePx = 1;
  for (const match of rects) {
    const attrs = match[1];
    const widthMatch = attrs.match(/\bwidth="(\d+)"/);
    const xMatch = attrs.match(/\bx="(\d+)"/);
    const yMatch = attrs.match(/\by="(\d+)"/);
    if (xMatch && yMatch && widthMatch) {
      modulePx = parseInt(widthMatch[1], 10);
      break;
    }
  }

  const size = Math.round(viewBoxSize / modulePx);
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const rectRegex = /<rect[^>]*\bx="(\d+)"[^>]*\by="(\d+)"/g;
  let match: RegExpExecArray | null;
  while ((match = rectRegex.exec(svgString)) !== null) {
    const x = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);
    const col = Math.round(x / modulePx);
    const row = Math.round(y / modulePx);
    if (row < size && col < size) {
      matrix[row][col] = true;
    }
  }

  return decodeQrMatrix(matrix);
}
