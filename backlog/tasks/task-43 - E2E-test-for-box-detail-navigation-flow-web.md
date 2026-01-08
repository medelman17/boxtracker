---
id: task-43
title: E2E test for box detail navigation flow (web)
status: To Do
assignee: []
created_date: '2026-01-08 06:45'
labels:
  - web
  - testing
  - e2e
  - navigation
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create end-to-end test for box detail page navigation on web.

Test flow:
- User logs in
- Navigates to boxes list page
- Clicks on a box
- Box detail page loads with correct data
- QR code is visible and renders
- User can navigate back to boxes list
- Direct URL navigation works (e.g., /dashboard/boxes/{id})
- Invalid box ID shows 404 page

Use Playwright or similar E2E testing tool.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 E2E test file created
- [ ] #2 Tests full navigation flow
- [ ] #3 Verifies box data displays correctly
- [ ] #4 Tests back navigation
- [ ] #5 Tests direct URL access
- [ ] #6 Tests 404 handling
<!-- AC:END -->
