---
id: task-74
title: 'API: GET /api/categories - List categories endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:47'
updated_date: '2026-01-08 23:08'
labels:
  - api
  - categories
  - backend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create GET endpoint for listing categories. Returns both system defaults (NULL household_id) and household-specific categories. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Returns system default categories (household_id IS NULL)
- [ ] #2 Returns household-specific categories for user's households
- [ ] #3 Supports filtering by household_id query param
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Follows response format from api-route-template.md
<!-- AC:END -->
