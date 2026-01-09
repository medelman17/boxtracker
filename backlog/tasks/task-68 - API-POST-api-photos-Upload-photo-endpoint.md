---
id: task-68
title: 'API: POST /api/photos - Upload photo endpoint'
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
Create POST endpoint for uploading photos to a box. Handles multipart form data, uploads to Supabase Storage (box-photos bucket), creates photo record in database. Follow patterns from docs/api-route-template.md and CLAUDE.md storage conventions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Accepts multipart/form-data with image file and box_id
- [x] #2 Uploads to Supabase Storage at {household_id}/{box_id}/{uuid}.jpg path
- [x] #3 Creates photo record in database linked to box
- [x] #4 Validates user has access to the box's household
- [x] #5 Uses getUser() for authentication
- [x] #6 Returns created photo record with signed URL
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in `apps/web/app/api/photos/route.ts` - POST handler creates record after storage upload
<!-- SECTION:NOTES:END -->
