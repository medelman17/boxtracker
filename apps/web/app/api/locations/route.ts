import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";
import type { Location, LocationCapacity } from "@boxtrack/shared";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for query parameters (GET list)
 */
const listQuerySchema = z.object({
  household_id: z.string().uuid(),
  include_capacity: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  is_active: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Schema for creating a new location
 * Uses snake_case to match database column names
 */
const createLocationSchema = z.object({
  household_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().max(20).nullable().optional(),
  facility_name: z.string().max(200).nullable().optional(),
  facility_address: z.string().max(500).nullable().optional(),
  width_feet: z.number().positive().nullable().optional(),
  depth_feet: z.number().positive().nullable().optional(),
  height_feet: z.number().positive().nullable().optional(),
  square_feet: z.number().positive().nullable().optional(),
  access_code: z.string().max(100).nullable().optional(),
  access_hours: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
  display_order: z.number().int().min(0).default(0),
});

// ============================================================================
// GET /api/locations - List locations
// ============================================================================

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsed = listQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { household_id, include_capacity, is_active, limit, offset } = parsed.data;

    // 3. Query database - use view if capacity requested
    if (include_capacity) {
      let query = supabase
        .from("v_location_capacity")
        .select("*", { count: "exact" })
        .eq("household_id", household_id)
        .order("display_order", { ascending: true })
        .range(offset, offset + limit - 1);

      if (is_active !== undefined) {
        query = query.eq("is_active", is_active);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching locations with capacity:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Transform view columns to camelCase for response
      const transformedData: LocationCapacity[] = (data || []).map((row) => ({
        locationId: row.location_id,
        householdId: row.household_id,
        locationName: row.location_name,
        locationCode: row.location_code,
        facilityName: row.facility_name,
        color: row.color,
        isActive: row.is_active,
        isDefault: row.is_default,
        totalPallets: row.total_pallets,
        activePallets: row.active_pallets,
        totalPositions: row.total_positions,
        occupiedPositions: row.occupied_positions,
        availablePositions: row.available_positions,
        boxCount: row.box_count,
        utilizationPercent: row.utilization_percent,
      }));

      return NextResponse.json({ data: transformedData, count });
    }

    // Standard query without capacity
    let query = supabase
      .from("locations")
      .select("*", { count: "exact" })
      .eq("household_id", household_id)
      .is("deleted_at", null)
      .order("display_order", { ascending: true })
      .range(offset, offset + limit - 1);

    if (is_active !== undefined) {
      query = query.eq("is_active", is_active);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching locations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to camelCase
    const transformedData: Location[] = (data || []).map((row) => ({
      id: row.id,
      householdId: row.household_id,
      name: row.name,
      code: row.code,
      facilityName: row.facility_name,
      facilityAddress: row.facility_address,
      widthFeet: row.width_feet,
      depthFeet: row.depth_feet,
      heightFeet: row.height_feet,
      squareFeet: row.square_feet,
      accessCode: row.access_code,
      accessHours: row.access_hours,
      notes: row.notes,
      color: row.color,
      icon: row.icon,
      isActive: row.is_active,
      isDefault: row.is_default,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));

    return NextResponse.json({ data: transformedData, count });
  } catch (err) {
    console.error("Unexpected error in GET /api/locations:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/locations - Create a new location
// ============================================================================

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      household_id,
      name,
      code,
      facility_name,
      facility_address,
      width_feet,
      depth_feet,
      height_feet,
      square_feet,
      access_code,
      access_hours,
      notes,
      color,
      icon,
      is_active,
      is_default,
      display_order,
    } = parsed.data;

    // 3. Insert location (RLS will verify household membership)
    const { data: location, error: insertError } = await supabase
      .from("locations")
      .insert({
        household_id,
        name: name.trim(),
        code: code?.trim() || null,
        facility_name: facility_name?.trim() || null,
        facility_address: facility_address?.trim() || null,
        width_feet: width_feet || null,
        depth_feet: depth_feet || null,
        height_feet: height_feet || null,
        square_feet: square_feet || null,
        access_code: access_code?.trim() || null,
        access_hours: access_hours?.trim() || null,
        notes: notes?.trim() || null,
        color: color || "#6B7280",
        icon: icon || null,
        is_active,
        is_default,
        display_order,
      })
      .select("id, name")
      .single();

    if (insertError) {
      console.error("Error creating location:", insertError);

      // Handle specific error cases
      if (insertError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to create locations in this household" },
          { status: 403 }
        );
      }

      // Unique constraint violation (one default per household)
      if (insertError.code === "23505") {
        if (insertError.message.includes("default")) {
          return NextResponse.json(
            { error: "A default location already exists for this household" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "A location with this name or code already exists" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: { id: location.id, name: location.name } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in POST /api/locations:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
