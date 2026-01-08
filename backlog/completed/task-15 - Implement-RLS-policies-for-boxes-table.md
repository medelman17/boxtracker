---
id: task-15
title: Implement RLS policies for boxes table
status: Done
assignee: []
created_date: '2026-01-08 03:08'
updated_date: '2026-01-08 06:13'
labels:
  - infrastructure
  - security
  - database
  - rls
  - core
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create RLS policies for the core boxes table with household-scoped access.

Policies needed:
1. SELECT: Household members can view all boxes in their households
2. INSERT: Members and above can create boxes in their households
3. UPDATE: Members and above can update boxes in their households
4. DELETE: Members and above can soft-delete boxes (sets deleted_at)

Security model:
- All operations scoped by household_id
- Require minimum 'member' role for modifications
- Support soft deletes (deleted_at timestamp)
- Filter out soft-deleted boxes in SELECT
- Validate household_id matches authenticated user's households
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SELECT shows only boxes from user's households
- [ ] #2 SELECT filters out soft-deleted boxes
- [ ] #3 INSERT requires member role or higher
- [ ] #4 INSERT validates household_id belongs to user
- [ ] #5 UPDATE restricted to member role or higher
- [ ] #6 UPDATE only affects user's household boxes
- [ ] #7 DELETE performs soft delete (sets deleted_at)
- [ ] #8 DELETE restricted to member role or higher
- [ ] #9 Cross-household access blocked
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed in migration 004_optimize_rls_policies.sql (lines 340-375).

RLS policies for boxes table:
- SELECT: "Users can view household boxes" - private.user_has_household_access(household_id)
- INSERT: "Members can create boxes" - private.user_has_role(household_id, auth.uid(), 'member')
- UPDATE: "Members can update boxes" - private.user_has_role(household_id, auth.uid(), 'member')
- DELETE: "Members can delete boxes" - private.user_has_role(household_id, auth.uid(), 'member')

Enforces member+ role for all write operations, viewer+ for read.
<!-- SECTION:NOTES:END -->
