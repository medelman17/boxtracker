---
id: task-7
title: Build label printing system (Avery 5164 format)
status: Done
assignee: []
created_date: '2026-01-08 02:50'
updated_date: '2026-01-08 17:55'
labels:
  - feature
  - labels
  - web
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create PDF label generator using @react-pdf/renderer targeting Avery 5164 format (3⅓" × 4", 6 per sheet). Include QR code, box label, location info, and category color. Support batch printing multiple labels.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Labels match Avery 5164 dimensions exactly
- [ ] #2 QR code, text, and colors render correctly in PDF
- [ ] #3 Support single label or batch printing
- [ ] #4 Preview labels before printing
- [ ] #5 Print-ready PDF downloads
- [ ] #6 Labels physically align with Avery 5164 sheets
<!-- AC:END -->
