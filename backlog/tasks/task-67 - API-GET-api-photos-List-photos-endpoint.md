---
id: task-67
title: 'API: GET /api/photos - List photos endpoint'
status: To Do
assignee: []
created_date: '2026-01-08 22:47'
labels:
  - api
  - photos
  - backend
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create GET endpoint for listing photos. Supports filtering by box_id. Returns photo metadata with signed URLs for display. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Endpoint returns photos filtered by box_id query param
- [ ] #2 Generates signed URLs for each photo (not public URLs)
- [ ] #3 Returns 403 if user lacks access to the box's household
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Returns photo metadata with signed_url field
<!-- AC:END -->
