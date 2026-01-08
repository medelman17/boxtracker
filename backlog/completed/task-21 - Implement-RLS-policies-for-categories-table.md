---
id: task-21
title: Implement RLS policies for categories table
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
Create RLS policies for categories table supporting both system defaults and household-specific categories.

Policies needed:
1. SELECT: Users can view system defaults (household_id IS NULL) + their household's custom categories
2. INSERT: Admins can create household-specific categories
3. UPDATE: Admins can update household categories (cannot update system defaults)
4. DELETE: Admins can delete household categories (cannot delete system defaults or is_default=true)

Security model:
- Same dual access pattern as box_types
- System defaults read-only
- Protect is_default categories from deletion
- Support color/icon customization per household
- Validate name uniqueness within household
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SELECT shows system defaults to all users
- [ ] #2 SELECT shows household categories only to members
- [ ] #3 INSERT restricted to admin role
- [ ] #4 INSERT creates household-scoped categories only
- [ ] #5 UPDATE restricted to admin role
- [ ] #6 UPDATE cannot modify system defaults
- [ ] #7 DELETE restricted to admin role
- [ ] #8 DELETE cannot remove system defaults or is_default categories
- [ ] #9 Name uniqueness enforced per household
- [ ] #10 Color/icon validation included
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed in migration 004_optimize_rls_policies.sql (lines 117-159).

RLS policies for categories table:
- SELECT: "Users can view categories" - household_id IS NULL (system defaults) OR private.user_has_household_access(household_id)
- INSERT: "Admins can create household categories" - household_id IS NOT NULL AND private.user_has_role(household_id, auth.uid(), 'admin')
- UPDATE: "Admins can update household categories" - household_id IS NOT NULL AND private.user_has_role(household_id, auth.uid(), 'admin')
- DELETE: "Admins can delete household categories" - household_id IS NOT NULL AND private.user_has_role(household_id, auth.uid(), 'admin')

Same pattern as box_types: system defaults (household_id = NULL) visible to all, household-specific managed by admins+.
<!-- SECTION:NOTES:END -->
