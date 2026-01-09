---
id: task-79
title: 'API: POST /api/box-types - Create box type endpoint'
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
Create POST endpoint for creating a household-specific box type. Validates input and creates box type linked to household. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Validates input with Zod schema (name, dimensions, household_id)
- [x] #2 Creates box type linked to specified household
- [x] #3 Validates user has access to household
- [x] #4 Uses getUser() for authentication
- [x] #5 Returns created box type with 201 status
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/box-types/route.ts` - POST with auto volume calculation
<!-- SECTION:NOTES:END -->
