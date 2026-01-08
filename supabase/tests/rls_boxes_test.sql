-- =====================================================
-- RLS Policy Tests: boxes table
-- =====================================================

BEGIN;

-- Plan: 20 tests total
SELECT plan(20);

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

-- Create test boxes in both households
SELECT extensions.authenticate_as('test-owner@example.com');
CREATE TEMP TABLE test_boxes AS
SELECT
  tests.create_test_box((SELECT household1_id FROM fixture_ids), 'TEST_Box_H1_1', 'stored') as box_h1_1,
  tests.create_test_box((SELECT household1_id FROM fixture_ids), 'TEST_Box_H1_2', 'archived') as box_h1_2;

SELECT extensions.authenticate_as('test-admin@example.com');
INSERT INTO test_boxes
SELECT tests.create_test_box((SELECT household2_id FROM fixture_ids), 'TEST_Box_H2_1', 'stored');

-- =====================================================
-- TEST 1-5: SELECT Policy - "Users can view household boxes"
-- =====================================================

-- Test 1: Owner can view boxes in their household
SELECT extensions.authenticate_as('test-owner@example.com');
SELECT ok(
  EXISTS(
    SELECT 1 FROM boxes WHERE label = 'TEST_Box_H1_1'
  ),
  'Owner can view boxes in household 1'
);

-- Test 2: Admin can view boxes in their household
SELECT extensions.authenticate_as('test-admin@example.com');
SELECT ok(
  EXISTS(
    SELECT 1 FROM boxes WHERE label = 'TEST_Box_H1_1'
  ),
  'Admin can view boxes in household 1'
);

-- Test 3: Member cannot view boxes in other household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT is(
  (SELECT COUNT(*)::integer FROM boxes WHERE label = 'TEST_Box_H2_1'),
  0,
  'Member cannot view boxes in household 2'
);

-- Test 4: Viewer can view boxes in their household
SELECT extensions.authenticate_as('test-viewer@example.com');
SELECT ok(
  EXISTS(
    SELECT 1 FROM boxes WHERE label = 'TEST_Box_H1_1'
  ),
  'Viewer can view boxes in household 1'
);

-- Test 5: Verify correct box count for household 1
SELECT extensions.authenticate_as('test-member@example.com');
SELECT is(
  (SELECT COUNT(*)::integer FROM boxes WHERE label LIKE 'TEST_Box_H1_%'),
  2,
  'Member sees exactly 2 boxes in household 1'
);

-- =====================================================
-- TEST 6-9: INSERT Policy - "Members can create boxes"
-- =====================================================

-- Test 6: Member can create box in their household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT lives_ok(
  $$INSERT INTO boxes (household_id, label, status)
    VALUES ((SELECT household1_id FROM fixture_ids), 'TEST_Box_Member_Created', 'stored')$$,
  'Member can create box in their household'
);

-- Test 7: Viewer cannot create box (requires member+ role)
SELECT extensions.authenticate_as('test-viewer@example.com');
SELECT throws_ok(
  $$INSERT INTO boxes (household_id, label, status)
    VALUES ((SELECT household1_id FROM fixture_ids), 'TEST_Box_Viewer_Attempt', 'stored')$$,
  'Viewer cannot create box (requires member+ role)'
);

-- Test 8: Member cannot create box in other household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT throws_ok(
  $$INSERT INTO boxes (household_id, label, status)
    VALUES ((SELECT household2_id FROM fixture_ids), 'TEST_Box_Wrong_Household', 'stored')$$,
  'Member cannot create box in household they do not belong to'
);

-- Test 9: Admin can create box
SELECT extensions.authenticate_as('test-admin@example.com');
SELECT lives_ok(
  $$INSERT INTO boxes (household_id, label, status)
    VALUES ((SELECT household1_id FROM fixture_ids), 'TEST_Box_Admin_Created', 'stored')$$,
  'Admin can create box in their household'
);

-- =====================================================
-- TEST 10-14: UPDATE Policy - "Members can update boxes"
-- =====================================================

-- Test 10: Member can update box in their household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT lives_ok(
  $$UPDATE boxes SET status = 'archived', description = 'Updated by member'
    WHERE label = 'TEST_Box_H1_1'$$,
  'Member can update box in their household'
);

-- Test 11: Verify update succeeded
SELECT is(
  (SELECT status::text FROM boxes WHERE label = 'TEST_Box_H1_1'),
  'archived',
  'Box status was updated to archived'
);

-- Test 12: Viewer cannot update box
SELECT extensions.authenticate_as('test-viewer@example.com');
SELECT throws_ok(
  $$UPDATE boxes SET description = 'Viewer attempt'
    WHERE label = 'TEST_Box_H1_1'$$,
  'Viewer cannot update box (requires member+ role)'
);

-- Test 13: Owner can update box
SELECT extensions.authenticate_as('test-owner@example.com');
SELECT lives_ok(
  $$UPDATE boxes SET description = 'Updated by owner'
    WHERE label = 'TEST_Box_H1_2'$$,
  'Owner can update box in their household'
);

-- Test 14: Member cannot update box in other household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT throws_ok(
  $$UPDATE boxes SET description = 'Cross-household attempt'
    WHERE label = 'TEST_Box_H2_1'$$,
  'Member cannot update box in other household'
);

-- =====================================================
-- TEST 15-20: DELETE Policy - "Members can delete boxes"
-- =====================================================

-- Test 15: Viewer cannot delete box
SELECT extensions.authenticate_as('test-viewer@example.com');
SELECT throws_ok(
  $$DELETE FROM boxes WHERE label = 'TEST_Box_H1_1'$$,
  'Viewer cannot delete box (requires member+ role)'
);

-- Test 16: Member cannot delete box in other household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT throws_ok(
  $$DELETE FROM boxes WHERE label = 'TEST_Box_H2_1'$$,
  'Member cannot delete box in other household'
);

-- Test 17: Member can delete box in their household
SELECT extensions.authenticate_as('test-member@example.com');
SELECT lives_ok(
  $$DELETE FROM boxes WHERE label = 'TEST_Box_Member_Created'$$,
  'Member can delete box they created'
);

-- Test 18: Admin can delete box
SELECT extensions.authenticate_as('test-admin@example.com');
SELECT lives_ok(
  $$DELETE FROM boxes WHERE label = 'TEST_Box_Admin_Created'$$,
  'Admin can delete box in their household'
);

-- Test 19: Owner can delete box
SELECT extensions.authenticate_as('test-owner@example.com');
SELECT lives_ok(
  $$DELETE FROM boxes WHERE label = 'TEST_Box_H1_1'$$,
  'Owner can delete box in their household'
);

-- Test 20: Verify RLS is enabled on boxes table
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'boxes' AND relnamespace = 'public'::regnamespace),
  'RLS is enabled on boxes table'
);

-- =====================================================
-- Cleanup
-- =====================================================

SELECT * FROM finish();
ROLLBACK;
