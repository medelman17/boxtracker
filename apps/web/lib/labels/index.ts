/**
 * Avery 5168 Label System
 *
 * Complete label generation system for BoxTracker using the Avery 5168
 * die-cut standard. Produces vector-based PDFs with high-contrast QR codes
 * optimized for industrial scanning at distances up to 30 inches.
 *
 * @example
 * ```typescript
 * import { generateLabelPdf } from "@/lib/labels";
 *
 * const boxes = [
 *   { id: "abc123", name: "Kitchen" },
 *   { id: "def456", name: "Books" },
 * ];
 *
 * const pdfBuffer = await generateLabelPdf(boxes);
 * ```
 */

// Geometry constants and utilities
export {
  // Constants
  SHEET,
  LABEL,
  MARGINS,
  GUTTERS,
  GRID,
  LABEL_POSITIONS,
  ZONES,
  QR_CODE,
  TYPOGRAPHY,
  // Utilities
  inchesToPoints,
  pointsToInches,
  mmToPoints,
  pointsToMm,
  getLabelPosition,
  calculatePageCount,
  chunkIntoPages,
  formatBoxId,
  generateBoxUrl,
  // Types
  type LabelPosition,
  type Calibration,
  type LabelBox,
  type LabelRequest,
} from "./avery-5168";

// QR code vector generation
export {
  generateQRPath,
  generateQRSvg,
  generateQRDataUrl,
  generateQRDataUrls,
  estimateQRVersion,
  type ErrorCorrectionLevel,
  type QRCodeData,
} from "./qr-vector";

// Label PDF generation
export {
  LabelDocument,
  prepareLabelData,
  generateLabelPdf,
  type LabelData,
  type LabelDocumentProps,
} from "./label-generator";
