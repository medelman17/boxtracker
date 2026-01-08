import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";
import type { UserHouseholdQueryResult } from "@boxtrack/shared";

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for creating a household
 */
const createHouseholdSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only")
    .optional(),
});

// ============================================================================
// GET /api/households - List user's households
// ============================================================================

export async function GET(_request: Request) {
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

    // 2. Fetch households user belongs to via user_households junction
    const { data, error } = await supabase
      .from("user_households")
      .select(`
        role,
        joined_at,
        household:households(
          id,
          name,
          slug,
          created_at,
          updated_at,
          deleted_at
        )
      `)
      .eq("user_id", user.id)
      .is("households.deleted_at", null);

    if (error) {
      console.error("Error fetching households:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter out entries where household was null (deleted)
    const households = (data || []).filter(
      (item) => item.household !== null
    ) as unknown as UserHouseholdQueryResult[];

    // 3. Return response
    return NextResponse.json({ data: households });
  } catch (err) {
    console.error("Unexpected error in GET /api/households:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/households - Create household
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
    const parsed = createHouseholdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, slug } = parsed.data;

    // 3. Generate slug if not provided
    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // 4. Create household
    const { data: household, error: insertError } = await supabase
      .from("households")
      .insert({
        name: name.trim(),
        slug: finalSlug,
      })
      .select("id, name, slug")
      .single();

    if (insertError) {
      console.error("Error creating household:", insertError);

      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "A household with this slug already exists" },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 5. Add user as owner of the household
    const { error: membershipError } = await supabase
      .from("user_households")
      .insert({
        user_id: user.id,
        household_id: household.id,
        role: "owner",
      });

    if (membershipError) {
      console.error("Error adding user to household:", membershipError);
      // Attempt to clean up the created household
      await supabase.from("households").delete().eq("id", household.id);
      return NextResponse.json(
        { error: "Failed to set up household membership" },
        { status: 500 }
      );
    }

    // 6. Return created household
    return NextResponse.json(
      {
        data: {
          id: household.id,
          name: household.name,
          slug: household.slug,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in POST /api/households:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
