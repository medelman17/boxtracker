---
id: task-79
title: 'API: POST /api/box-types - Create box type endpoint'
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
Create POST endpoint for creating a household-specific box type. Validates input and creates box type linked to household. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Validates input with Zod schema (name, dimensions, household_id)
- [ ] #2 Creates box type linked to specified household
- [ ] #3 Validates user has access to household
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Returns created box type with 201 status
<!-- AC:END -->
