---
id: task-69
title: 'API: DELETE /api/photos/[id] - Delete photo endpoint'
status: To Do
assignee: []
created_date: '2026-01-08 22:47'
labels:
  - api
  - photos
  - backend
  - storage
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create DELETE endpoint for removing a photo. Deletes from both Supabase Storage and database. Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Endpoint deletes photo from Supabase Storage bucket
- [ ] #2 Endpoint deletes photo record from database
- [ ] #3 Returns 404 if photo not found
- [ ] #4 Returns 403 if user lacks access
- [ ] #5 Uses getUser() for authentication
- [ ] #6 Returns 200 with success message
<!-- AC:END -->
