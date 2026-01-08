---
id: task-64
title: 'API: GET /api/boxes/[id] - Get single box endpoint'
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
Create GET endpoint for retrieving a single box by ID. Returns full box details including all relations (photos, category, box_type, location). Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Endpoint returns single box with all relations
- [ ] #2 Returns 404 if box not found
- [ ] #3 Returns 403 if user lacks access (RLS)
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Returns BoxDetailQueryResult type
<!-- AC:END -->
