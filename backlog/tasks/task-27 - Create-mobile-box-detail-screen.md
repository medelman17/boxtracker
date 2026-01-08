---
id: task-27
title: Create mobile box detail screen
status: Done
assignee: []
created_date: '2026-01-08 06:33'
updated_date: '2026-01-08 17:55'
labels:
  - mobile
  - screens
  - box-detail
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create `apps/mobile/app/box/[id].tsx` for box details on mobile.

Screen should display:
- Box label and status
- Category and box type  
- Location (pallet/row/position)
- QR code (using QRCode component)
- Photos gallery in ScrollView

Use useBox hook for data fetching.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Box detail screen created at apps/mobile/app/box/[id].tsx
- [ ] #2 Uses useBox hook for data fetching
- [ ] #3 ScrollView layout with all box information
- [ ] #4 QRCode component rendered with box.qr_code value
- [ ] #5 Loading state shown while fetching
- [ ] #6 Error state handled gracefully
<!-- AC:END -->
