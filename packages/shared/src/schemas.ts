import { z } from "zod";

/**
 * Enums matching database types
 */
export const boxStatusSchema = z.enum(["stored", "in_transit", "delivered", "archived"]);
export const userRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

/**
 * Box Type schema - standardized box sizes with dimensions
 */
export const boxTypeSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().max(20),
  description: z.string().max(500).nullable(),
  lengthInches: z.number().positive().nullable(),
  widthInches: z.number().positive().nullable(),
  heightInches: z.number().positive().nullable(),
  maxWeightLbs: z.number().positive().nullable(),
  color: z.string().max(7).nullable(), // Hex color
  icon: z.string().max(50).nullable(),
  isDefault: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const boxTypeInsertSchema = boxTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const boxTypeUpdateSchema = boxTypeSchema
  .omit({
    id: true,
    householdId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .partial();

/**
 * Category schema - for organizing boxes by content type
 */
export const categorySchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  color: z.string().max(7).nullable(), // Hex color
  icon: z.string().max(50).nullable(),
  isDefault: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const categoryInsertSchema = categorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const categoryUpdateSchema = categorySchema
  .omit({
    id: true,
    householdId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .partial();

/**
 * Pallet schema - physical storage platform
 */
export const palletSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  locationDescription: z.string().max(200).nullable(),
  maxRows: z.number().int().positive().default(4),
  defaultPositionsPerRow: z.number().int().positive().default(6),
  isActive: z.boolean().default(true),
  notes: z.string().max(1000).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const palletInsertSchema = palletSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const palletUpdateSchema = palletSchema
  .omit({
    id: true,
    householdId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .partial();

/**
 * Pallet Row schema - horizontal level within a pallet
 */
export const palletRowSchema = z.object({
  id: z.string().uuid(),
  palletId: z.string().uuid(),
  rowNumber: z.number().int().positive(),
  positionsCount: z.number().int().positive().default(6),
  notes: z.string().max(500).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const palletRowInsertSchema = palletRowSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Row Position schema - specific storage slot
 */
export const rowPositionSchema = z.object({
  id: z.string().uuid(),
  rowId: z.string().uuid(),
  positionNumber: z.number().int().positive(),
  isOccupied: z.boolean().default(false),
  isReserved: z.boolean().default(false),
  notes: z.string().max(500).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const rowPositionInsertSchema = rowPositionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Box schema - core entity for tracking storage boxes (V2)
 */
export const boxSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  label: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  boxTypeId: z.string().uuid().nullable(),
  categoryId: z.string().uuid().nullable(),
  positionId: z.string().uuid().nullable(),
  status: boxStatusSchema,
  qrCode: z.string().nullable(),
  photoCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
  deletedAt: z.string().datetime().nullable(),
});

export const boxInsertSchema = boxSchema.omit({
  id: true,
  qrCode: true,
  photoCount: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
  deletedAt: true,
});

export const boxUpdateSchema = boxSchema
  .omit({
    id: true,
    householdId: true,
    qrCode: true,
    photoCount: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .partial();

/**
 * Photo schema - for box content photos (V2)
 */
export const photoSchema = z.object({
  id: z.string().uuid(),
  boxId: z.string().uuid(),
  storagePath: z.string().min(1),
  caption: z.string().max(200).nullable(),
  displayOrder: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const photoInsertSchema = photoSchema.omit({
  id: true,
  createdAt: true,
  deletedAt: true,
});

export const photoUpdateSchema = photoSchema
  .omit({
    id: true,
    boxId: true,
    storagePath: true,
    createdAt: true,
    deletedAt: true,
  })
  .partial();

/**
 * Household schema - for multi-user support (V2)
 */
export const householdSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const householdInsertSchema = householdSchema.omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const householdUpdateSchema = householdSchema
  .omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .partial();

/**
 * User household membership schema (V2)
 */
export const userHouseholdSchema = z.object({
  userId: z.string().uuid(),
  householdId: z.string().uuid(),
  role: userRoleSchema,
  createdAt: z.string().datetime(),
});

export const userHouseholdInsertSchema = userHouseholdSchema.omit({
  createdAt: true,
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

/**
 * Authentication schemas
 */

// Email validation (reusable, lowercase and trimmed)
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim();

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and number"
  );

// Signup request schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(1).max(100).trim().optional(),
});

// Login request schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
});

// Password reset request
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset confirm
export const passwordResetConfirmSchema = z.object({
  password: passwordSchema,
});

// Session user schema (derived from Supabase session)
export const sessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  fullName: z.string().nullable(),
  createdAt: z.string().datetime(),
});

// Household with user role (for auth context)
export const householdWithRoleSchema = householdSchema.extend({
  role: userRoleSchema,
  joinedAt: z.string().datetime(),
});
