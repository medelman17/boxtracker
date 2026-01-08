---
id: task-45
title: Snapshot tests for box detail page layouts
status: To Do
assignee: []
created_date: '2026-01-08 06:45'
labels:
  - testing
  - snapshot
  - web
  - mobile
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create snapshot tests to ensure box detail page layouts remain consistent.

Create snapshots for:
- Web box detail page with all data populated
- Web box detail page with minimal data (no photos, no category)
- Mobile box detail screen with all data
- Mobile box detail screen with minimal data
- Loading states
- Error states

Use Vitest snapshots or similar tooling.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Snapshot test files created
- [ ] #2 Snapshots cover complete and minimal data scenarios
- [ ] #3 Snapshots capture all UI states
- [ ] #4 Tests prevent unintended layout regressions
- [ ] #5 Snapshots committed to repository
<!-- AC:END -->
