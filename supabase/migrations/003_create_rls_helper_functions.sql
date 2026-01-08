-- =====================================================
-- RLS Helper Functions Migration
-- =====================================================
-- Purpose: Create security definer helper functions to avoid
--          RLS recursion issues and improve policy performance
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#use-security-definer-functions
-- =====================================================

-- =====================================================
-- 1. CREATE PRIVATE SCHEMA
-- =====================================================

-- Create private schema for internal functions that should never be exposed via API
CREATE SCHEMA IF NOT EXISTS private;

COMMENT ON SCHEMA private IS 'Internal schema for security definer functions - never expose via API';

-- =====================================================
-- 2. HELPER FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- Get User's Role in a Household
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION private.get_user_household_role(
  p_household_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public, auth'
STABLE
AS $$
  SELECT role::text
  FROM public.user_households
  WHERE household_id = p_household_id
    AND user_id = COALESCE(p_user_id, auth.uid())
  LIMIT 1;
$$;

COMMENT ON FUNCTION private.get_user_household_role IS
'Returns the user''s role in a specific household (owner, admin, member, viewer). Returns NULL if user is not a member. Uses SECURITY DEFINER to bypass RLS and avoid recursion issues.';

-- -----------------------------------------------------
-- Check if User Has Access to Household
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION private.user_has_household_access(
  p_household_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, auth'
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_households
    WHERE household_id = p_household_id
      AND user_id = COALESCE(p_user_id, auth.uid())
  );
END;
$$;

COMMENT ON FUNCTION private.user_has_household_access IS
'Returns true if user is a member of the specified household (any role). Uses SECURITY DEFINER to bypass RLS.';

-- -----------------------------------------------------
-- Check if User Has Specific Role or Higher
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION private.user_has_role(
  p_household_id UUID,
  p_user_id UUID,
  p_required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, auth'
STABLE
AS $$
DECLARE
  v_user_role TEXT;
  v_user_role_hierarchy INTEGER;
  v_required_hierarchy INTEGER;
BEGIN
  -- Get user's role
  SELECT role::text INTO v_user_role
  FROM public.user_households
  WHERE household_id = p_household_id
    AND user_id = p_user_id;

  -- If user is not a member, return false
  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Define role hierarchy (higher number = more permissions)
  -- owner: 4, admin: 3, member: 2, viewer: 1
  v_user_role := LOWER(v_user_role);
  p_required_role := LOWER(p_required_role);

  v_user_role_hierarchy := CASE v_user_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'member' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
  END;

  v_required_hierarchy := CASE p_required_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'member' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
  END;

  -- Return true if user's role is >= required role
  RETURN v_user_role_hierarchy >= v_required_hierarchy;
END;
$$;

COMMENT ON FUNCTION private.user_has_role IS
'Returns true if user has the specified role or higher in the household. Role hierarchy: owner > admin > member > viewer. Uses SECURITY DEFINER to bypass RLS.';

-- -----------------------------------------------------
-- Get All Household IDs for User
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION private.get_user_household_ids(
  p_user_id UUID DEFAULT NULL
)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public, auth'
STABLE
AS $$
  SELECT household_id
  FROM public.user_households
  WHERE user_id = COALESCE(p_user_id, auth.uid());
$$;

COMMENT ON FUNCTION private.get_user_household_ids IS
'Returns all household IDs that the user is a member of. Uses SECURITY DEFINER to bypass RLS. Useful for IN clauses in policies.';

-- =====================================================
-- 3. GRANT APPROPRIATE PERMISSIONS
-- =====================================================

-- Revoke all default permissions on private schema
REVOKE ALL ON SCHEMA private FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM public;

-- Grant execute permissions to authenticated users
-- (They can call these functions, but the functions run with definer's privileges)
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;

-- Also grant to anon for future use if needed
GRANT USAGE ON SCHEMA private TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon;

-- =====================================================
-- 4. ENSURE PRIVATE SCHEMA IS NOT EXPOSED VIA API
-- =====================================================

-- Note: You must also configure PostgREST to exclude the private schema
-- This is done in your Supabase project settings or config.toml:
--
-- In supabase/config.toml add:
--   [api]
--   schemas = ["public", "storage"]
--   excluded_schemas = ["private"]
--
-- Or in Supabase Dashboard > Settings > API > Schema:
--   Exposed schemas: public, storage (do NOT include private)

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Test the functions (optional - can run manually to verify):
-- SELECT private.user_has_household_access('some-household-uuid'::uuid);
-- SELECT private.get_user_household_role('some-household-uuid'::uuid);
-- SELECT private.user_has_role('some-household-uuid'::uuid, auth.uid(), 'member');
-- SELECT * FROM private.get_user_household_ids();
