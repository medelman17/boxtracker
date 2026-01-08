---
id: task-78
title: 'API: GET /api/box-types - List box types endpoint'
status: To Do
assignee: []
created_date: '2026-01-08 22:48'
labels:
  - api
  - box-types
  - backend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create GET endpoint for listing box types. Returns both system defaults (NULL household_id) and household-specific box types. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Returns system default box types (household_id IS NULL)
- [ ] #2 Returns household-specific box types for user's households
- [ ] #3 Supports filtering by household_id query param
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Follows response format from api-route-template.md
<!-- AC:END -->
