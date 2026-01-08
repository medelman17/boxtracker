---
id: task-13
title: Implement RLS policies for households table
status: Done
assignee: []
created_date: '2026-01-08 03:08'
updated_date: '2026-01-08 06:12'
labels:
  - infrastructure
  - security
  - database
  - rls
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create comprehensive RLS policies for the households table with proper multi-tenant isolation.

Policies needed:
1. SELECT: Users can view households they belong to (via user_households junction)
2. INSERT: Any authenticated user can create a household (becomes owner via trigger)
3. UPDATE: Only household owners can update household details
4. DELETE: Only household owners can delete (soft delete via deleted_at)

Security model:
- All queries scoped by user_households membership
- Use helper function: private.get_user_household_role()
- Owner role required for modifications
- Soft deletes preferred over hard deletes
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SELECT policy allows users to view only their households
- [ ] #2 INSERT policy allows any authenticated user to create household
- [ ] #3 UPDATE policy restricts modifications to owners only
- [ ] #4 DELETE policy restricts to owners only
- [ ] #5 Policies tested with multiple user scenarios
- [ ] #6 Non-members cannot access household data
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed in migration 004_optimize_rls_policies.sql (lines 11-43).

RLS policies implemented for households table:
- SELECT: "Users can view their households" - uses private.get_user_household_ids()
- INSERT: "Users can create households" - allows all authenticated users
- UPDATE: "Owners can update household" - uses private.user_has_role() 
- DELETE: "Owners can delete household" - uses private.user_has_role()

All policies leverage SECURITY DEFINER helper functions from migration 003 to avoid RLS recursion issues.
<!-- SECTION:NOTES:END -->
