---
id: task-75
title: 'API: POST /api/categories - Create category endpoint'
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
Create POST endpoint for creating a household-specific category. Validates input and creates category linked to household. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Validates input with Zod schema (name, color, household_id)
- [x] #2 Creates category linked to specified household
- [x] #3 Validates user has access to household
- [x] #4 Uses getUser() for authentication
- [x] #5 Returns created category with 201 status
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/categories/route.ts` - POST creates household-specific category
<!-- SECTION:NOTES:END -->
