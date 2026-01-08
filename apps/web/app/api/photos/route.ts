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
  box_id: z.string().uuid(),
});

/**
 * Schema for creating a photo record
 * Note: Actual file upload is handled separately via Supabase Storage
 */
const createPhotoSchema = z.object({
  box_id: z.string().uuid(),
  storage_path: z.string().min(1),
  description: z.string().max(200).nullable().optional(),
  display_order: z.coerce.number().int().min(0).default(0),
});

// ============================================================================
// GET /api/photos - List photos for a box
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

    const { box_id } = parsed.data;

    // 3. Verify user has access to the box (RLS will handle this, but we need box's household)
    const { data: box, error: boxError } = await supabase
      .from("boxes")
      .select("id, household_id")
      .eq("id", box_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (boxError) {
      console.error("Error fetching box:", boxError);
      return NextResponse.json({ error: boxError.message }, { status: 500 });
    }

    if (!box) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    // 4. Fetch photos for the box
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("*")
      .eq("box_id", box_id)
      .is("deleted_at", null)
      .order("display_order", { ascending: true });

    if (photosError) {
      console.error("Error fetching photos:", photosError);
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    // 5. Generate signed URLs for each photo
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        const { data: signedUrlData } = await supabase.storage
          .from("box-photos")
          .createSignedUrl(photo.storage_path, 3600); // 1 hour expiry

        return {
          ...photo,
          signed_url: signedUrlData?.signedUrl || null,
        };
      })
    );

    // 6. Return response
    return NextResponse.json({ data: photosWithUrls });
  } catch (err) {
    console.error("Unexpected error in GET /api/photos:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/photos - Create photo record (after file upload to storage)
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
    const parsed = createPhotoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { box_id, storage_path, description, display_order } = parsed.data;

    // 3. Verify user has access to the box
    const { data: box, error: boxError } = await supabase
      .from("boxes")
      .select("id, household_id")
      .eq("id", box_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (boxError) {
      console.error("Error fetching box:", boxError);
      return NextResponse.json({ error: boxError.message }, { status: 500 });
    }

    if (!box) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    // 4. Insert photo record (RLS will verify household membership)
    const { data: photo, error: insertError } = await supabase
      .from("photos")
      .insert({
        box_id,
        storage_path,
        description: description?.trim() || null,
        display_order,
      })
      .select("id, storage_path")
      .single();

    if (insertError) {
      console.error("Error creating photo:", insertError);

      if (insertError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to add photos to this box" },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 5. Update box photo_count
    await supabase.rpc("increment_photo_count", { box_id_param: box_id });

    // 6. Generate signed URL for the new photo
    const { data: signedUrlData } = await supabase.storage
      .from("box-photos")
      .createSignedUrl(storage_path, 3600);

    // 7. Return created photo
    return NextResponse.json(
      {
        data: {
          id: photo.id,
          storage_path: photo.storage_path,
          signed_url: signedUrlData?.signedUrl || null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in POST /api/photos:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
