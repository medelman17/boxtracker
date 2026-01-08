---
id: task-65
title: 'API: PUT /api/boxes/[id] - Update box endpoint'
status: To Do
assignee: []
created_date: '2026-01-08 22:47'
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
- [ ] #1 Endpoint updates box fields (label, description, status, category_id, box_type_id)
- [ ] #2 Validates input with Zod schema
- [ ] #3 Returns 404 if box not found
- [ ] #4 Returns 403 if user lacks access
- [ ] #5 Uses getUser() for authentication
- [ ] #6 Returns updated box data
<!-- AC:END -->
