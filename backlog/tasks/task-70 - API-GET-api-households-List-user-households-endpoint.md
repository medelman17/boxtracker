---
id: task-70
title: 'API: GET /api/households - List user households endpoint'
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
Create GET endpoint for listing households the authenticated user belongs to. Returns household details with user's role in each. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Endpoint returns all households user belongs to via user_households junction
- [x] #2 Includes user's role in each household
- [x] #3 Uses getUser() for authentication
- [x] #4 Returns UserHouseholdQueryResult[] type
- [x] #5 Follows response format from api-route-template.md
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/households/route.ts` - GET handler returns user's households with roles
<!-- SECTION:NOTES:END -->
