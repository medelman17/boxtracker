---
id: task-16
title: Implement RLS policies for photos table
status: To Do
assignee: []
created_date: '2026-01-08 03:08'
labels:
  - infrastructure
  - security
  - database
  - rls
  - storage
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create RLS policies for the photos table with access controlled via parent box relationship.

Policies needed:
1. SELECT: Users can view photos for boxes they have access to (via box → household)
2. INSERT: Members can add photos to boxes in their households
3. UPDATE: Members can update photo metadata (caption, display_order)
4. DELETE: Members can delete photos from their household's boxes

Security model:
- Access controlled through boxes table relationship
- Use subquery: box_id IN (SELECT id FROM boxes WHERE household_id IN ...)
- Filter soft-deleted boxes
- Validate box ownership before insert/update/delete
- Consider storage bucket coordination
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SELECT shows photos only from accessible boxes
- [ ] #2 SELECT respects soft-deleted boxes filter
- [ ] #3 INSERT validates box belongs to user's household
- [ ] #4 INSERT requires member role
- [ ] #5 UPDATE restricted to photos of household boxes
- [ ] #6 DELETE restricted to photos of household boxes
- [ ] #7 Policies coordinate with storage bucket RLS
- [ ] #8 Orphaned photos prevented
<!-- AC:END -->
