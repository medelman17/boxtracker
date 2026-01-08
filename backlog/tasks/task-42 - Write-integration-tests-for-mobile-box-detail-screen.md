---
id: task-42
title: Write integration tests for mobile box detail screen
status: To Do
assignee: []
created_date: '2026-01-08 06:45'
labels:
  - mobile
  - testing
  - integration
  - box-detail
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create integration tests for mobile box detail screen at `apps/mobile/app/box/[id].test.tsx`.

Tests should cover:
- Screen renders box data from useBox hook
- Loading state shown while fetching
- Error state displays with retry button
- Not found state for missing boxes
- All box information displayed correctly
- QR code renders with correct value
- Photos gallery displays when photos exist
- Metadata section shows dates
- Retry button refetches data
- Back navigation works correctly
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Test file created with 10+ test cases
- [ ] #2 All tests pass with pnpm test
- [ ] #3 Mocks useBox hook properly
- [ ] #4 Uses React Native Testing Library
- [ ] #5 Covers all UI states (loading, error, success, not found)
<!-- AC:END -->
