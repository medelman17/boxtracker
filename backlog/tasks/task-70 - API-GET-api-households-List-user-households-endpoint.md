---
id: task-70
title: 'API: GET /api/households - List user households endpoint'
status: To Do
assignee: []
created_date: '2026-01-08 22:47'
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
- [ ] #1 Endpoint returns all households user belongs to via user_households junction
- [ ] #2 Includes user's role in each household
- [ ] #3 Uses getUser() for authentication
- [ ] #4 Returns UserHouseholdQueryResult[] type
- [ ] #5 Follows response format from api-route-template.md
<!-- AC:END -->
