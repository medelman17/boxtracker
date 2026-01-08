import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-ssr";
import { z } from "zod";

// ============================================================================
// Route params type
// ============================================================================

type RouteParams = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// DELETE /api/photos/[id] - Delete photo from storage and database
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

    // 3. Fetch photo to get storage_path and box_id (RLS enforces access)
    const { data: photo, error: fetchError } = await supabase
      .from("photos")
      .select("id, storage_path, box_id")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching photo:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // 4. Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("box-photos")
      .remove([photo.storage_path]);

    if (storageError) {
      console.error("Error deleting from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
      // The file might have already been deleted or moved
    }

    // 5. Soft delete the photo record
    const { error: deleteError } = await supabase
      .from("photos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);

    if (deleteError) {
      console.error("Error deleting photo:", deleteError);

      if (deleteError.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to delete this photo" },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 6. Decrement box photo_count
    await supabase.rpc("decrement_photo_count", { box_id_param: photo.box_id });

    // 7. Return success
    return NextResponse.json({ data: { id: photo.id } });
  } catch (err) {
    console.error("Unexpected error in DELETE /api/photos/[id]:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
