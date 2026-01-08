---
id: task-38
title: Write unit tests for useBox hook
status: To Do
assignee: []
created_date: '2026-01-08 06:40'
labels:
  - mobile
  - hooks
  - testing
  - data-fetching
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create test file for useBox data fetching hook at `apps/mobile/hooks/use-box.test.ts`.

Tests should cover:
- Hook fetches box data with related entities (photos, category, box_type)
- Loading state is true initially, false after fetch
- Error state captures fetch failures
- Data state contains BoxWithDetails on success
- refetch() function re-fetches data
- Hook re-fetches when id parameter changes
- Handles invalid/non-existent box IDs gracefully
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Test file created with 7+ test cases
- [ ] #2 All tests pass with pnpm test
- [ ] #3 Coverage >80% for use-box.ts
- [ ] #4 Mocks Supabase client properly
- [ ] #5 Tests async behavior with waitFor/act
<!-- AC:END -->
