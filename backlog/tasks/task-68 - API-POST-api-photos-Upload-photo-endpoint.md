---
id: task-68
title: 'API: POST /api/photos - Upload photo endpoint'
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
Create POST endpoint for uploading photos to a box. Handles multipart form data, uploads to Supabase Storage (box-photos bucket), creates photo record in database. Follow patterns from docs/api-route-template.md and CLAUDE.md storage conventions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Accepts multipart/form-data with image file and box_id
- [ ] #2 Uploads to Supabase Storage at {household_id}/{box_id}/{uuid}.jpg path
- [ ] #3 Creates photo record in database linked to box
- [ ] #4 Validates user has access to the box's household
- [ ] #5 Uses getUser() for authentication
- [ ] #6 Returns created photo record with signed URL
<!-- AC:END -->
