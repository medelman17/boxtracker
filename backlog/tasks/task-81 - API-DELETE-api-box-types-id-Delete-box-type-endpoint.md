---
id: task-81
title: 'API: DELETE /api/box-types/[id] - Delete box type endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:48'
updated_date: '2026-01-09 01:57'
labels:
  - api
  - box-types
  - backend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create DELETE endpoint for removing a household-specific box type. Only allows deleting box types with non-NULL household_id. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Only allows deleting household-specific box types
- [x] #2 Returns 403 if attempting to delete system default
- [x] #3 Returns 404 if box type not found
- [x] #4 Uses getUser() for authentication
- [x] #5 Returns 200 with success message
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/box-types/[id]/route.ts` - DELETE protects system defaults
<!-- SECTION:NOTES:END -->
