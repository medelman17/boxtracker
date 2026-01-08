---
id: task-48
title: Unit tests for BoxesTable component
status: To Do
assignee: []
created_date: '2026-01-08 17:13'
labels:
  - testing
  - unit-test
  - web
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create comprehensive unit tests for the BoxesTable client component covering selection state management, checkbox interactions, and UI rendering.

Test coverage should include:
- Rendering table with box data
- Checkbox selection and deselection
- Select all / deselect all functionality
- Indeterminate checkbox state when some boxes selected
- Selected row highlighting (blue background)
- Action bar visibility based on selection state
- Selected count display accuracy
- Clear selection button functionality
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All checkbox interactions tested (individual, select all, clear)
- [ ] #2 Selection state management verified with Set operations
- [ ] #3 Visual states tested (highlighted rows, action bar appearance)
- [ ] #4 Edge cases covered (empty list, single box, all boxes selected)
- [ ] #5 Test coverage >80% for BoxesTable component
<!-- AC:END -->
