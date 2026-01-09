---
id: task-73
title: 'API: DELETE /api/households/[id] - Soft delete household endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:47'
updated_date: '2026-01-09 01:57'
labels:
  - api
  - households
  - backend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create DELETE endpoint for soft-deleting a household. Only owners can delete. Sets deleted_at timestamp. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Only allows owner role to delete
- [x] #2 Soft deletes by setting deleted_at timestamp
- [x] #3 Returns 403 if user is not owner
- [x] #4 Uses getUser() for authentication
- [x] #5 Returns 200 with success message
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/households/[id]/route.ts` - DELETE with owner-only check
<!-- SECTION:NOTES:END -->
