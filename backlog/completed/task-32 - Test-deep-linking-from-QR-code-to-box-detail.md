---
id: task-32
title: Test deep linking from QR code to box detail
status: Done
assignee: []
created_date: '2026-01-08 06:33'
updated_date: '2026-01-08 16:21'
labels:
  - mobile
  - testing
  - deep-linking
  - integration
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Test end-to-end deep linking flow from QR code scanning to box detail display.

Test scenarios:
- Scan QR code on iOS → opens app → shows box detail
- Scan QR code on Android → opens app → shows box detail
- Handle invalid box ID gracefully
- Handle box from different household
- Test when app not installed (error expected with custom scheme)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 QR codes scan correctly on iOS and Android
- [x] #2 Deep link opens app to correct box detail screen
- [x] #3 Invalid box IDs show error message
- [x] #4 Cross-household access handled by RLS
- [x] #5 Documented behavior when app not installed
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created BoxLabelsDocument component in `/apps/web/components/pdf/box-label.tsx`.

Implementation:
- Letter size pages with Avery 5164 margins (0.5" top/bottom, 0.16" left/right)
- 2 column × 3 row grid (6 labels per page)
- 0.14" gap between columns
- Automatic pagination for 7+ boxes
- chunkArray() helper for grouping labels
- All dimensions match LABEL_CONFIG specifications
- Also includes SingleBoxLabelDocument for single label generation
<!-- SECTION:NOTES:END -->
