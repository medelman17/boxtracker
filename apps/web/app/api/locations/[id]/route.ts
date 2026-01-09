import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";
import type { Location } from "@boxtrack/shared";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for updating a location
 * All fields optional for partial updates
 */
const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

// ============================================================================
// Route params type
// ============================================================================

type RouteParams = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// Helper: Transform DB row to Location type
// ============================================================================

function transformLocation(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    name: row.name as string,
    code: row.code as string | null,
    facilityName: row.facility_name as string | null,
    facilityAddress: row.facility_address as string | null,
    widthFeet: row.width_feet as number | null,
    depthFeet: row.depth_feet as number | null,
    heightFeet: row.height_feet as number | null,
    squareFeet: row.square_feet as number | null,
    accessCode: row.access_code as string | null,
    accessHours: row.access_hours as string | null,
    notes: row.notes as string | null,
    color: row.color as string | null,
    icon: row.icon as string | null,
    isActive: row.is_active as boolean,
    isDefault: row.is_default as boolean,
    displayOrder: row.display_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: row.deleted_at as string | null,
  };
}

// ============================================================================
// GET /api/locations/[id] - Get single location
// ============================================================================

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate ID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 3. Fetch location (RLS enforces access)
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("Error fetching location:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // 4. Transform and return location
    return NextResponse.json({ data: transformLocation(data) });
  } catch (err) {
    console.error("Unexpected error in GET /api/locations/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/locations/[id] - Update location
// ============================================================================

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate ID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 3. Parse and validate body
    const body = await request.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // 4. Check if there's anything to update
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // 5. Build update object (trim strings, preserve nulls)
    const updateData: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name.trim();
    }
    if (parsed.data.code !== undefined) {
      updateData.code = parsed.data.code?.trim() || null;
    }
    if (parsed.data.facility_name !== undefined) {
      updateData.facility_name = parsed.data.facility_name?.trim() || null;
    }
    if (parsed.data.facility_address !== undefined) {
      updateData.facility_address = parsed.data.facility_address?.trim() || null;
    }
    if (parsed.data.width_feet !== undefined) {
      updateData.width_feet = parsed.data.width_feet;
    }
    if (parsed.data.depth_feet !== undefined) {
      updateData.depth_feet = parsed.data.depth_feet;
    }
    if (parsed.data.height_feet !== undefined) {
      updateData.height_feet = parsed.data.height_feet;
    }
    if (parsed.data.square_feet !== undefined) {
      updateData.square_feet = parsed.data.square_feet;
    }
    if (parsed.data.access_code !== undefined) {
      updateData.access_code = parsed.data.access_code?.trim() || null;
    }
    if (parsed.data.access_hours !== undefined) {
      updateData.access_hours = parsed.data.access_hours?.trim() || null;
    }
    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes?.trim() || null;
    }
    if (parsed.data.color !== undefined) {
      updateData.color = parsed.data.color;
    }
    if (parsed.data.icon !== undefined) {
      updateData.icon = parsed.data.icon;
    }
    if (parsed.data.is_active !== undefined) {
      updateData.is_active = parsed.data.is_active;
    }
    if (parsed.data.is_default !== undefined) {
      updateData.is_default = parsed.data.is_default;
    }
    if (parsed.data.display_order !== undefined) {
      updateData.display_order = parsed.data.display_order;
    }

    // 6. Update (RLS enforces access)
    const { data, error: updateError } = await supabase
      .from("locations")
      .update(updateData)
      .eq("id", id)
      .is("deleted_at", null)
      .select("id, name")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating location:", updateError);

      if (updateError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to update this location" },
          { status: 403 }
        );
      }

      // Unique constraint violation (one default per household)
      if (updateError.code === "23505") {
        if (updateError.message.includes("default")) {
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

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // 7. Return updated location ID
    return NextResponse.json({ data: { id: data.id, name: data.name } });
  } catch (err) {
    console.error("Unexpected error in PATCH /api/locations/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/locations/[id] - Soft delete location
// ============================================================================

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate ID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // 3. Check if location has pallets
    const { count: palletCount, error: countError } = await supabase
      .from("pallets")
      .select("id", { count: "exact", head: true })
      .eq("location_id", id)
      .is("deleted_at", null);

    if (countError) {
      console.error("Error checking pallets:", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (palletCount && palletCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete location with ${palletCount} pallet${palletCount > 1 ? "s" : ""}. Move or delete pallets first.`,
        },
        { status: 400 }
      );
    }

    // 4. Soft delete (set deleted_at timestamp)
    const { data, error: deleteError } = await supabase
      .from("locations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id, name")
      .maybeSingle();

    if (deleteError) {
      console.error("Error deleting location:", deleteError);

      if (deleteError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to delete this location" },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // 5. Return success
    return NextResponse.json({ data: { id: data.id, name: data.name } });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/locations/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
