import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";
import type { BoxDetailQueryResult } from "@boxtrack/shared";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for updating a box
 * All fields optional for partial updates
 */
const updateBoxSchema = z.object({
  label: z.string().min(1, "Label is required").max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["empty", "packing", "packed", "stored", "retrieved"]).optional(),
  category_id: z.string().uuid().nullable().optional(),
  box_type_id: z.string().uuid().nullable().optional(),
  position_id: z.string().uuid().nullable().optional(),
});

// ============================================================================
// Route params type
// ============================================================================

type RouteParams = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// GET /api/boxes/[id] - Get single box with relations
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

    // 3. Fetch box with all relations (RLS enforces access)
    const { data, error } = await supabase
      .from("boxes")
      .select(`
        *,
        box_types(*),
        categories(*),
        photos(*),
        row_positions(
          position_number,
          pallet_rows(
            row_number,
            pallets(code, name)
          )
        )
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("Error fetching box:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    // 4. Return box
    return NextResponse.json({ data: data as unknown as BoxDetailQueryResult });
  } catch (err) {
    console.error("Unexpected error in GET /api/boxes/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/boxes/[id] - Update box
// ============================================================================

export async function PUT(request: Request, { params }: RouteParams) {
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
    const parsed = updateBoxSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // 4. Check if there's anything to update
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // 5. Build update data with timestamps for status changes
    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    // Set timestamp fields based on status transitions
    if (parsed.data.status === "packed" && !updateData.packed_at) {
      updateData.packed_at = new Date().toISOString();
    }
    if (parsed.data.status === "stored" && !updateData.stored_at) {
      updateData.stored_at = new Date().toISOString();
    }
    if (parsed.data.status === "retrieved" && !updateData.retrieved_at) {
      updateData.retrieved_at = new Date().toISOString();
    }

    // Trim string fields
    if (typeof updateData.label === "string") {
      updateData.label = updateData.label.trim();
    }
    if (typeof updateData.description === "string") {
      updateData.description = updateData.description.trim() || null;
    }

    // 6. Update (RLS enforces access)
    const { data, error: updateError } = await supabase
      .from("boxes")
      .update(updateData)
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating box:", updateError);

      if (updateError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to update this box" },
          { status: 403 }
        );
      }
      if (updateError.code === "23503") {
        return NextResponse.json(
          { error: "Invalid category, box type, or position reference" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    // 7. Return updated box ID
    return NextResponse.json({ data: { id: data.id } });
  } catch (err) {
    console.error("Unexpected error in PUT /api/boxes/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/boxes/[id] - Soft delete box
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

    // 3. Soft delete (set deleted_at timestamp)
    const { data, error: deleteError } = await supabase
      .from("boxes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      console.error("Error deleting box:", deleteError);

      if (deleteError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to delete this box" },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    // 4. Return success
    return NextResponse.json({ data: { id: data.id } });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/boxes/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
