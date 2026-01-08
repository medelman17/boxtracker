import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for updating a household
 */
const updateHouseholdSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only")
    .optional(),
});

// ============================================================================
// Route params type
// ============================================================================

type RouteParams = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// Helper: Check user's role in household
// ============================================================================

async function getUserRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  householdId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("user_households")
    .select("role")
    .eq("user_id", userId)
    .eq("household_id", householdId)
    .maybeSingle();

  return data?.role || null;
}

// ============================================================================
// PUT /api/households/[id] - Update household
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

    // 3. Check user's role (only owner or admin can update)
    const role = await getUserRole(supabase, user.id, id);

    if (!role) {
      return NextResponse.json(
        { error: "Household not found" },
        { status: 404 }
      );
    }

    if (role !== "owner" && role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can update household settings" },
        { status: 403 }
      );
    }

    // 4. Parse and validate body
    const body = await request.json();
    const parsed = updateHouseholdSchema.safeParse(body);

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
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.name) {
      updateData.name = parsed.data.name.trim();
    }
    if (parsed.data.slug) {
      updateData.slug = parsed.data.slug;
    }

    // 7. Update household
    const { data, error: updateError } = await supabase
      .from("households")
      .update(updateData)
      .eq("id", id)
      .is("deleted_at", null)
      .select("id, name, slug")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating household:", updateError);

      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "A household with this slug already exists" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Household not found" },
        { status: 404 }
      );
    }

    // 8. Return updated household
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Unexpected error in PUT /api/households/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/households/[id] - Soft delete household
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

    // 3. Check user's role (only owner can delete)
    const role = await getUserRole(supabase, user.id, id);

    if (!role) {
      return NextResponse.json(
        { error: "Household not found" },
        { status: 404 }
      );
    }

    if (role !== "owner") {
      return NextResponse.json(
        { error: "Only the owner can delete a household" },
        { status: 403 }
      );
    }

    // 4. Soft delete household
    const { data, error: deleteError } = await supabase
      .from("households")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      console.error("Error deleting household:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Household not found" },
        { status: 404 }
      );
    }

    // 5. Return success
    return NextResponse.json({ data: { id: data.id } });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/households/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
