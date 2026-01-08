---
id: task-63
title: 'API: GET /api/boxes - List boxes endpoint'
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
Create GET endpoint for listing boxes. Should support filtering by household_id, status, category, and search query. Returns paginated results with box metadata including category and box_type names. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Endpoint returns boxes filtered by authenticated user's household
- [ ] #2 Supports query params: household_id, status, category_id, search, limit, offset
- [ ] #3 Returns BoxListItem[] with related category and box_type names
- [ ] #4 Uses getUser() for authentication (not getSession)
- [ ] #5 Follows response format from api-route-template.md
<!-- AC:END -->
