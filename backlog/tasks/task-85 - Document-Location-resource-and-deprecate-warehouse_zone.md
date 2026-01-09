---
id: task-85
title: Document Location resource and deprecate warehouse_zone
status: To Do
assignee: []
created_date: '2026-01-09 03:29'
labels:
  - documentation
  - location
  - deprecation
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Complete documentation for the Location resource and begin deprecation of the legacy warehouse_zone field. This includes API documentation, user guide updates, and adding deprecation warnings to code that uses warehouse_zone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 API documentation updated to include Location endpoints
- [ ] #2 User guide explains how to manage locations
- [ ] #3 Deprecation warnings added to code accessing pallets.warehouse_zone
- [ ] #4 Migration path documented for moving from warehouse_zone to location_id
- [ ] #5 ADR 002 referenced in relevant documentation
<!-- AC:END -->
