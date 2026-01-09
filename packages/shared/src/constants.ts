/**
 * Application constants shared across web and mobile
 */

/**
 * Deep link configuration
 */
export const DEEP_LINK_SCHEME = "boxtrack";
export const DEEP_LINK_DOMAIN = "app.boxtrack.com";

/**
 * QR code configuration
 */
export const QR_CODE_PREFIX = `${DEEP_LINK_SCHEME}://box/`;

/**
 * Image upload configuration
 */
export const IMAGE_CONFIG = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  format: "jpeg" as const,
  thumbnailMaxWidth: 300,
  thumbnailMaxHeight: 300,
  thumbnailQuality: 0.7,
};

/**
 * Supabase storage configuration
 */
export const STORAGE_CONFIG = {
  bucketName: "box-photos",
  pathTemplate: "{householdId}/{boxId}/{uuid}.jpg",
  signedUrlExpiry: 3600, // 1 hour in seconds
};

/**
 * Box status colors (for UI) - matching database enum
 */
export const BOX_STATUS_COLORS = {
  empty: "#9CA3AF", // gray - empty box ready for packing
  packing: "#F59E0B", // orange - currently being packed
  packed: "#3B82F6", // blue - packed and sealed
  stored: "#10B981", // green - in storage
  retrieved: "#8B5CF6", // purple - retrieved from storage
} as const;

/**
 * Category colors (for label generation)
 */
export const CATEGORY_COLORS = {
  kitchen: "#EF4444",
  bedroom: "#8B5CF6",
  bathroom: "#06B6D4",
  office: "#F59E0B",
  living: "#10B981",
  garage: "#6B7280",
  other: "#EC4899",
} as const;

/**
 * Label generation configuration (Avery 5164 - legacy)
 */
export const LABEL_CONFIG = {
  format: "Avery 5164",
  width: 4, // inches
  height: 3.33, // inches
  labelsPerSheet: 6,
  marginTop: 0.5,
  marginBottom: 0.5,
  marginLeft: 0.16,
  marginRight: 0.16,
  columns: 2,
  rows: 3,
  gapX: 0.14,
  gapY: 0,
};

/**
 * Avery 5168 label configuration
 * Large shipping labels: 3.5" × 5.0", 4 per sheet (2×2 grid)
 * Optimized for QR code scanning at up to 30 inches
 */
export const AVERY_5168_CONFIG = {
  format: "Avery 5168",
  // Sheet dimensions (US Letter)
  sheet: {
    width: 8.5, // inches
    height: 11.0, // inches
    widthPt: 612, // points
    heightPt: 792, // points
  },
  // Label dimensions
  label: {
    width: 3.5, // inches
    height: 5.0, // inches
    widthPt: 252, // points
    heightPt: 360, // points
  },
  // Margins
  margins: {
    top: 0.5, // inches
    bottom: 0.5, // inches
    left: 0.5, // inches
    right: 0.5, // inches
    topPt: 36, // points
    bottomPt: 36, // points
    leftPt: 36, // points
    rightPt: 36, // points
  },
  // Gutters
  gutters: {
    horizontal: 0.5, // inches
    vertical: 0.0, // inches
    horizontalPt: 36, // points
    verticalPt: 0, // points
  },
  // Grid configuration
  grid: {
    columns: 2,
    rows: 2,
    labelsPerSheet: 4,
  },
  // Label positions (X, Y in points)
  positions: [
    { x: 36, y: 36 }, // Label 0: top-left
    { x: 324, y: 36 }, // Label 1: top-right
    { x: 36, y: 396 }, // Label 2: bottom-left
    { x: 324, y: 396 }, // Label 3: bottom-right
  ],
  // Tri-zone layout (heights in points)
  zones: {
    header: 72, // 1.0" - 20% of label height
    qrBody: 216, // 3.0" - 60% of label height
    void: 72, // 1.0" - 20% of label height
  },
  // QR code sizing
  qrCode: {
    size: 216, // points (3.0")
    quietZone: 18, // points (0.25")
    errorCorrection: "M" as const, // 15% recovery
  },
  // Typography
  typography: {
    headerFontSize: 18,
    headerFontWeight: 700,
    headerLetterSpacing: 4,
  },
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  limit: 20,
  maxLimit: 100,
};

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  boxLabelMaxLength: 100,
  boxDescriptionMaxLength: 500,
  photoCaptionMaxLength: 200,
  householdNameMaxLength: 100,
  categoryMaxLength: 50,
  palletIdMaxLength: 10,
};
