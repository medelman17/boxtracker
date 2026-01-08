---
id: task-75
title: 'API: POST /api/categories - Create category endpoint'
status: To Do
assignee: []
created_date: '2026-01-08 22:47'
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
- [ ] #1 Validates input with Zod schema (name, color, household_id)
- [ ] #2 Creates category linked to specified household
- [ ] #3 Validates user has access to household
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Returns created category with 201 status
<!-- AC:END -->
