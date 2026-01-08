---
id: task-20
title: Implement RLS policies for box_types table
status: Done
assignee: []
created_date: '2026-01-08 03:08'
updated_date: '2026-01-08 06:14'
labels:
  - infrastructure
  - security
  - database
  - rls
  - metadata
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create RLS policies for box_types table supporting both system defaults and household-specific types.

Policies needed:
1. SELECT: Users can view system defaults (household_id IS NULL) + their household's custom types
2. INSERT: Admins can create household-specific box types
3. UPDATE: Admins can update household box types (cannot update system defaults)
4. DELETE: Admins can delete household box types (cannot delete system defaults)

Security model:
- Dual access pattern: (household_id IS NULL) OR (household_id IN user's households)
- System defaults (household_id IS NULL) read-only for all users
- Only superuser/service role can manage system defaults
- Validate uniqueness of code within household scope
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SELECT shows system defaults to all users
- [ ] #2 SELECT shows household types only to members
- [ ] #3 INSERT restricted to admin role
- [ ] #4 INSERT creates household-scoped types only
- [ ] #5 UPDATE restricted to admin role
- [ ] #6 UPDATE cannot modify system defaults
- [ ] #7 DELETE restricted to admin role
- [ ] #8 DELETE cannot remove system defaults
- [ ] #9 Code uniqueness enforced per household
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed in migration 004_optimize_rls_policies.sql (lines 87-115).

RLS policies for box_types table:
- SELECT: "Users can view box types" - household_id IS NULL (system defaults) OR private.user_has_household_access(household_id)
- INSERT/UPDATE/DELETE: "Admins can manage household box types" - household_id IS NOT NULL AND private.user_has_role(household_id, auth.uid(), 'admin')

System-wide defaults (household_id = NULL) visible to all. Household-specific types managed by admins+.
<!-- SECTION:NOTES:END -->
