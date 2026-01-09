---
id: task-64
title: 'API: GET /api/boxes/[id] - Get single box endpoint'
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
Create GET endpoint for retrieving a single box by ID. Returns full box details including all relations (photos, category, box_type, location). Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Endpoint returns single box with all relations
- [x] #2 Returns 404 if box not found
- [x] #3 Returns 403 if user lacks access (RLS)
- [x] #4 Uses getUser() for authentication
- [x] #5 Returns BoxDetailQueryResult type
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/boxes/[id]/route.ts` - GET handler with full relations
<!-- SECTION:NOTES:END -->
