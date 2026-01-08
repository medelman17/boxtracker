---
id: task-71
title: 'API: POST /api/households - Create household endpoint'
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
Create POST endpoint for creating a new household. Creates household record and adds authenticated user as owner in user_households. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Validates input with Zod schema (name, slug)
- [ ] #2 Creates household record in database
- [ ] #3 Adds authenticated user as owner in user_households junction
- [ ] #4 Generates unique slug if not provided
- [ ] #5 Uses getUser() for authentication
- [ ] #6 Returns created household with 201 status
<!-- AC:END -->
