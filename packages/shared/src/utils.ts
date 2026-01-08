import { QR_CODE_PREFIX } from "./constants";

/**
 * Format location to string from components
 * @param palletCode - Pallet code (e.g., "A")
 * @param rowNumber - Row number
 * @param positionNumber - Position number
 * @returns Formatted location string (e.g., "A/3/2")
 */
export function formatLocation(
  palletCode: string | null,
  rowNumber: number | null,
  positionNumber: number | null
): string {
  if (!palletCode || !rowNumber || !positionNumber) return "Not assigned";
  return `${palletCode}/${rowNumber}/${positionNumber}`;
}

/**
 * Parse location string to components
 * @param locationStr - Location string (e.g., "A/3/2")
 * @returns Object with pallet, row, position or null if invalid
 */
export function parseLocation(locationStr: string): {
  pallet: string;
  row: number;
  position: number;
} | null {
  const parts = locationStr.split("/");
  if (parts.length !== 3) return null;

  const pallet = parts[0];
  const row = parseInt(parts[1], 10);
  const position = parseInt(parts[2], 10);

  if (!pallet || isNaN(row) || isNaN(position)) return null;

  return { pallet, row, position };
}

/**
 * Generate QR code content for a box
 * @param boxId - Box UUID
 * @returns QR code content string
 */
export function generateQRCodeContent(boxId: string): string {
  return `${QR_CODE_PREFIX}${boxId}`;
}

/**
 * Extract box ID from QR code content
 * @param qrContent - QR code content string
 * @returns Box UUID or null if invalid
 */
export function extractBoxIdFromQR(qrContent: string): string | null {
  if (!qrContent.startsWith(QR_CODE_PREFIX)) return null;
  return qrContent.replace(QR_CODE_PREFIX, "");
}

/**
 * Format date to human-readable string
 * @param dateStr - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Format date with time
 * @param dateStr - ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Calculate pagination offset
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Offset for database query
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages
 * @param total - Total number of items
 * @param limit - Items per page
 * @returns Total number of pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}
