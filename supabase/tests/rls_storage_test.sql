-- =====================================================
-- RLS Policy Tests: storage.objects (box-photos bucket)
-- =====================================================

BEGIN;

-- Plan: 15 tests total
SELECT plan(15);

-- =====================================================
-- Setup Test Fixtures
-- =====================================================

-- Create test users and households
SELECT results.* INTO TEMP TABLE test_fixtures
FROM tests.setup_rls_test_fixtures() AS results;

CREATE TEMP TABLE fixture_ids AS
SELECT
  owner_user_id,
  admin_user_id,
  member_user_id,
  viewer_user_id,
  household1_id,
  household2_id
FROM test_fixtures;

-- =====================================================
-- TEST 1-6: INSERT Policy - "Members can upload photos to household boxes"
-- =====================================================

-- Test 1: Member can upload to their household path
SELECT extensions.authenticate_as('test-member@example.com');
SELECT ok(
  private.user_can_upload_to_path(
    'box-photos',
    (SELECT household1_id || '/box-123/photo.jpg' FROM fixture_ids),
    (SELECT member_user_id FROM fixture_ids)
  ),
  'Member can upload to their household path'
);

-- Test 2: Viewer cannot upload (requires member+ role)
SELECT extensions.authenticate_as('test-viewer@example.com');
SELECT is(
  private.user_can_upload_to_path(
    'box-photos',
    (SELECT household1_id || '/box-123/photo.jpg' FROM fixture_ids),
    (SELECT viewer_user_id FROM fixture_ids)
  ),
  false,
  'Viewer cannot upload to household path (requires member+ role)'
);

-- Test 3: Member cannot upload to other household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT is(
  private.user_can_upload_to_path(
    'box-photos',
    (SELECT household2_id || '/box-456/photo.jpg' FROM fixture_ids),
    (SELECT member_user_id FROM fixture_ids)
  ),
  false,
  'Member cannot upload to other household path'
);

-- Test 4: Admin can upload to their household
SELECT extensions.authenticate_as('test-admin@example.com');
SELECT ok(
  private.user_can_upload_to_path(
    'box-photos',
    (SELECT household1_id || '/box-789/photo.jpg' FROM fixture_ids),
    (SELECT admin_user_id FROM fixture_ids)
  ),
  'Admin can upload to their household path'
);

-- Test 5: Owner can upload to their household
SELECT extensions.authenticate_as('test-owner@example.com');
SELECT ok(
  private.user_can_upload_to_path(
    'box-photos',
    (SELECT household1_id || '/box-abc/photo.jpg' FROM fixture_ids),
    (SELECT owner_user_id FROM fixture_ids)
  ),
  'Owner can upload to their household path'
);

-- Test 6: Invalid bucket returns false
SELECT is(
  private.user_can_upload_to_path(
    'wrong-bucket',
    (SELECT household1_id || '/box-123/photo.jpg' FROM fixture_ids),
    (SELECT member_user_id FROM fixture_ids)
  ),
  false,
  'Invalid bucket name returns false'
);

-- =====================================================
-- TEST 7-11: SELECT Policy - "Members can view household box photos"
-- =====================================================

-- Test 7: Member can view photos from their household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT ok(
  private.user_can_access_path(
    'box-photos',
    (SELECT household1_id || '/box-123/photo.jpg' FROM fixture_ids),
    (SELECT member_user_id FROM fixture_ids)
  ),
  'Member can view photos from their household'
);

-- Test 8: Viewer can view photos (any role can view)
SELECT extensions.authenticate_as('test-viewer@example.com');
SELECT ok(
  private.user_can_access_path(
    'box-photos',
    (SELECT household1_id || '/box-123/photo.jpg' FROM fixture_ids),
    (SELECT viewer_user_id FROM fixture_ids)
  ),
  'Viewer can view photos from their household'
);

-- Test 9: Member cannot view photos from other household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT is(
  private.user_can_access_path(
    'box-photos',
    (SELECT household2_id || '/box-456/photo.jpg' FROM fixture_ids),
    (SELECT member_user_id FROM fixture_ids)
  ),
  false,
  'Member cannot view photos from other household'
);

-- Test 10: Admin can view photos from their household
SELECT extensions.authenticate_as('test-admin@example.com');
SELECT ok(
  private.user_can_access_path(
    'box-photos',
    (SELECT household1_id || '/box-789/photo.jpg' FROM fixture_ids),
    (SELECT admin_user_id FROM fixture_ids)
  ),
  'Admin can view photos from their household'
);

-- Test 11: Invalid bucket returns false
SELECT is(
  private.user_can_access_path(
    'wrong-bucket',
    (SELECT household1_id || '/box-123/photo.jpg' FROM fixture_ids),
    (SELECT member_user_id FROM fixture_ids)
  ),
  false,
  'Invalid bucket name returns false for access'
);

-- =====================================================
-- TEST 12-15: Path Validation
-- =====================================================

-- Test 12: Household ID extraction works correctly
SELECT is(
  private.get_household_from_storage_path(
    (SELECT household1_id || '/box-123/photo.jpg' FROM fixture_ids)
  ),
  (SELECT household1_id FROM fixture_ids),
  'Household ID correctly extracted from valid path'
);

-- Test 13: Invalid path format returns NULL
SELECT is(
  private.get_household_from_storage_path('invalid/path/structure'),
  NULL,
  'Invalid path format returns NULL'
);

-- Test 14: Empty path returns NULL
SELECT is(
  private.get_household_from_storage_path(''),
  NULL,
  'Empty path returns NULL'
);

-- Test 15: Verify RLS is enabled on storage.objects
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'objects' AND relnamespace = 'storage'::regnamespace),
  'RLS is enabled on storage.objects table'
);

-- =====================================================
-- Cleanup
-- =====================================================

SELECT * FROM finish();
ROLLBACK;
