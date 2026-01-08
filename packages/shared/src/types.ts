import { z } from "zod";
import {
  boxSchema,
  boxInsertSchema,
  boxUpdateSchema,
  boxStatusSchema,
  locationSchema,
  photoSchema,
  photoInsertSchema,
  householdSchema,
  userHouseholdSchema,
  apiErrorSchema,
} from "./schemas";

/**
 * Derive types from Zod schemas (single source of truth)
 */

// Box types
export type Box = z.infer<typeof boxSchema>;
export type BoxInsert = z.infer<typeof boxInsertSchema>;
export type BoxUpdate = z.infer<typeof boxUpdateSchema>;
export type BoxStatus = z.infer<typeof boxStatusSchema>;

// Location type
export type Location = z.infer<typeof locationSchema>;

// Photo types
export type Photo = z.infer<typeof photoSchema>;
export type PhotoInsert = z.infer<typeof photoInsertSchema>;

// Household types
export type Household = z.infer<typeof householdSchema>;
export type UserHousehold = z.infer<typeof userHouseholdSchema>;

// API response types
export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Composite types
 */
export type BoxWithPhotos = Box & {
  photos: Photo[];
};

export type BoxWithDetails = Box & {
  photos: Photo[];
  photoCount: number;
};

/**
 * Utility types
 */
export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
