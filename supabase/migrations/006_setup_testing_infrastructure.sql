-- =====================================================
-- Testing Infrastructure Setup
-- =====================================================
-- Purpose: Install pgTAP and Supabase test helpers for RLS testing
-- Reference: https://supabase.com/docs/guides/local-development/testing/pgtap-extended
-- =====================================================

-- =====================================================
-- 1. INSTALL PGTAP EXTENSION
-- =====================================================

-- Install pgTAP for database testing
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

COMMENT ON EXTENSION pgtap IS 'Unit testing framework for PostgreSQL';

-- =====================================================
-- 2. CREATE AUTH HELPERS (since basejump extension not available)
-- =====================================================

-- Create custom helpers for Supabase auth testing
-- Note: basejump-supabase_test_helpers is not available on hosted Supabase
-- We'll create our own minimal helpers instead

CREATE OR REPLACE FUNCTION extensions.create_supabase_user(
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Generate a consistent UUID from email for testing
  v_user_id := gen_random_uuid();

  -- Insert into auth.users (test users)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt('test-password', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name),
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION extensions.create_supabase_user IS 'Creates a test user in auth.users for testing purposes.';

CREATE OR REPLACE FUNCTION extensions.authenticate_as(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_email;
  END IF;

  -- Set the user ID in the current session
  -- This simulates being authenticated as this user
  PERFORM set_config('request.jwt.claim.sub', v_user_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_id)::text, true);
END;
$$;

COMMENT ON FUNCTION extensions.authenticate_as IS 'Simulates authentication as a specific user by email for testing.';

GRANT EXECUTE ON FUNCTION extensions.create_supabase_user TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION extensions.authenticate_as TO authenticated, service_role;

-- =====================================================
-- 3. CREATE TESTS SCHEMA
-- =====================================================

-- Create dedicated schema for test functions and fixtures
CREATE SCHEMA IF NOT EXISTS tests;

COMMENT ON SCHEMA tests IS 'Schema for test functions, fixtures, and test data';

-- Grant permissions for authenticated users to run tests
GRANT USAGE ON SCHEMA tests TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO authenticated;

-- =====================================================
-- 4. TEST HELPER FUNCTIONS
-- =====================================================

-- Helper function to clean up all test data
CREATE OR REPLACE FUNCTION tests.cleanup_test_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Delete test data in reverse dependency order
  DELETE FROM public.photos WHERE box_id IN (
    SELECT id FROM public.boxes WHERE label LIKE 'TEST_%'
  );
  DELETE FROM public.boxes WHERE label LIKE 'TEST_%';
  DELETE FROM public.row_positions WHERE row_id IN (
    SELECT id FROM public.pallet_rows WHERE pallet_id IN (
      SELECT id FROM public.pallets WHERE name LIKE 'TEST_%'
    )
  );
  DELETE FROM public.pallet_rows WHERE pallet_id IN (
    SELECT id FROM public.pallets WHERE name LIKE 'TEST_%'
  );
  DELETE FROM public.pallets WHERE name LIKE 'TEST_%';
  DELETE FROM public.categories WHERE name LIKE 'TEST_%';
  DELETE FROM public.box_types WHERE name LIKE 'TEST_%';
  DELETE FROM public.user_households WHERE household_id IN (
    SELECT id FROM public.households WHERE name LIKE 'TEST_%'
  );
  DELETE FROM public.households WHERE name LIKE 'TEST_%';
END;
$$;

COMMENT ON FUNCTION tests.cleanup_test_data IS 'Removes all test data created during testing. Call before and after test runs.';

-- Helper function to create a test household
CREATE OR REPLACE FUNCTION tests.create_test_household(
  p_name TEXT,
  p_owner_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Create household
  INSERT INTO public.households (name, description)
  VALUES (p_name, 'Test household for RLS testing')
  RETURNING id INTO v_household_id;

  -- Add owner
  INSERT INTO public.user_households (household_id, user_id, role)
  VALUES (v_household_id, p_owner_id, 'owner');

  RETURN v_household_id;
END;
$$;

COMMENT ON FUNCTION tests.create_test_household IS 'Creates a test household with the specified owner for testing purposes.';

-- Helper function to add user to household with role
CREATE OR REPLACE FUNCTION tests.add_user_to_household(
  p_household_id UUID,
  p_user_id UUID,
  p_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_households (household_id, user_id, role)
  VALUES (p_household_id, p_user_id, p_role);
END;
$$;

COMMENT ON FUNCTION tests.add_user_to_household IS 'Adds a user to a household with the specified role for testing.';

-- Helper function to create test box
CREATE OR REPLACE FUNCTION tests.create_test_box(
  p_household_id UUID,
  p_label TEXT,
  p_status TEXT DEFAULT 'open'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_box_id UUID;
BEGIN
  INSERT INTO public.boxes (household_id, label, status)
  VALUES (p_household_id, p_label, p_status::public.box_status)
  RETURNING id INTO v_box_id;

  RETURN v_box_id;
END;
$$;

COMMENT ON FUNCTION tests.create_test_box IS 'Creates a test box for testing purposes.';

-- Helper function to create test pallet structure
CREATE OR REPLACE FUNCTION tests.create_test_pallet(
  p_household_id UUID,
  p_name TEXT,
  p_rows INTEGER DEFAULT 3,
  p_positions_per_row INTEGER DEFAULT 4
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pallet_id UUID;
  v_row_id UUID;
  v_position_id UUID;
  v_row_num INTEGER;
  v_pos_num INTEGER;
BEGIN
  -- Create pallet
  INSERT INTO public.pallets (household_id, name, rows, positions_per_row)
  VALUES (p_household_id, p_name, p_rows, p_positions_per_row)
  RETURNING id INTO v_pallet_id;

  -- Create rows and positions
  FOR v_row_num IN 1..p_rows LOOP
    INSERT INTO public.pallet_rows (pallet_id, row_number)
    VALUES (v_pallet_id, v_row_num)
    RETURNING id INTO v_row_id;

    FOR v_pos_num IN 1..p_positions_per_row LOOP
      INSERT INTO public.row_positions (row_id, position_number)
      VALUES (v_row_id, v_pos_num);
    END LOOP;
  END LOOP;

  RETURN v_pallet_id;
END;
$$;

COMMENT ON FUNCTION tests.create_test_pallet IS 'Creates a test pallet with rows and positions for testing.';

-- =====================================================
-- 5. TEST FIXTURES
-- =====================================================

-- Function to set up standard test fixtures (4 users, 2 households)
CREATE OR REPLACE FUNCTION tests.setup_rls_test_fixtures()
RETURNS TABLE (
  owner_user_id UUID,
  admin_user_id UUID,
  member_user_id UUID,
  viewer_user_id UUID,
  household1_id UUID,
  household2_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id UUID;
  v_admin_id UUID;
  v_member_id UUID;
  v_viewer_id UUID;
  v_household1_id UUID;
  v_household2_id UUID;
BEGIN
  -- Clean up any existing test data
  PERFORM tests.cleanup_test_data();

  -- Create test users using Supabase test helpers
  v_owner_id := extensions.create_supabase_user('test-owner@example.com', 'Owner', 'Test');
  v_admin_id := extensions.create_supabase_user('test-admin@example.com', 'Admin', 'Test');
  v_member_id := extensions.create_supabase_user('test-member@example.com', 'Member', 'Test');
  v_viewer_id := extensions.create_supabase_user('test-viewer@example.com', 'Viewer', 'Test');

  -- Create first test household with all role types
  v_household1_id := tests.create_test_household('TEST_Household_1', v_owner_id);
  PERFORM tests.add_user_to_household(v_household1_id, v_admin_id, 'admin');
  PERFORM tests.add_user_to_household(v_household1_id, v_member_id, 'member');
  PERFORM tests.add_user_to_household(v_household1_id, v_viewer_id, 'viewer');

  -- Create second test household (for isolation testing)
  v_household2_id := tests.create_test_household('TEST_Household_2', v_admin_id);

  -- Return fixture IDs
  RETURN QUERY SELECT
    v_owner_id, v_admin_id, v_member_id, v_viewer_id,
    v_household1_id, v_household2_id;
END;
$$;

COMMENT ON FUNCTION tests.setup_rls_test_fixtures IS 'Creates standard test fixtures: 4 users with different roles and 2 households for RLS testing.';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on test helper functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO anon;

-- Allow test functions to be called by service role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Test infrastructure is now ready. To run tests:
--
-- 1. Create test files in supabase/tests/ directory
-- 2. Run tests with: supabase test db
-- 3. Or use pg_prove for more control
--
-- Example test file structure:
-- supabase/tests/rls_households_test.sql
-- supabase/tests/rls_boxes_test.sql
-- etc.
--
-- Example test:
-- BEGIN;
-- SELECT plan(5);
-- SELECT tests.setup_rls_test_fixtures();
-- SELECT tests.authenticate_as('test-owner@example.com');
-- SELECT ok(EXISTS(SELECT 1 FROM households), 'Owner can see households');
-- SELECT * FROM finish();
-- ROLLBACK;
