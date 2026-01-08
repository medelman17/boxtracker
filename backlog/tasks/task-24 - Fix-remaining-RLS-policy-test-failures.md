---
id: task-24
title: Fix remaining RLS policy test failures
status: To Do
assignee: []
created_date: '2026-01-08 06:05'
updated_date: '2026-01-08 06:09'
labels:
  - testing
  - database
  - rls
  - security
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Overview

RLS testing infrastructure has been set up with pgTAP, test helpers, and 50 tests across 3 test files. Storage tests (15/15) pass completely. However, boxes and households tests have failures related to RLS policies not properly restricting access.

## Current Status

**Working ✅:**
- Database schema V2 with box_status enum: `stored`, `in_transit`, `delivered`, `archived`
- pgTAP and pgcrypto extensions installed
- Test user seeding via `seed.sql` (4 users: owner, admin, member, viewer)
- Test helper functions in `tests` schema
- Authentication simulation via `extensions.authenticate_as()`
- Storage bucket RLS policies (15/15 tests passing)
- Helper functions using COALESCE pattern for auth.uid()
- user_households SELECT policy allows all authenticated users (to avoid circular dependency)

**Failing ❌:**
- Boxes tests: 7/20 failing (tests 3, 7-8, 12, 14-16)
- Households tests: 6/15 failing (tests 3, 10-14)

## Test Failures Analysis

### Pattern 1: SELECT policies too permissive
- Test 3 in both files: "Member cannot view household/boxes in household 2"
  - Expected: Member sees 0 rows
  - Actual: Member sees 1 row (should be blocked)
  
### Pattern 2: INSERT/UPDATE/DELETE policies not throwing exceptions
- Tests expecting `throws_ok()` are passing silently
- Viewer CAN create boxes (should fail with member+ requirement)
- Member CAN create boxes in other households (should fail)
- Admin CAN update/delete households (should require owner role)

## Root Cause Hypothesis

The helper functions are SECURITY DEFINER with `SET search_path = 'public, auth'` and use `COALESCE(p_user_id, auth.uid())` pattern. However, RLS policies may still be affected by:

1. **Circular dependency**: `user_households` SELECT policy was calling `private.get_user_household_ids()` which queries `user_households` - **FIXED** by making the policy allow all authenticated users

2. **Policy evaluation context**: The helper functions query `public.user_households` which has RLS enabled. Even with SECURITY DEFINER, if the underlying queries are evaluated in the wrong context, they may not see the correct rows.

3. **WITH CHECK vs USING**: INSERT policies use `WITH CHECK` only, UPDATE uses both `USING` and `WITH CHECK`, DELETE uses `USING` only. Missing clauses might allow operations to succeed when they should fail.

## Files Modified

### Migration Files
- `001_initial_schema_v2.sql`: Changed box_status enum, changed default from 'empty' to 'stored'
- `003_create_rls_helper_functions.sql`: Updated all helper functions to use `COALESCE(p_user_id, auth.uid())` pattern with search_path = 'public, auth'
- `004_optimize_rls_policies.sql`: Changed user_households SELECT policy to allow all authenticated users
- `005_create_storage_bucket_policies.sql`: Fixed `get_household_from_storage_path` to handle invalid UUIDs gracefully, updated helper functions with COALESCE pattern
- `006_setup_testing_infrastructure.sql`: Simplified `setup_rls_test_fixtures()` to use SQL instead of PL/pgSQL, updated to use COALESCE pattern

### Seed Data
- `seed.sql`: Creates 4 test users with unique UUIDs, organizes into 2 households with proper role assignments

### Test Files
- `rls_boxes_test.sql`: Updated all box status values from 'open'/'closed' to 'stored'/'archived', changed 'notes' to 'description'
- `rls_households_test.sql`: Removed references to non-existent 'description' column, use 'name' instead
- `rls_storage_test.sql`: All 15 tests passing ✅

## Test Data Structure

```
Owner (11111111-...) 
  └─ owns household1 (role: owner)

Admin (22222222-...) 
  ├─ owns household2 (role: owner)
  └─ member of household1 (role: admin)

Member (33333333-...)
  └─ member of household1 (role: member)

Viewer (44444444-...)
  └─ member of household1 (role: viewer)
```

## Next Steps

1. **Debug RLS policy evaluation**: Create minimal reproduction case to understand why policies aren't restricting access
   
2. **Review policy logic**: Check if policies are using helper functions correctly:
   - `private.user_has_household_access(household_id)` - should return true only for member's households
   - `private.user_has_role(household_id, user_id, 'role')` - should enforce role hierarchy

3. **Test helper functions directly**: Verify helper functions return correct values when called with different users authenticated

4. **Check WITH CHECK clauses**: Ensure INSERT policies have proper `WITH CHECK` to prevent cross-household operations

5. **Consider alternative approach**: If SECURITY DEFINER functions still have RLS issues, might need to:
   - Grant service_role to test functions to completely bypass RLS
   - OR restructure policies to not rely on helper functions
   - OR use database roles instead of RLS for testing

## Commands to Reproduce

```bash
# Reset and run all tests
supabase db reset && supabase test db

# Run only failing tests  
supabase test db ./rls_boxes_test.sql
supabase test db ./rls_households_test.sql

# Check test output for specific failures
supabase test db 2>&1 | grep "Failed test"
```

## Related Files

- `/supabase/migrations/003_create_rls_helper_functions.sql` - Helper functions
- `/supabase/migrations/004_optimize_rls_policies.sql` - RLS policies
- `/supabase/tests/rls_boxes_test.sql` - Boxes RLS tests
- `/supabase/tests/rls_households_test.sql` - Households RLS tests
- `/supabase/seed.sql` - Test user/household fixtures
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Latest Attempt (2026-01-08)

Tried adding `request.jwt.claim.role = 'authenticated'` to the `extensions.authenticate_as()` function based on hypothesis that tests weren't properly authenticated.

**Result:** No change - same 13 tests still failing.

This suggests the issue is NOT with authentication state, but rather with the RLS policy logic itself or how helper functions evaluate in test context.
<!-- SECTION:NOTES:END -->
