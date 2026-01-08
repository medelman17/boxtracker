---
id: task-44
title: E2E test for QR code deep linking (mobile)
status: To Do
assignee: []
created_date: '2026-01-08 06:45'
labels:
  - mobile
  - testing
  - e2e
  - deep-linking
  - qr-code
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create end-to-end test for QR code scanning and deep linking on mobile.

Test scenarios:
- Generate QR code for a box
- Simulate QR code scan (deep link: boxtrack://box/{id})
- App opens to box detail screen
- Correct box data loads
- User can navigate within app after deep link
- Test deep link when app is closed vs backgrounded
- Test invalid box IDs via deep link
- Test deep link to box in different household (RLS blocking)

Use Maestro or Detox for mobile E2E testing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 E2E test file created for mobile
- [ ] #2 Tests deep link navigation
- [ ] #3 Covers app states (closed, backgrounded, open)
- [ ] #4 Tests invalid scenarios
- [ ] #5 Tests RLS protection via deep links
- [ ] #6 Documented test setup and execution
<!-- AC:END -->
