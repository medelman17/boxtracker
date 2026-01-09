---
id: task-83
title: Integrate Location selector into web UI forms
status: To Do
assignee: []
created_date: '2026-01-09 03:28'
labels:
  - web
  - ui
  - location
  - integration
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add Location selection and filtering to existing web UI pages. The Location resource has its own management pages but needs to be integrated into pallet and box workflows. This includes adding a location selector dropdown to pallet forms, location filter to box search, and location context to detail pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Location selector dropdown component created for pallet create/edit forms
- [ ] #2 Pallet forms pre-select default location and allow changing
- [ ] #3 Box search page includes location filter dropdown
- [ ] #4 Box detail page shows full location path (Location > Pallet > Row > Position)
- [ ] #5 Dashboard summary includes location count or breakdown
- [ ] #6 Location selector fetches from /api/locations with household filter
<!-- AC:END -->
