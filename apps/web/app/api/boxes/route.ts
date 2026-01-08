import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";
import type { BoxListItem } from "@boxtrack/shared";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for query parameters (GET list)
 */
const listQuerySchema = z.object({
  household_id: z.string().uuid(),
  status: z.enum(["empty", "packing", "packed", "stored", "retrieved"]).optional(),
  category_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Input schema for creating a box
 * Uses snake_case to match database column names
 */
const createBoxSchema = z.object({
  household_id: z.string().uuid(),
  label: z.string().min(1, "Label is required").max(100),
  description: z.string().max(500).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  box_type_id: z.string().uuid().nullable().optional(),
  status: z.enum(["empty", "packing", "packed", "stored", "retrieved"]).default("empty"),
});

// ============================================================================
// GET /api/boxes - List boxes
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

    const { household_id, status, category_id, search, limit, offset } = parsed.data;

    // 3. Build query
    let query = supabase
      .from("boxes")
      .select(
        "id, label, status, description, photo_count, created_at, categories(name), box_types(name)",
        { count: "exact" }
      )
      .eq("household_id", household_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply optional filters
    if (status) {
      query = query.eq("status", status);
    }
    if (category_id) {
      query = query.eq("category_id", category_id);
    }
    if (search) {
      query = query.or(`label.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // 4. Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching boxes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 5. Return response
    return NextResponse.json({
      data: data as unknown as BoxListItem[],
      count,
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/boxes:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/boxes - Create a new box
// ============================================================================

/**
 * Benefits over client-side mutation:
 * - Server-side validation with Zod
 * - Automatic user authentication verification
 * - Household membership verification via RLS
 * - Cannot be bypassed by client manipulation
 * - Enables logging, rate limiting, and other server-side controls
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated using getUser() (validates JWT signature)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = createBoxSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { household_id, label, description, category_id, box_type_id, status } = parsed.data;

    // Insert the box (RLS will verify household membership)
    const { data: box, error: insertError } = await supabase
      .from("boxes")
      .insert({
        household_id,
        label: label.trim(),
        description: description?.trim() || null,
        category_id: category_id || null,
        box_type_id: box_type_id || null,
        status,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating box:", insertError);

      // Handle specific error cases
      if (insertError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to create boxes in this household" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { id: box.id } }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in POST /api/boxes:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
