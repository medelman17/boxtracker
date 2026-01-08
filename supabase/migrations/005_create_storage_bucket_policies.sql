-- =====================================================
-- Storage Bucket RLS Policies
-- =====================================================
-- Purpose: Create RLS policies for box-photos storage bucket
--          using optimized helper functions from private schema
-- Dependencies: 003_create_rls_helper_functions.sql
-- =====================================================

-- =====================================================
-- 1. CREATE STORAGE BUCKET
-- =====================================================

-- Create the box-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'box-photos',
  'box-photos',
  false,  -- Private bucket, requires signed URLs
  5242880,  -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREATE HELPER FUNCTION FOR PATH VALIDATION
-- =====================================================

-- Helper function to extract household_id from storage path
-- Path format: {household_id}/{box_id}/{filename}
CREATE OR REPLACE FUNCTION private.get_household_from_storage_path(
  p_path TEXT
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
IMMUTABLE
AS $$
  -- Extract first folder from path and cast to UUID
  -- Example: "abc-123/box-456/photo.jpg" -> "abc-123"
  SELECT (storage.foldername(p_path))[1]::uuid;
$$;

COMMENT ON FUNCTION private.get_household_from_storage_path IS
'Extracts household_id from storage path. Path format: {household_id}/{box_id}/{filename}. Returns UUID or NULL if invalid.';

GRANT EXECUTE ON FUNCTION private.get_household_from_storage_path TO authenticated, anon;

-- Helper function to check if user can upload to storage path
CREATE OR REPLACE FUNCTION private.user_can_upload_to_path(
  p_bucket_id TEXT,
  p_path TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Only validate box-photos bucket
  IF p_bucket_id != 'box-photos' THEN
    RETURN false;
  END IF;

  -- Extract household_id from path
  BEGIN
    v_household_id := (storage.foldername(p_path))[1]::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- Invalid UUID in path
    RETURN false;
  END;

  -- Check if user has member+ role in household
  RETURN private.user_has_role(v_household_id, p_user_id, 'member');
END;
$$;

COMMENT ON FUNCTION private.user_can_upload_to_path IS
'Returns true if user has member+ role in the household specified by the storage path. Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION private.user_can_upload_to_path TO authenticated, anon;

-- Helper function to check if user can access storage path
CREATE OR REPLACE FUNCTION private.user_can_access_path(
  p_bucket_id TEXT,
  p_path TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Only validate box-photos bucket
  IF p_bucket_id != 'box-photos' THEN
    RETURN false;
  END IF;

  -- Extract household_id from path
  BEGIN
    v_household_id := (storage.foldername(p_path))[1]::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- Invalid UUID in path
    RETURN false;
  END;

  -- Check if user has access to household (any role)
  RETURN private.user_has_household_access(v_household_id, p_user_id);
END;
$$;

COMMENT ON FUNCTION private.user_can_access_path IS
'Returns true if user has access to the household specified by the storage path (any role). Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION private.user_can_access_path TO authenticated, anon;

-- =====================================================
-- 3. CREATE STORAGE RLS POLICIES
-- =====================================================
-- Note: RLS is already enabled on storage.objects by Supabase

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload to household folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view household photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete household photos" ON storage.objects;
DROP POLICY IF EXISTS "Members can upload photos to household boxes" ON storage.objects;
DROP POLICY IF EXISTS "Members can view household box photos" ON storage.objects;
DROP POLICY IF EXISTS "Members can delete household box photos" ON storage.objects;

-- INSERT: Members can upload photos to their household's boxes
CREATE POLICY "Members can upload photos to household boxes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    private.user_can_upload_to_path(bucket_id, name)
  );

-- Allows members (and higher roles) to upload photos to their household folders. Path format: {household_id}/{box_id}/{filename}

-- SELECT: Users can view/download photos from their household's boxes
CREATE POLICY "Members can view household box photos"
  ON storage.objects FOR SELECT
  USING (
    private.user_can_access_path(bucket_id, name)
  );

-- Allows all household members (any role) to view and download photos from their household folders

-- DELETE: Members can delete photos from their household's boxes
CREATE POLICY "Members can delete household box photos"
  ON storage.objects FOR DELETE
  USING (
    private.user_can_upload_to_path(bucket_id, name)
  );

-- Allows members (and higher roles) to delete photos from their household folders. Requires member+ role

-- UPDATE: Members can update metadata for photos in their household's boxes
CREATE POLICY "Members can update household box photos"
  ON storage.objects FOR UPDATE
  USING (
    private.user_can_upload_to_path(bucket_id, name)
  )
  WITH CHECK (
    private.user_can_upload_to_path(bucket_id, name)
  );

-- Allows members (and higher roles) to update photo metadata in their household folders

-- =====================================================
-- 5. STORAGE BUCKET CONFIGURATION NOTES
-- =====================================================

-- The box-photos bucket is configured as:
-- - Private (public = false): Requires signed URLs for access
-- - File size limit: 5MB per file
-- - Allowed MIME types: JPEG, PNG, WebP images only
--
-- Path structure enforced: {household_id}/{box_id}/{uuid}.{ext}
-- Example: "550e8400-e29b-41d4-a716-446655440000/abc-123/photo-xyz.jpg"
--
-- Client applications should:
-- 1. Compress images before upload (max 1200px width, 80% quality)
-- 2. Generate unique filenames (UUID + extension)
-- 3. Use signed URLs for display (not public URLs)
-- 4. Validate uploads succeeded before creating photos table records
--
-- Cleanup strategy:
-- - Orphaned files (no photos table record): Manual cleanup or scheduled job
-- - Deleted boxes: Photos table has ON DELETE CASCADE, but storage files remain
-- - Consider storage.objects trigger to sync deletions with photos table

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verification queries:
-- SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'box-photos';
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'private' AND routine_name LIKE '%path%';
