---
id: task-13
title: Implement RLS policies for households table
status: To Do
assignee: []
created_date: '2026-01-08 03:08'
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
