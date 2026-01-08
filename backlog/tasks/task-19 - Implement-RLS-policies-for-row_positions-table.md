---
id: task-19
title: Implement RLS policies for row_positions table
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
Create RLS policies for row_positions table controlling individual storage slots.

Policies needed:
1. SELECT: Users can view positions for rows in accessible pallets (via row → pallet → household)
2. INSERT: Admins can create positions (usually via trigger)
3. UPDATE: Members can update occupancy status when assigning boxes
4. DELETE: Admins can delete positions

Security model:
- Triple-nested access: row_id IN (SELECT id FROM pallet_rows WHERE pallet_id IN (SELECT id FROM pallets WHERE household_id IN ...))
- Consider performance optimization with helper function
- Coordinate with position occupancy triggers
- Validate is_occupied flag consistency
- Handle box assignment/unassignment
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SELECT shows positions from accessible pallets only
- [ ] #2 INSERT restricted to admin role
- [ ] #3 UPDATE allows members to update occupancy
- [ ] #4 UPDATE validates box assignment belongs to household
- [ ] #5 DELETE restricted to admin role
- [ ] #6 Nested relationship performance acceptable
- [ ] #7 Occupancy triggers work with RLS
- [ ] #8 Position reservation logic secure
<!-- AC:END -->
