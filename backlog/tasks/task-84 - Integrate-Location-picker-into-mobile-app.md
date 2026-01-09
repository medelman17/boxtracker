---
id: task-84
title: Integrate Location picker into mobile app
status: To Do
assignee: []
created_date: '2026-01-09 03:29'
labels:
  - mobile
  - ui
  - location
  - integration
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add Location selection and management to the mobile app workflows. The Location list and detail screens exist but need integration into pallet creation and box search. This includes a location picker modal/bottom sheet, location form for creating new locations, and updating existing flows to use locations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Location picker component created (modal or bottom sheet)
- [ ] #2 Location form bottom sheet for creating new locations inline
- [ ] #3 Pallet creation flow includes location selection step
- [ ] #4 Box search screen includes location filter
- [ ] #5 Box detail shows full location path
- [ ] #6 Location picker uses useLocations hook from hooks/use-locations.ts
<!-- AC:END -->
