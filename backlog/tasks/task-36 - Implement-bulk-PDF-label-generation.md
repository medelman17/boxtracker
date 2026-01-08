---
id: task-36
title: Implement bulk PDF label generation
status: Done
assignee: []
created_date: '2026-01-08 06:33'
updated_date: '2026-01-08 17:55'
labels:
  - web
  - boxes-list
  - pdf
  - bulk-export
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add "Generate Labels" button and functionality for bulk PDF generation.

Features:
- Button appears when boxes are selected
- Shows count: "Generate X Label(s)"
- Fetches selected box data
- Generates QR data URLs in parallel
- Creates multi-page PDF with BoxLabelsDocument
- Triggers download
- Shows progress/loading state
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Generate Labels button visible when boxes selected
- [ ] #2 Button shows correct count
- [ ] #3 Fetches all selected box data
- [ ] #4 Generates QR codes in parallel
- [ ] #5 Creates multi-page PDF (6 labels per page)
- [ ] #6 Downloads PDF automatically
- [ ] #7 Loading indicator shown during generation
<!-- AC:END -->
