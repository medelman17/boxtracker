---
id: task-69
title: 'API: DELETE /api/photos/[id] - Delete photo endpoint'
status: Done
assignee: []
created_date: '2026-01-08 22:47'
updated_date: '2026-01-09 01:57'
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
- [x] #1 Endpoint deletes photo from Supabase Storage bucket
- [x] #2 Endpoint deletes photo record from database
- [x] #3 Returns 404 if photo not found
- [x] #4 Returns 403 if user lacks access
- [x] #5 Uses getUser() for authentication
- [x] #6 Returns 200 with success message
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/photos/[id]/route.ts` - DELETE removes from storage and soft deletes record
<!-- SECTION:NOTES:END -->
