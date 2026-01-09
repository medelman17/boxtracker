---
id: task-76
title: 'API: PUT /api/categories/[id] - Update category endpoint'
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
Create PUT endpoint for updating a category. Only allows updating household-specific categories (not system defaults). Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Validates input with Zod schema
- [x] #2 Only allows updating household-specific categories (not NULL household_id)
- [x] #3 Returns 403 if attempting to modify system default
- [x] #4 Uses getUser() for authentication
- [x] #5 Returns updated category data
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/categories/[id]/route.ts` - PUT protects system defaults
<!-- SECTION:NOTES:END -->
