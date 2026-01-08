---
id: task-17
title: Implement RLS policies for pallets table
status: To Do
assignee: []
created_date: '2026-01-08 03:08'
labels:
  - infrastructure
  - security
  - database
  - rls
  - locations
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create RLS policies for the pallets table controlling physical storage locations.

Policies needed:
1. SELECT: Household members can view all pallets in their households
2. INSERT: Admins and owners can create new pallets
3. UPDATE: Admins and owners can update pallet configuration
4. DELETE: Owners can delete pallets (soft delete)

Security model:
- Direct household_id scoping
- Elevated permissions (admin+) required for modifications
- Support soft deletes
- Consider cascading impact on pallet_rows and row_positions
- Validate pallet capacity constraints
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SELECT shows pallets from user's households only
- [ ] #2 SELECT filters soft-deleted pallets
- [ ] #3 INSERT restricted to admin role or higher
- [ ] #4 INSERT validates household_id ownership
- [ ] #5 UPDATE restricted to admin role or higher
- [ ] #6 DELETE restricted to owner role
- [ ] #7 DELETE performs soft delete
- [ ] #8 Pallet capacity constraints enforced
<!-- AC:END -->
