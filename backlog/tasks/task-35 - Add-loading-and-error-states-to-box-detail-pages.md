---
id: task-35
title: Add loading and error states to box detail pages
status: To Do
assignee: []
created_date: '2026-01-08 06:33'
labels:
  - web
  - mobile
  - ui
  - error-handling
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement proper loading and error UI states for box detail pages on both web and mobile.

Web:
- Loading skeleton while fetching
- Error boundary for fetch failures
- Not found state for invalid box IDs

Mobile:
- Loading spinner/skeleton
- Error message display
- Retry button on errors
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Loading state shown while fetching box data
- [ ] #2 Error states display helpful messages
- [ ] #3 404/not found shown for invalid box IDs
- [ ] #4 Mobile includes retry functionality
- [ ] #5 Web uses error boundary pattern
<!-- AC:END -->
