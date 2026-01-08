import { z } from "zod";

/**
 * Location schema for box positioning
 * Format: pallet/row/position (e.g., "A/3/2")
 */
export const locationSchema = z.object({
  pallet: z.string().min(1).max(10),
  row: z.number().int().positive(),
  position: z.number().int().positive(),
});

/**
 * Box status enum
 */
export const boxStatusSchema = z.enum(["open", "closed", "packed"]);

/**
 * Box schema - core entity for tracking storage boxes
 */
export const boxSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  label: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: boxStatusSchema,
  location: locationSchema.nullable(),
  category: z.string().max(50).optional(),
  qrCode: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
});

/**
 * Box insert schema - for creating new boxes
 */
export const boxInsertSchema = boxSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Box update schema - for updating existing boxes
 */
export const boxUpdateSchema = boxSchema
  .omit({
    id: true,
    householdId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

/**
 * Photo schema - for box content photos
 */
export const photoSchema = z.object({
  id: z.string().uuid(),
  boxId: z.string().uuid(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().max(200).optional(),
  createdAt: z.string().datetime(),
});

/**
 * Photo insert schema
 */
export const photoInsertSchema = photoSchema.omit({
  id: true,
  createdAt: true,
});

/**
 * Household schema - for multi-user support
 */
export const householdSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * User household membership schema
 */
export const userHouseholdSchema = z.object({
  userId: z.string().uuid(),
  householdId: z.string().uuid(),
  role: z.enum(["owner", "member"]),
  createdAt: z.string().datetime(),
});

/**
 * API response schemas
 */
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
});

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
  });
