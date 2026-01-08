import { z } from "zod";
import {
  // Enums
  boxStatusSchema,
  userRoleSchema,
  // Box Types
  boxTypeSchema,
  boxTypeInsertSchema,
  boxTypeUpdateSchema,
  // Categories
  categorySchema,
  categoryInsertSchema,
  categoryUpdateSchema,
  // Pallets
  palletSchema,
  palletInsertSchema,
  palletUpdateSchema,
  // Pallet Rows
  palletRowSchema,
  palletRowInsertSchema,
  // Row Positions
  rowPositionSchema,
  rowPositionInsertSchema,
  // Boxes
  boxSchema,
  boxInsertSchema,
  boxUpdateSchema,
  // Photos
  photoSchema,
  photoInsertSchema,
  photoUpdateSchema,
  // Households
  householdSchema,
  householdInsertSchema,
  householdUpdateSchema,
  // User Households
  userHouseholdSchema,
  userHouseholdInsertSchema,
  // API
  apiErrorSchema,
  // Authentication
  signupSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  sessionUserSchema,
  householdWithRoleSchema,
} from "./schemas";

/**
 * Derive types from Zod schemas (single source of truth)
 */

// Enums
export type BoxStatus = z.infer<typeof boxStatusSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

// Box Type types
export type BoxType = z.infer<typeof boxTypeSchema>;
export type BoxTypeInsert = z.infer<typeof boxTypeInsertSchema>;
export type BoxTypeUpdate = z.infer<typeof boxTypeUpdateSchema>;

// Category types
export type Category = z.infer<typeof categorySchema>;
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

// Pallet types
export type Pallet = z.infer<typeof palletSchema>;
export type PalletInsert = z.infer<typeof palletInsertSchema>;
export type PalletUpdate = z.infer<typeof palletUpdateSchema>;

// Pallet Row types
export type PalletRow = z.infer<typeof palletRowSchema>;
export type PalletRowInsert = z.infer<typeof palletRowInsertSchema>;

// Row Position types
export type RowPosition = z.infer<typeof rowPositionSchema>;
export type RowPositionInsert = z.infer<typeof rowPositionInsertSchema>;

// Box types
export type Box = z.infer<typeof boxSchema>;
export type BoxInsert = z.infer<typeof boxInsertSchema>;
export type BoxUpdate = z.infer<typeof boxUpdateSchema>;

// Photo types
export type Photo = z.infer<typeof photoSchema>;
export type PhotoInsert = z.infer<typeof photoInsertSchema>;
export type PhotoUpdate = z.infer<typeof photoUpdateSchema>;

// Household types
export type Household = z.infer<typeof householdSchema>;
export type HouseholdInsert = z.infer<typeof householdInsertSchema>;
export type HouseholdUpdate = z.infer<typeof householdUpdateSchema>;

// User Household types
export type UserHousehold = z.infer<typeof userHouseholdSchema>;
export type UserHouseholdInsert = z.infer<typeof userHouseholdInsertSchema>;

// API response types
export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Composite types for denormalized views and queries
 */

// Box with full location details (from v_boxes_with_location view)
export type BoxWithLocation = Box & {
  palletCode: string | null;
  palletName: string | null;
  rowNumber: number | null;
  positionNumber: number | null;
  fullLocation: string | null; // e.g., "A/3/2"
};

// Box with photos
export type BoxWithPhotos = Box & {
  photos: Photo[];
};

// Box with full details (photos, category, type, location)
export type BoxWithDetails = Box & {
  photos: Photo[];
  category: Category | null;
  boxType: BoxType | null;
  position: RowPosition | null;
};

// Available position (from v_available_positions view)
export type AvailablePosition = {
  positionId: string;
  householdId: string;
  palletId: string;
  palletCode: string;
  palletName: string;
  rowId: string;
  rowNumber: number;
  positionNumber: number;
  fullLocation: string; // e.g., "A/3/2"
  isReserved: boolean;
};

// Pallet capacity (from v_pallet_capacity view)
export type PalletCapacity = {
  palletId: string;
  householdId: string;
  palletCode: string;
  palletName: string;
  totalRows: number;
  totalPositions: number;
  occupiedPositions: number;
  availablePositions: number;
  utilizationPercent: number;
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

/**
 * Authentication types
 */

// Auth input types
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;

// Session types
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type HouseholdWithRole = z.infer<typeof householdWithRoleSchema>;

// Auth state for context providers
export type AuthState = {
  user: SessionUser | null;
  activeHousehold: HouseholdWithRole | null;
  households: HouseholdWithRole[];
  loading: boolean;
  initialized: boolean;
};

// Auth context value with actions
export type AuthContextValue = AuthState & {
  signUp: (input: SignupInput) => Promise<{ error: string | null }>;
  signIn: (input: LoginInput) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  switchHousehold: (householdId: string) => void;
  refreshSession: () => Promise<void>;
};

/**
 * Supabase Query Result Types
 *
 * These types match the shape returned by specific Supabase queries with joins.
 * Use these instead of `as any` casts for type safety.
 */

// Query: .from("user_households").select("household_id, households(id, name)")
export type UserHouseholdWithHouseholdName = {
  household_id: string;
  households: {
    id: string;
    name: string;
  } | null;
};

// Query: .from("user_households").select("role, joined_at, household:households(...)")
export type UserHouseholdQueryResult = {
  role: string;
  joined_at: string;
  household: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  } | null;
};

// Query: .from("boxes").select("id, label, status, ..., categories(name), box_types(name)")
export type BoxListItem = {
  id: string;
  label: string;
  status: BoxStatus;
  description: string | null;
  photo_count: number;
  created_at: string;
  categories: { name: string } | null;
  box_types: { name: string } | null;
};

// Query: .from("boxes").select("*, box_types(*), categories(*), photos(*), row_positions(...)")
export type BoxDetailQueryResult = {
  id: string;
  household_id: string;
  label: string;
  description: string | null;
  status: BoxStatus;
  qr_code: string | null;
  photo_count: number;
  box_type_id: string | null;
  category_id: string | null;
  position_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  deleted_at: string | null;
  packed_at: string | null;
  stored_at: string | null;
  retrieved_at: string | null;
  actual_weight_lbs: number | null;
  assigned_to: string | null;
  box_types: {
    id: string;
    name: string;
    description: string | null;
    code: string | null;
    color: string | null;
    icon: string | null;
    length: number | null;
    width: number | null;
    height: number | null;
    weight_limit_lbs: number | null;
    volume_cubic_ft: number | null;
    is_default: boolean;
    is_active: boolean;
    display_order: number;
    household_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  categories: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    is_default: boolean;
    is_active: boolean;
    display_order: number;
    household_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  photos: Array<{
    id: string;
    box_id: string;
    url: string;
    storage_path: string;
    description: string | null;
    display_order: number;
    created_at: string;
    deleted_at: string | null;
  }>;
  row_positions: {
    position_number: number;
    pallet_rows: {
      row_number: number;
      pallets: {
        code: string;
        name: string;
      } | null;
    } | null;
  } | null;
};
