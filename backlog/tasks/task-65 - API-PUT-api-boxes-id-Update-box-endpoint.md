---
id: task-65
title: 'API: PUT /api/boxes/[id] - Update box endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:47'
updated_date: '2026-01-09 01:57'
labels:
  - api
  - boxes
  - backend
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create PUT endpoint for updating a box. Validates input with Zod schema, updates box record, and returns updated box. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Endpoint updates box fields (label, description, status, category_id, box_type_id)
- [x] #2 Validates input with Zod schema
- [x] #3 Returns 404 if box not found
- [x] #4 Returns 403 if user lacks access
- [x] #5 Uses getUser() for authentication
- [x] #6 Returns updated box data
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/boxes/[id]/route.ts` - PUT handler with status timestamp tracking
<!-- SECTION:NOTES:END -->
