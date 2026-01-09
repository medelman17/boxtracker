/**
 * QR Code vector path generation for PDF embedding
 *
 * Generates optimized SVG path strings from QR code data using run-length encoding.
 * This produces resolution-independent vector graphics suitable for high-quality printing.
 */

import QRCode from "qrcode";
import { QR_CODE } from "./avery-5168";

/**
 * QR code error correction levels
 */
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/**
 * Generated QR code data with both SVG path and module matrix
 */
export type QRCodeData = {
  path: string;
  moduleCount: number;
  moduleSize: number;
  size: number;
};

/**
 * Generate QR code module matrix
 */
async function generateModules(
  content: string,
  errorCorrection: ErrorCorrectionLevel = "M"
): Promise<boolean[][]> {
  const qr = await QRCode.create(content, {
    errorCorrectionLevel: errorCorrection,
  });

  const modules: boolean[][] = [];
  const size = qr.modules.size;

  for (let row = 0; row < size; row++) {
    modules[row] = [];
    for (let col = 0; col < size; col++) {
      modules[row][col] = qr.modules.get(row, col) === 1;
    }
  }

  return modules;
}

/**
 * Generate run-length encoded SVG path from module matrix
 *
 * This optimization combines adjacent dark modules into single rectangles,
 * reducing path complexity and PDF file size.
 *
 * @param modules - 2D boolean array of QR code modules
 * @param size - Target size in points
 * @returns Optimized SVG path string
 */
function generateOptimizedPath(modules: boolean[][], size: number): string {
  const moduleCount = modules.length;
  const moduleSize = size / moduleCount;
  const paths: string[] = [];

  for (let row = 0; row < moduleCount; row++) {
    let runStart: number | null = null;

    for (let col = 0; col <= moduleCount; col++) {
      const isDark = col < moduleCount && modules[row][col];

      if (isDark && runStart === null) {
        // Start of a new run
        runStart = col;
      } else if (!isDark && runStart !== null) {
        // End of run - emit rectangle path
        const x = Number((runStart * moduleSize).toFixed(2));
        const y = Number((row * moduleSize).toFixed(2));
        const width = Number(((col - runStart) * moduleSize).toFixed(2));
        const height = Number(moduleSize.toFixed(2));

        // Use relative path commands for efficiency
        // M = move to, h = horizontal line (relative), v = vertical line (relative), z = close path
        paths.push(`M${x},${y}h${width}v${height}h${-width}z`);
        runStart = null;
      }
    }
  }

  return paths.join("");
}

/**
 * Generate a vector QR code as an optimized SVG path
 *
 * @param content - The content to encode (URL, text, etc.)
 * @param size - Target size in points (default: 216pt = 3.0")
 * @param errorCorrection - Error correction level (default: "M" = 15% recovery)
 * @returns QR code data including SVG path
 *
 * @example
 * ```typescript
 * const qr = await generateQRPath("https://example.com/box/abc123", 216, "M");
 * // qr.path: "M0,0h5.4v5.4h-5.4zM10.8,0h5.4v5.4h-5.4z..."
 * ```
 */
export async function generateQRPath(
  content: string,
  size: number = QR_CODE.size,
  errorCorrection: ErrorCorrectionLevel = QR_CODE.errorCorrection
): Promise<QRCodeData> {
  const modules = await generateModules(content, errorCorrection);
  const moduleCount = modules.length;
  const moduleSize = size / moduleCount;
  const path = generateOptimizedPath(modules, size);

  return {
    path,
    moduleCount,
    moduleSize,
    size,
  };
}

/**
 * Generate QR code as a complete SVG string
 *
 * @param content - The content to encode
 * @param size - Target size in points
 * @param errorCorrection - Error correction level
 * @returns Complete SVG element as string
 */
export async function generateQRSvg(
  content: string,
  size: number = QR_CODE.size,
  errorCorrection: ErrorCorrectionLevel = QR_CODE.errorCorrection
): Promise<string> {
  const { path } = await generateQRPath(content, size, errorCorrection);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="white"/>
  <path d="${path}" fill="black"/>
</svg>`;
}

/**
 * Convert SVG path to data URL for PDF embedding
 *
 * @param content - The content to encode
 * @param size - Target size in points
 * @param errorCorrection - Error correction level
 * @returns Data URL string (data:image/svg+xml;base64,...)
 */
export async function generateQRDataUrl(
  content: string,
  size: number = QR_CODE.size,
  errorCorrection: ErrorCorrectionLevel = QR_CODE.errorCorrection
): Promise<string> {
  const svg = await generateQRSvg(content, size, errorCorrection);
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Batch generate QR codes for multiple contents
 *
 * @param contents - Array of content strings to encode
 * @param size - Target size in points
 * @param errorCorrection - Error correction level
 * @returns Array of data URLs
 */
export async function generateQRDataUrls(
  contents: string[],
  size: number = QR_CODE.size,
  errorCorrection: ErrorCorrectionLevel = QR_CODE.errorCorrection
): Promise<string[]> {
  return Promise.all(
    contents.map((content) => generateQRDataUrl(content, size, errorCorrection))
  );
}

/**
 * Estimate QR code version based on content length
 * Useful for determining if content fits within scanning distance requirements
 *
 * @param content - The content to encode
 * @param errorCorrection - Error correction level
 * @returns Estimated QR version (1-40) and module count
 */
export function estimateQRVersion(
  content: string,
  errorCorrection: ErrorCorrectionLevel = "M"
): { version: number; modules: number } {
  // Capacity table for alphanumeric mode at different error correction levels
  const capacityTable: Record<ErrorCorrectionLevel, number[]> = {
    L: [25, 47, 77, 114, 154, 195, 224, 279, 335, 395],
    M: [20, 38, 61, 90, 122, 154, 178, 221, 262, 311],
    Q: [16, 29, 47, 67, 87, 108, 125, 157, 189, 221],
    H: [10, 20, 35, 50, 64, 84, 93, 122, 143, 174],
  };

  const capacities = capacityTable[errorCorrection];
  const contentLength = content.length;

  for (let version = 1; version <= capacities.length; version++) {
    if (contentLength <= capacities[version - 1]) {
      return {
        version,
        modules: 17 + version * 4, // QR module formula
      };
    }
  }

  // Default to version 10 for longer content
  return { version: 10, modules: 57 };
}
