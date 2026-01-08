---
id: task-50
title: E2E test for bulk label printing workflow
status: To Do
assignee: []
created_date: '2026-01-08 17:14'
labels:
  - testing
  - e2e-test
  - web
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create end-to-end test for the complete bulk label printing workflow from boxes list page through PDF download.

Test flow should cover:
1. Navigate to /dashboard/boxes
2. Verify boxes table renders with data
3. Select multiple boxes using checkboxes
4. Verify action bar appears with correct count
5. Click "Generate X Labels" button
6. Verify loading state during generation
7. Verify PDF download triggered
8. Verify selection cleared after successful generation
9. Test error recovery (network failure, permission denied)

Additional scenarios:
- Select all boxes and generate labels
- Select boxes, clear selection, select different boxes
- Navigate away while generating (cancellation handling)
- Generate labels for single box vs multiple boxes
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Complete workflow tested from UI interaction to PDF download
- [ ] #2 All user interactions verified (clicks, selections, navigation)
- [ ] #3 Loading and error states properly displayed
- [ ] #4 PDF download verified with file system checks
- [ ] #5 Multiple scenarios covered (1 box, multiple boxes, all boxes)
- [ ] #6 Test runs reliably in CI environment
<!-- AC:END -->
