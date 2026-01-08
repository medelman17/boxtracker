-- Debug test to understand RLS behavior
BEGIN;
SELECT plan(10);

-- Set up test fixtures
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

-- Test 1: Check that both households exist
SELECT is(
  (SELECT COUNT(*)::integer FROM households WHERE id IN (
    SELECT household1_id FROM fixture_ids
    UNION
    SELECT household2_id FROM fixture_ids
  )),
  2,
  'Both test households exist'
);

-- Test 2: Check member user membership
SELECT is(
  (SELECT COUNT(*)::integer FROM user_households WHERE user_id = (SELECT member_user_id FROM fixture_ids)),
  1,
  'Member belongs to exactly 1 household'
);

-- Test 3: Verify member is in household1
SELECT ok(
  EXISTS(
    SELECT 1 FROM user_households
    WHERE user_id = (SELECT member_user_id FROM fixture_ids)
      AND household_id = (SELECT household1_id FROM fixture_ids)
  ),
  'Member is in household 1'
);

-- Test 4: Verify member is NOT in household2
SELECT is(
  (SELECT COUNT(*)::integer FROM user_households
   WHERE user_id = (SELECT member_user_id FROM fixture_ids)
     AND household_id = (SELECT household2_id FROM fixture_ids)),
  0,
  'Member is NOT in household 2'
);

-- Now authenticate as member
SELECT extensions.authenticate_as('test-member@example.com');

-- Test 5: Check auth.uid() works
SELECT ok(
  auth.uid() = (SELECT member_user_id FROM fixture_ids),
  'auth.uid() returns member user ID'
);

-- Test 6: Check helper function for household 1
SELECT ok(
  private.user_has_household_access((SELECT household1_id FROM fixture_ids)),
  'Helper function: member has access to household 1'
);

-- Test 7: Check helper function for household 2
SELECT is(
  private.user_has_household_access((SELECT household2_id FROM fixture_ids)),
  false,
  'Helper function: member does NOT have access to household 2'
);

-- Test 8: Check RLS policy - household1 visibility
SELECT ok(
  EXISTS(SELECT 1 FROM households WHERE id = (SELECT household1_id FROM fixture_ids)),
  'RLS: Member CAN see household 1'
);

-- Test 9: Check RLS policy - household2 visibility
SELECT is(
  (SELECT COUNT(*)::integer FROM households WHERE id = (SELECT household2_id FROM fixture_ids)),
  0,
  'RLS: Member CANNOT see household 2'
);

-- Test 10: Total households visible to member
SELECT is(
  (SELECT COUNT(*)::integer FROM households),
  1,
  'RLS: Member sees exactly 1 household total'
);

SELECT * FROM finish();
ROLLBACK;
