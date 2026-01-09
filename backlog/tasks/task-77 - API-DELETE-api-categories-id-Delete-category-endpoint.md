---
id: task-77
title: 'API: DELETE /api/categories/[id] - Delete category endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:47'
updated_date: '2026-01-09 01:57'
labels:
  - api
  - categories
  - backend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create DELETE endpoint for removing a household-specific category. Only allows deleting categories with non-NULL household_id. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Only allows deleting household-specific categories
- [x] #2 Returns 403 if attempting to delete system default
- [x] #3 Returns 404 if category not found
- [x] #4 Uses getUser() for authentication
- [x] #5 Returns 200 with success message
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/categories/[id]/route.ts` - DELETE protects system defaults
<!-- SECTION:NOTES:END -->
