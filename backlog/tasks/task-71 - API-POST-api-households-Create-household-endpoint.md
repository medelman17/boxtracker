---
id: task-71
title: 'API: POST /api/households - Create household endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:47'
updated_date: '2026-01-09 01:57'
labels:
  - api
  - households
  - backend
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create POST endpoint for creating a new household. Creates household record and adds authenticated user as owner in user_households. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Validates input with Zod schema (name, slug)
- [x] #2 Creates household record in database
- [x] #3 Adds authenticated user as owner in user_households junction
- [x] #4 Generates unique slug if not provided
- [x] #5 Uses getUser() for authentication
- [x] #6 Returns created household with 201 status
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/households/route.ts` - POST creates household and adds user as owner
<!-- SECTION:NOTES:END -->
