---
id: task-72
title: 'API: PUT /api/households/[id] - Update household endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:47'
updated_date: '2026-01-08 23:04'
labels:
  - api
  - households
  - backend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create PUT endpoint for updating household details. Only owners/admins can update. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Validates input with Zod schema
- [ ] #2 Only allows owner/admin roles to update
- [ ] #3 Updates household name and/or slug
- [ ] #4 Returns 403 if user lacks permission
- [ ] #5 Uses getUser() for authentication
- [ ] #6 Returns updated household data
<!-- AC:END -->
