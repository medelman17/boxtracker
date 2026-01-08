import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for updating a box type
 */
const updateBoxTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  code: z.string().max(20).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
  length: z.number().positive().nullable().optional(),
  width: z.number().positive().nullable().optional(),
  height: z.number().positive().nullable().optional(),
  weight_limit_lbs: z.number().positive().nullable().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

// ============================================================================
// Route params type
// ============================================================================

type RouteParams = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// PUT /api/box-types/[id] - Update household-specific box type
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

    // 3. Check if box type exists and is household-specific (not system default)
    const { data: boxType, error: fetchError } = await supabase
      .from("box_types")
      .select("id, household_id, length, width, height")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching box type:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!boxType) {
      return NextResponse.json({ error: "Box type not found" }, { status: 404 });
    }

    if (boxType.household_id === null) {
      return NextResponse.json(
        { error: "Cannot modify system default box types" },
        { status: 403 }
      );
    }

    // 4. Parse and validate body
    const body = await request.json();
    const parsed = updateBoxTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // 5. Check if there's anything to update
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // 6. Build update data
    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    if (typeof updateData.name === "string") {
      updateData.name = updateData.name.trim();
    }
    if (typeof updateData.description === "string") {
      updateData.description = updateData.description.trim() || null;
    }
    if (typeof updateData.code === "string") {
      updateData.code = updateData.code.trim() || null;
    }

    // Recalculate volume if dimensions changed
    const finalLength = (updateData.length as number | null | undefined) ?? boxType.length;
    const finalWidth = (updateData.width as number | null | undefined) ?? boxType.width;
    const finalHeight = (updateData.height as number | null | undefined) ?? boxType.height;

    if (finalLength && finalWidth && finalHeight) {
      updateData.volume_cubic_ft = (finalLength * finalWidth * finalHeight) / 1728;
    }

    // 7. Update box type (RLS enforces access)
    const { data, error: updateError } = await supabase
      .from("box_types")
      .update(updateData)
      .eq("id", id)
      .select("id, name")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating box type:", updateError);

      if (updateError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to update this box type" },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Box type not found" }, { status: 404 });
    }

    // 8. Return updated box type
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Unexpected error in PUT /api/box-types/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/box-types/[id] - Delete household-specific box type
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

    // 3. Check if box type exists and is household-specific
    const { data: boxType, error: fetchError } = await supabase
      .from("box_types")
      .select("id, household_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching box type:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!boxType) {
      return NextResponse.json({ error: "Box type not found" }, { status: 404 });
    }

    if (boxType.household_id === null) {
      return NextResponse.json(
        { error: "Cannot delete system default box types" },
        { status: 403 }
      );
    }

    // 4. Delete box type (hard delete since box_types don't have deleted_at)
    const { error: deleteError } = await supabase
      .from("box_types")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting box type:", deleteError);

      if (deleteError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to delete this box type" },
          { status: 403 }
        );
      }
      if (deleteError.code === "23503") {
        return NextResponse.json(
          { error: "Cannot delete box type that is in use by boxes" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 5. Return success
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/box-types/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
