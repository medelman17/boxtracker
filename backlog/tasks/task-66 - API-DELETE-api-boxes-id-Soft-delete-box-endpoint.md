---
id: task-66
title: 'API: DELETE /api/boxes/[id] - Soft delete box endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:47'
updated_date: '2026-01-09 01:57'
labels:
  - api
  - boxes
  - backend
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create DELETE endpoint for soft-deleting a box. Sets deleted_at timestamp instead of hard delete. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Endpoint soft deletes box by setting deleted_at
- [x] #2 Returns 404 if box not found
- [x] #3 Returns 403 if user lacks access
- [x] #4 Uses getUser() for authentication
- [x] #5 Returns 200 with success message
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/boxes/[id]/route.ts` - DELETE handler with soft delete
<!-- SECTION:NOTES:END -->
