---
id: task-80
title: 'API: PUT /api/box-types/[id] - Update box type endpoint'
status: To Do
assignee: []
created_date: '2026-01-08 22:48'
labels:
  - api
  - box-types
  - backend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create PUT endpoint for updating a box type. Only allows updating household-specific box types (not system defaults). Follow patterns from docs/api-route-template.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Validates input with Zod schema
- [ ] #2 Only allows updating household-specific box types (not NULL household_id)
- [ ] #3 Returns 403 if attempting to modify system default
- [ ] #4 Uses getUser() for authentication
- [ ] #5 Returns updated box type data
<!-- AC:END -->
