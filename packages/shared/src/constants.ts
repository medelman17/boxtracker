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
 * Label generation configuration (Avery 5164)
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
