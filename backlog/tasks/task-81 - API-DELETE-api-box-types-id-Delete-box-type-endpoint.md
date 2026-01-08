---
id: task-81
title: 'API: DELETE /api/box-types/[id] - Delete box type endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:48'
updated_date: '2026-01-08 23:08'
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
- [ ] #1 Only allows deleting household-specific box types
- [ ] #2 Returns 403 if attempting to delete system default
- [ ] #3 Returns 404 if box type not found
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Returns 200 with success message
<!-- AC:END -->
