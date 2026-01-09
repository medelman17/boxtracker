/**
 * Avery 5168 label geometry constants and utilities
 *
 * Avery 5168 format: 4 large shipping labels per US Letter sheet (2×2 grid)
 * Label dimensions: 3.5" × 5.0" (252pt × 360pt)
 *
 * @see https://www.avery.com/templates/5168
 */

// Conversion utilities
export const inchesToPoints = (inches: number): number => inches * 72;
export const pointsToInches = (points: number): number => points / 72;
export const mmToPoints = (mm: number): number => mm * 2.834645669;
export const pointsToMm = (points: number): number => points / 2.834645669;

/**
 * US Letter sheet dimensions
 */
export const SHEET = {
  width: 8.5,
  height: 11.0,
  widthPt: 612,
  heightPt: 792,
} as const;

/**
 * Label dimensions
 */
export const LABEL = {
  width: 3.5,
  height: 5.0,
  widthPt: 252,
  heightPt: 360,
} as const;

/**
 * Page margins
 */
export const MARGINS = {
  top: 0.5,
  bottom: 0.5,
  left: 0.5,
  right: 0.5,
  topPt: 36,
  bottomPt: 36,
  leftPt: 36,
  rightPt: 36,
} as const;

/**
 * Gutters between labels
 */
export const GUTTERS = {
  horizontal: 0.5,
  vertical: 0.0,
  horizontalPt: 36,
  verticalPt: 0,
} as const;

/**
 * Grid configuration
 */
export const GRID = {
  columns: 2,
  rows: 2,
  labelsPerSheet: 4,
} as const;

/**
 * Label positions (X, Y in points)
 * Ordered by row-major (left-to-right, top-to-bottom)
 */
export const LABEL_POSITIONS = [
  { x: 36, y: 36, column: 0, row: 0, index: 0 }, // Top-left
  { x: 324, y: 36, column: 1, row: 0, index: 1 }, // Top-right
  { x: 36, y: 396, column: 0, row: 1, index: 2 }, // Bottom-left
  { x: 324, y: 396, column: 1, row: 1, index: 3 }, // Bottom-right
] as const;

/**
 * Tri-zone layout heights in points
 * Each label is divided into 3 vertical zones:
 * - Header: 72pt (1.0") - Box ID display
 * - QR Body: 216pt (3.0") - QR code area
 * - Void: 72pt (1.0") - Whitespace/future annotations
 */
export const ZONES = {
  header: 72,
  qrBody: 216,
  void: 72,
} as const;

/**
 * QR code configuration
 */
export const QR_CODE = {
  size: 216, // points (3.0")
  quietZone: 18, // points (0.25")
  errorCorrection: "M" as const, // 15% recovery
  maxModules: 40, // For URL version detection
} as const;

/**
 * Typography configuration
 */
export const TYPOGRAPHY = {
  headerFontFamily: "Courier",
  headerFontSize: 18,
  headerFontWeight: 700,
  headerLetterSpacing: 4,
  headerColor: "#000000",
} as const;

/**
 * Calculate label position by index
 */
export function getLabelPosition(index: number): { x: number; y: number } {
  const column = index % GRID.columns;
  const row = Math.floor(index / GRID.columns);

  return {
    x: MARGINS.leftPt + column * (LABEL.widthPt + GUTTERS.horizontalPt),
    y: MARGINS.topPt + row * (LABEL.heightPt + GUTTERS.verticalPt),
  };
}

/**
 * Calculate number of pages needed for a given number of labels
 */
export function calculatePageCount(labelCount: number): number {
  return Math.ceil(labelCount / GRID.labelsPerSheet);
}

/**
 * Chunk array into pages of labels
 */
export function chunkIntoPages<T>(items: T[]): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += GRID.labelsPerSheet) {
    pages.push(items.slice(i, i + GRID.labelsPerSheet));
  }
  return pages;
}

/**
 * Format box ID for display
 * - Strips common prefixes (box_, BOX_, box-)
 * - For UUIDs: displays first 8 hex characters
 * - Truncates to 12 characters max
 * - Converts to uppercase
 */
export function formatBoxId(id: string): string {
  // Strip common prefixes
  let formatted = id
    .replace(/^box[_-]/i, "")
    .replace(/^BOX[_-]/, "");

  // For UUID format, take first 8 chars
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(formatted)) {
    formatted = formatted.substring(0, 8);
  }

  // Truncate if needed
  if (formatted.length > 12) {
    formatted = formatted.substring(0, 12);
  }

  return formatted.toUpperCase();
}

/**
 * Generate the box URL for QR code encoding
 */
export function generateBoxUrl(boxId: string, baseUrl?: string): string {
  const base = baseUrl || "https://oubx.vercel.app";
  return `${base}/box/${boxId}`;
}

/**
 * Types for label generation
 */
export type LabelPosition = (typeof LABEL_POSITIONS)[number];

export type Calibration = {
  x: number; // Horizontal offset in points (-36 to 36)
  y: number; // Vertical offset in points (-36 to 36)
};

export type LabelBox = {
  id: string;
  name?: string;
};

export type LabelRequest = {
  boxes: LabelBox[];
  calibration?: Calibration;
  fetchDetails?: boolean;
};
