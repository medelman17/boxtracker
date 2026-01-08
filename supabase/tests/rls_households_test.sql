-- =====================================================
-- RLS Policy Tests: households table
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

-- Extract fixture IDs for readability
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
-- TEST 1-4: SELECT Policy - "Users can view their households"
-- =====================================================

-- Test 1: Owner can view their household
SELECT extensions.authenticate_as('test-owner@example.com');
SELECT ok(
  EXISTS(
    SELECT 1 FROM households h
    JOIN fixture_ids f ON h.id = f.household1_id
  ),
  'Owner can view household 1'
);

-- Test 2: Admin can view their household
SELECT extensions.authenticate_as('test-admin@example.com');
SELECT ok(
  EXISTS(
    SELECT 1 FROM households h
    JOIN fixture_ids f ON h.id = f.household1_id
  ),
  'Admin can view household 1'
);

-- Test 3: Member cannot view household they don't belong to
SELECT extensions.authenticate_as('test-member@example.com');
SELECT is(
  (SELECT COUNT(*)::integer FROM households h
   JOIN fixture_ids f ON h.id = f.household2_id),
  0,
  'Member cannot view household 2 (not a member)'
);

-- Test 4: Viewer can view their household
SELECT extensions.authenticate_as('test-viewer@example.com');
SELECT ok(
  EXISTS(
    SELECT 1 FROM households h
    JOIN fixture_ids f ON h.id = f.household1_id
  ),
  'Viewer can view household 1'
);

-- =====================================================
-- TEST 5-7: INSERT Policy - "Users can create households"
-- =====================================================

-- Test 5: Authenticated user can create household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT lives_ok(
  $$INSERT INTO households (name, description) VALUES ('TEST_New_Household', 'Created by member')$$,
  'Authenticated user can create a new household'
);

-- Test 6: Verify household was created
SELECT ok(
  EXISTS(SELECT 1 FROM households WHERE name = 'TEST_New_Household'),
  'New household exists in database'
);

-- Test 7: Verify RLS is enabled on households table
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'households' AND relnamespace = 'public'::regnamespace),
  'RLS is enabled on households table'
);

-- =====================================================
-- TEST 8-11: UPDATE Policy - "Owners can update household"
-- =====================================================

-- Test 8: Owner can update household
SELECT extensions.authenticate_as('test-owner@example.com');
SELECT lives_ok(
  $$UPDATE households SET description = 'Updated by owner'
    WHERE id = (SELECT household1_id FROM fixture_ids)$$,
  'Owner can update their household'
);

-- Test 9: Verify update succeeded
SELECT is(
  (SELECT description FROM households WHERE id = (SELECT household1_id FROM fixture_ids)),
  'Updated by owner',
  'Household description was updated'
);

-- Test 10: Admin cannot update household (only owner can)
SELECT extensions.authenticate_as('test-admin@example.com');
SELECT throws_ok(
  $$UPDATE households SET description = 'Updated by admin'
    WHERE id = (SELECT household1_id FROM fixture_ids)$$,
  'Admin cannot update household (requires owner role)'
);

-- Test 11: Member cannot update household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT throws_ok(
  $$UPDATE households SET description = 'Updated by member'
    WHERE id = (SELECT household1_id FROM fixture_ids)$$,
  'Member cannot update household'
);

-- =====================================================
-- TEST 12-15: DELETE Policy - "Owners can delete household"
-- =====================================================

-- Test 12: Non-owner cannot delete household
SELECT extensions.authenticate_as('test-admin@example.com');
SELECT throws_ok(
  $$DELETE FROM households WHERE id = (SELECT household2_id FROM fixture_ids)$$,
  'Admin cannot delete household (requires owner role)'
);

-- Test 13: Member cannot delete household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT throws_ok(
  $$DELETE FROM households WHERE id = (SELECT household1_id FROM fixture_ids)$$,
  'Member cannot delete household'
);

-- Test 14: Verify household still exists
SELECT ok(
  EXISTS(SELECT 1 FROM households WHERE id = (SELECT household1_id FROM fixture_ids)),
  'Household 1 still exists after failed delete attempts'
);

-- Test 15: Owner can delete household (cleanup test)
SELECT extensions.authenticate_as('test-admin@example.com');
SELECT lives_ok(
  $$DELETE FROM households WHERE id = (SELECT household2_id FROM fixture_ids)$$,
  'Owner can delete their household'
);

-- =====================================================
-- Cleanup
-- =====================================================

SELECT * FROM finish();
ROLLBACK;
