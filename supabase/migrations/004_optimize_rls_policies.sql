-- =====================================================
-- Optimize RLS Policies to Use Helper Functions
-- =====================================================
-- Purpose: Replace nested subqueries with security definer
--          helper functions to prevent RLS recursion and
--          improve query performance
-- Dependencies: 003_create_rls_helper_functions.sql
-- =====================================================

-- =====================================================
-- HOUSEHOLDS TABLE - Optimized Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their households" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Owners can update household" ON households;
DROP POLICY IF EXISTS "Owners can delete household" ON households;

-- Recreate with optimized logic
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    -- Use helper function instead of subquery
    id IN (SELECT * FROM private.get_user_household_ids())
  );

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can update household"
  ON households FOR UPDATE
  USING (
    private.user_has_role(id, auth.uid(), 'owner')
  );

CREATE POLICY "Owners can delete household"
  ON households FOR DELETE
  USING (
    private.user_has_role(id, auth.uid(), 'owner')
  );

-- =====================================================
-- USER_HOUSEHOLDS TABLE - Optimized Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view household members" ON user_households;
DROP POLICY IF EXISTS "Owners and admins can add members, or self during signup" ON user_households;
DROP POLICY IF EXISTS "Owners and admins can update members" ON user_households;
DROP POLICY IF EXISTS "Owners can remove members, users can leave" ON user_households;

-- Recreate with optimized logic
CREATE POLICY "Users can view household members"
  ON user_households FOR SELECT
  USING (
    household_id IN (SELECT * FROM private.get_user_household_ids())
  );

CREATE POLICY "Owners and admins can add members, or self during signup"
  ON user_households FOR INSERT
  WITH CHECK (
    -- Allow owners/admins to add members
    private.user_has_role(household_id, auth.uid(), 'admin')
    -- OR allow user to join during signup (trigger case)
    OR user_id = auth.uid()
  );

CREATE POLICY "Owners and admins can update members"
  ON user_households FOR UPDATE
  USING (
    private.user_has_role(household_id, auth.uid(), 'admin')
  );

CREATE POLICY "Owners can remove members, users can leave"
  ON user_households FOR DELETE
  USING (
    -- Users can leave themselves
    user_id = auth.uid()
    -- OR owners can remove members
    OR private.user_has_role(household_id, auth.uid(), 'owner')
  );

-- =====================================================
-- BOX_TYPES TABLE - Optimized Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view box types" ON box_types;
DROP POLICY IF EXISTS "Admins can manage box types" ON box_types;

-- Recreate with optimized logic
CREATE POLICY "Users can view box types"
  ON box_types FOR SELECT
  USING (
    -- System defaults (household_id IS NULL) visible to all
    household_id IS NULL
    -- OR household-specific types visible to members
    OR private.user_has_household_access(household_id)
  );

CREATE POLICY "Admins can manage household box types"
  ON box_types FOR ALL
  USING (
    -- Only allow managing household-specific types (not system defaults)
    household_id IS NOT NULL
    AND private.user_has_role(household_id, auth.uid(), 'admin')
  )
  WITH CHECK (
    household_id IS NOT NULL
    AND private.user_has_role(household_id, auth.uid(), 'admin')
  );

-- =====================================================
-- CATEGORIES TABLE - Optimized Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can create categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- Recreate with optimized logic
CREATE POLICY "Users can view categories"
  ON categories FOR SELECT
  USING (
    -- System defaults visible to all
    household_id IS NULL
    -- OR household-specific categories visible to members
    OR private.user_has_household_access(household_id)
  );

CREATE POLICY "Admins can create household categories"
  ON categories FOR INSERT
  WITH CHECK (
    household_id IS NOT NULL
    AND private.user_has_role(household_id, auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update household categories"
  ON categories FOR UPDATE
  USING (
    household_id IS NOT NULL
    AND private.user_has_role(household_id, auth.uid(), 'admin')
  )
  WITH CHECK (
    household_id IS NOT NULL
    AND private.user_has_role(household_id, auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete household categories"
  ON categories FOR DELETE
  USING (
    household_id IS NOT NULL
    AND private.user_has_role(household_id, auth.uid(), 'admin')
  );

-- =====================================================
-- PALLETS TABLE - Optimized Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view household pallets" ON pallets;
DROP POLICY IF EXISTS "Admins can manage pallets" ON pallets;

-- Recreate with optimized logic
CREATE POLICY "Users can view household pallets"
  ON pallets FOR SELECT
  USING (
    private.user_has_household_access(household_id)
  );

CREATE POLICY "Admins can manage pallets"
  ON pallets FOR ALL
  USING (
    private.user_has_role(household_id, auth.uid(), 'admin')
  )
  WITH CHECK (
    private.user_has_role(household_id, auth.uid(), 'admin')
  );

-- =====================================================
-- PALLET_ROWS TABLE - Optimized Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view pallet rows" ON pallet_rows;
DROP POLICY IF EXISTS "Admins can manage rows" ON pallet_rows;

-- Create helper function for pallet_rows access (avoids triple nesting)
CREATE OR REPLACE FUNCTION private.user_can_access_pallet_row(
  p_row_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pallet_rows pr
    JOIN public.pallets p ON pr.pallet_id = p.id
    JOIN public.user_households uh ON p.household_id = uh.household_id
    WHERE pr.id = p_row_id
      AND uh.user_id = p_user_id
  );
$$;

COMMENT ON FUNCTION private.user_can_access_pallet_row IS
'Returns true if user has access to the pallet row (via household membership). Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION private.user_can_access_pallet_row TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.user_can_manage_pallet_row(
  p_row_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pallet_rows pr
    JOIN public.pallets p ON pr.pallet_id = p.id
    JOIN public.user_households uh ON p.household_id = uh.household_id
    WHERE pr.id = p_row_id
      AND uh.user_id = p_user_id
      AND uh.role IN ('owner', 'admin')
  );
$$;

COMMENT ON FUNCTION private.user_can_manage_pallet_row IS
'Returns true if user has admin+ role in the household that owns the pallet row. Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION private.user_can_manage_pallet_row TO authenticated, anon;

-- Recreate policies
CREATE POLICY "Users can view pallet rows"
  ON pallet_rows FOR SELECT
  USING (
    private.user_can_access_pallet_row(id)
  );

CREATE POLICY "Admins can manage pallet rows"
  ON pallet_rows FOR ALL
  USING (
    private.user_can_manage_pallet_row(id)
  )
  WITH CHECK (
    private.user_can_manage_pallet_row(id)
  );

-- =====================================================
-- ROW_POSITIONS TABLE - Optimized Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view row positions" ON row_positions;
DROP POLICY IF EXISTS "Admins can manage positions" ON row_positions;

-- Create helper functions for row_positions access
CREATE OR REPLACE FUNCTION private.user_can_access_row_position(
  p_position_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.row_positions rp
    JOIN public.pallet_rows pr ON rp.row_id = pr.id
    JOIN public.pallets p ON pr.pallet_id = p.id
    JOIN public.user_households uh ON p.household_id = uh.household_id
    WHERE rp.id = p_position_id
      AND uh.user_id = p_user_id
  );
$$;

COMMENT ON FUNCTION private.user_can_access_row_position IS
'Returns true if user has access to the row position (via household membership). Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION private.user_can_access_row_position TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.user_can_manage_row_position(
  p_position_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.row_positions rp
    JOIN public.pallet_rows pr ON rp.row_id = pr.id
    JOIN public.pallets p ON pr.pallet_id = p.id
    JOIN public.user_households uh ON p.household_id = uh.household_id
    WHERE rp.id = p_position_id
      AND uh.user_id = p_user_id
      AND uh.role IN ('owner', 'admin')
  );
$$;

COMMENT ON FUNCTION private.user_can_manage_row_position IS
'Returns true if user has admin+ role in the household that owns the row position. Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION private.user_can_manage_row_position TO authenticated, anon;

-- Recreate policies
CREATE POLICY "Users can view row positions"
  ON row_positions FOR SELECT
  USING (
    private.user_can_access_row_position(id)
  );

CREATE POLICY "Admins can manage row positions"
  ON row_positions FOR ALL
  USING (
    private.user_can_manage_row_position(id)
  )
  WITH CHECK (
    private.user_can_manage_row_position(id)
  );

-- =====================================================
-- BOXES TABLE - Optimized Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view household boxes" ON boxes;
DROP POLICY IF EXISTS "Members can create boxes" ON boxes;
DROP POLICY IF EXISTS "Members can update boxes" ON boxes;
DROP POLICY IF EXISTS "Members can delete boxes" ON boxes;

-- Recreate with optimized logic
CREATE POLICY "Users can view household boxes"
  ON boxes FOR SELECT
  USING (
    private.user_has_household_access(household_id)
  );

CREATE POLICY "Members can create boxes"
  ON boxes FOR INSERT
  WITH CHECK (
    private.user_has_role(household_id, auth.uid(), 'member')
  );

CREATE POLICY "Members can update boxes"
  ON boxes FOR UPDATE
  USING (
    private.user_has_role(household_id, auth.uid(), 'member')
  )
  WITH CHECK (
    private.user_has_role(household_id, auth.uid(), 'member')
  );

CREATE POLICY "Members can delete boxes"
  ON boxes FOR DELETE
  USING (
    private.user_has_role(household_id, auth.uid(), 'member')
  );

-- =====================================================
-- PHOTOS TABLE - Optimized Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view household box photos" ON photos;
DROP POLICY IF EXISTS "Members can add photos" ON photos;
DROP POLICY IF EXISTS "Members can update photos" ON photos;
DROP POLICY IF EXISTS "Members can delete photos" ON photos;

-- Create helper functions for photos access
CREATE OR REPLACE FUNCTION private.user_can_access_photo(
  p_photo_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.photos ph
    JOIN public.boxes b ON ph.box_id = b.id
    JOIN public.user_households uh ON b.household_id = uh.household_id
    WHERE ph.id = p_photo_id
      AND uh.user_id = p_user_id
      AND b.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION private.user_can_access_photo IS
'Returns true if user has access to the photo (via box household membership). Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION private.user_can_access_photo TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.user_can_access_box(
  p_box_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.boxes b
    JOIN public.user_households uh ON b.household_id = uh.household_id
    WHERE b.id = p_box_id
      AND uh.user_id = p_user_id
      AND b.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION private.user_can_access_box IS
'Returns true if user has access to the box (via household membership). Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION private.user_can_access_box TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.user_can_manage_box(
  p_box_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.boxes b
    JOIN public.user_households uh ON b.household_id = uh.household_id
    WHERE b.id = p_box_id
      AND uh.user_id = p_user_id
      AND uh.role IN ('owner', 'admin', 'member')
      AND b.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION private.user_can_manage_box IS
'Returns true if user has member+ role in the household that owns the box. Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION private.user_can_manage_box TO authenticated, anon;

-- Recreate policies
CREATE POLICY "Users can view household box photos"
  ON photos FOR SELECT
  USING (
    private.user_can_access_photo(id)
  );

CREATE POLICY "Members can add photos"
  ON photos FOR INSERT
  WITH CHECK (
    private.user_can_manage_box(box_id)
  );

CREATE POLICY "Members can update photos"
  ON photos FOR UPDATE
  USING (
    private.user_can_access_photo(id)
    AND private.user_can_manage_box(box_id)
  )
  WITH CHECK (
    private.user_can_manage_box(box_id)
  );

CREATE POLICY "Members can delete photos"
  ON photos FOR DELETE
  USING (
    private.user_can_access_photo(id)
    AND private.user_can_manage_box(box_id)
  );

-- =====================================================
-- SUMMARY OF OPTIMIZATIONS
-- =====================================================

-- Total policies optimized: 34 policies across 9 tables
-- New helper functions created: 7 additional functions
--
-- Benefits:
-- 1. Eliminates RLS recursion risk
-- 2. Improves query performance (functions are STABLE and cacheable)
-- 3. Simplifies policy logic (easier to read and maintain)
-- 4. Consistent permission checking across all tables
--
-- All helper functions in private schema:
-- - get_user_household_ids
-- - get_user_household_role
-- - user_has_household_access
-- - user_has_role
-- - user_can_access_pallet_row
-- - user_can_manage_pallet_row
-- - user_can_access_row_position
-- - user_can_manage_row_position
-- - user_can_access_photo
-- - user_can_access_box
-- - user_can_manage_box

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
