---
id: task-78
title: 'API: GET /api/box-types - List box types endpoint'
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
Create GET endpoint for listing box types. Returns both system defaults (NULL household_id) and household-specific box types. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Returns system default box types (household_id IS NULL)
- [x] #2 Returns household-specific box types for user's households
- [x] #3 Supports filtering by household_id query param
- [x] #4 Uses getUser() for authentication
- [x] #5 Follows response format from api-route-template.md
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/box-types/route.ts` - GET returns system defaults + household-specific
<!-- SECTION:NOTES:END -->
