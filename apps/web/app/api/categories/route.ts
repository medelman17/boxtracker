import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for query parameters (GET list)
 */
const listQuerySchema = z.object({
  household_id: z.string().uuid().optional(),
});

/**
 * Schema for creating a category
 */
const createCategorySchema = z.object({
  household_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .nullable()
    .optional(),
  icon: z.string().max(50).nullable().optional(),
});

// ============================================================================
// GET /api/categories - List categories (system defaults + household-specific)
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

    const { household_id } = parsed.data;

    // 3. Build query - get system defaults (NULL household_id) and optionally household-specific
    let query = supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (household_id) {
      // Get system defaults OR this household's categories
      query = query.or(`household_id.is.null,household_id.eq.${household_id}`);
    } else {
      // Just get system defaults
      query = query.is("household_id", null);
    }

    // 4. Execute query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 5. Return response
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Unexpected error in GET /api/categories:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/categories - Create household-specific category
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

    // 2. Parse and validate body
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { household_id, name, description, color, icon } = parsed.data;

    // 3. Insert category (RLS will verify household membership)
    const { data, error: insertError } = await supabase
      .from("categories")
      .insert({
        household_id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
        icon: icon || null,
        is_default: false,
      })
      .select("id, name")
      .single();

    if (insertError) {
      console.error("Error creating category:", insertError);

      if (insertError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to create categories in this household" },
          { status: 403 }
        );
      }
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 4. Return created category
    return NextResponse.json({ data: { id: data.id, name: data.name } }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in POST /api/categories:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
