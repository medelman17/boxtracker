import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for updating a category
 */
const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
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
// PUT /api/categories/[id] - Update household-specific category
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

    // 3. Check if category exists and is household-specific (not system default)
    const { data: category, error: fetchError } = await supabase
      .from("categories")
      .select("id, household_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching category:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category.household_id === null) {
      return NextResponse.json(
        { error: "Cannot modify system default categories" },
        { status: 403 }
      );
    }

    // 4. Parse and validate body
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

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

    // 7. Update category (RLS enforces access)
    const { data, error: updateError } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select("id, name")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating category:", updateError);

      if (updateError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to update this category" },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // 8. Return updated category
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Unexpected error in PUT /api/categories/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/categories/[id] - Delete household-specific category
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

    // 3. Check if category exists and is household-specific
    const { data: category, error: fetchError } = await supabase
      .from("categories")
      .select("id, household_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching category:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category.household_id === null) {
      return NextResponse.json(
        { error: "Cannot delete system default categories" },
        { status: 403 }
      );
    }

    // 4. Delete category (hard delete since categories don't have deleted_at)
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting category:", deleteError);

      if (deleteError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to delete this category" },
          { status: 403 }
        );
      }
      if (deleteError.code === "23503") {
        return NextResponse.json(
          { error: "Cannot delete category that is in use by boxes" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 5. Return success
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/categories/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
