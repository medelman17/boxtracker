-- =====================================================
-- Test Data Seed File
-- =====================================================
-- Purpose: Create test users and households for RLS testing
-- This runs after all migrations during `supabase db reset`
-- =====================================================

-- Create test users in auth.users
-- Note: The create_default_household trigger will create a household for each user
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
) VALUES
  -- Owner user (trigger will create household with slug 'household-11111111')
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'test-owner@example.com',
   extensions.crypt('test-password', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"first_name": "Owner", "last_name": "Test"}'::jsonb,
   'authenticated', 'authenticated', now(), now()),
  -- Admin user (trigger will create household with slug 'household-22222222')
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'test-admin@example.com',
   extensions.crypt('test-password', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"first_name": "Admin", "last_name": "Test"}'::jsonb,
   'authenticated', 'authenticated', now(), now()),
  -- Member user (trigger will create household with slug 'household-33333333')
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'test-member@example.com',
   extensions.crypt('test-password', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"first_name": "Member", "last_name": "Test"}'::jsonb,
   'authenticated', 'authenticated', now(), now()),
  -- Viewer user (trigger will create household with slug 'household-44444444')
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'test-viewer@example.com',
   extensions.crypt('test-password', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"first_name": "Viewer", "last_name": "Test"}'::jsonb,
   'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Get the household IDs that were auto-created by the trigger
DO $$
DECLARE
  v_household1_id UUID;
  v_household2_id UUID;
BEGIN
  -- Get owner's household (household1)
  SELECT household_id INTO v_household1_id
  FROM user_households
  WHERE user_id = '11111111-1111-1111-1111-111111111111';

  -- Get admin's household (household2)
  SELECT household_id INTO v_household2_id
  FROM user_households
  WHERE user_id = '22222222-2222-2222-2222-222222222222';

  -- Update household names for clarity
  UPDATE households SET name = 'TEST_Household_1' WHERE id = v_household1_id;
  UPDATE households SET name = 'TEST_Household_2' WHERE id = v_household2_id;

  -- Delete auto-created households for member and viewer (we'll add them to household1)
  DELETE FROM user_households WHERE user_id IN (
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  );
  DELETE FROM households WHERE id NOT IN (v_household1_id, v_household2_id);

  -- Add member and viewer to household1 with appropriate roles
  INSERT INTO user_households (household_id, user_id, role) VALUES
    (v_household1_id, '22222222-2222-2222-2222-222222222222', 'admin'),  -- Also add admin to household1
    (v_household1_id, '33333333-3333-3333-3333-333333333333', 'member'),
    (v_household1_id, '44444444-4444-4444-4444-444444444444', 'viewer')
  ON CONFLICT (user_id, household_id) DO NOTHING;
END $$;
