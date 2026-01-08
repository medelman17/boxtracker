---
id: task-76
title: 'API: PUT /api/categories/[id] - Update category endpoint'
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
Create PUT endpoint for updating a category. Only allows updating household-specific categories (not system defaults). Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Validates input with Zod schema
- [ ] #2 Only allows updating household-specific categories (not NULL household_id)
- [ ] #3 Returns 403 if attempting to modify system default
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Returns updated category data
<!-- AC:END -->
