---
id: task-18
title: Implement RLS policies for pallet_rows table
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
Create RLS policies for pallet_rows table with access controlled via parent pallet relationship.

Policies needed:
1. SELECT: Users can view rows for pallets they have access to (via pallet → household)
2. INSERT: Admins can create rows (usually via trigger on pallet creation)
3. UPDATE: Admins can update row configuration
4. DELETE: Admins can delete rows (cascades to positions)

Security model:
- Access through pallet relationship: pallet_id IN (SELECT id FROM pallets WHERE household_id IN ...)
- Use helper function for household membership check
- Coordinate with auto-creation trigger
- Validate row_number uniqueness within pallet
- Handle cascade to row_positions
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SELECT shows rows from accessible pallets only
- [ ] #2 INSERT restricted to admin role or higher
- [ ] #3 INSERT validates pallet belongs to household
- [ ] #4 UPDATE restricted to admin role
- [ ] #5 DELETE restricted to admin role
- [ ] #6 Policies work with auto-creation trigger
- [ ] #7 Row number uniqueness enforced
- [ ] #8 Cascade behavior documented
<!-- AC:END -->
