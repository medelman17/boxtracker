---
id: task-73
title: 'API: DELETE /api/households/[id] - Soft delete household endpoint'
status: To Do
assignee: []
created_date: '2026-01-08 22:47'
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
- [ ] #1 Only allows owner role to delete
- [ ] #2 Soft deletes by setting deleted_at timestamp
- [ ] #3 Returns 403 if user is not owner
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Returns 200 with success message
<!-- AC:END -->
