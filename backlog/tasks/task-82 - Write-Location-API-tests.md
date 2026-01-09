---
id: task-82
title: Write Location API tests
status: To Do
assignee: []
created_date: '2026-01-09 03:28'
labels:
  - testing
  - api
  - location
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add comprehensive test coverage for the Location resource API routes. The Location API was implemented in Phase 2 but tests were deferred. Tests should cover CRUD operations, authorization rules (owner/admin only for mutations), validation, and edge cases.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CRUD operation tests pass for all Location endpoints (GET list, GET single, POST, PATCH, DELETE)
- [ ] #2 Authorization tests verify only owner/admin roles can create/update/delete locations
- [ ] #3 Validation tests confirm Zod schema enforcement on request bodies
- [ ] #4 Soft delete behavior tested (deleted_at timestamp, excluded from queries)
- [ ] #5 Default location constraint tested (only one default per household)
- [ ] #6 Tests use existing test infrastructure from 006_setup_testing_infrastructure.sql
<!-- AC:END -->
