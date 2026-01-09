---
id: task-63
title: 'API: GET /api/boxes - List boxes endpoint'
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
Create GET endpoint for listing boxes. Should support filtering by household_id, status, category, and search query. Returns paginated results with box metadata including category and box_type names. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Endpoint returns boxes filtered by authenticated user's household
- [x] #2 Supports query params: household_id, status, category_id, search, limit, offset
- [x] #3 Returns BoxListItem[] with related category and box_type names
- [x] #4 Uses getUser() for authentication (not getSession)
- [x] #5 Follows response format from api-route-template.md
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/boxes/route.ts` - GET handler with filtering support
<!-- SECTION:NOTES:END -->
