---
id: task-51
title: 'Manual test: Physical label printing and QR scannability'
status: To Do
assignee: []
created_date: '2026-01-08 17:14'
labels:
  - testing
  - manual-test
  - print
  - qr
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manually verify that bulk-generated PDFs print correctly on physical Avery 5164 label sheets and that QR codes are scannable.

Test procedure:
1. Generate bulk labels for 6+ boxes (to test multi-page)
2. Print first page on Avery 5164 label sheet
3. Verify label alignment with physical sheet
4. Check QR code positioning and sizing
5. Scan each QR code with mobile camera
6. Verify deep links work correctly (opens app, shows correct box)
7. Check text readability (label, category, description)
8. Test with different printers (laser, inkjet)
9. Test with different PDF viewers (Preview, Adobe, Chrome)

Quality checks:
- All 6 labels per sheet properly aligned
- QR codes scannable from 6-12 inches away
- Text not cut off or overlapping
- Margins consistent across all labels
- Second page alignment matches first page
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 PDFs print with perfect alignment on Avery 5164 sheets
- [ ] #2 All QR codes scannable from typical scanning distance
- [ ] #3 Deep links navigate to correct box detail page
- [ ] #4 Text readable and properly positioned
- [ ] #5 Multi-page PDFs maintain alignment consistency
- [ ] #6 Tested on at least 2 different printers
<!-- AC:END -->
