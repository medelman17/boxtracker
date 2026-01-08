---
id: task-20
title: Implement RLS policies for box_types table
status: To Do
assignee: []
created_date: '2026-01-08 03:08'
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
