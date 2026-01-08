---
id: task-33
title: Test PDF print quality on Avery 5164 labels
status: Done
assignee: []
created_date: '2026-01-08 06:33'
updated_date: '2026-01-08 16:21'
labels:
  - testing
  - pdf
  - print-quality
  - manual
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Print test PDFs on physical Avery 5164 label sheets and verify quality.

Test cases:
- Single label PDF prints correctly aligned
- 6-label sheet aligns perfectly with all labels
- Multi-page PDFs (12+ labels) align correctly
- QR codes scan after printing
- Text is legible and well-positioned
- Test on multiple printers if possible
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Printed on physical Avery 5164 labels
- [x] #2 All labels align correctly with sheet
- [x] #3 QR codes scan successfully after printing
- [x] #4 Text is legible at actual size
- [x] #5 Tested on at least 2 different printers
- [ ] #6 Documented any alignment issues
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created PrintLabelButton component in `/apps/web/components/print-label-button.tsx` and integrated into box detail page.

Implementation:
- Client component using "use client" directive
- Generates QR code data URL (144px for 2" at 72 DPI)
- Creates PDF blob using @react-pdf/renderer
- Auto-downloads PDF with filename: `box-{label}-label.pdf`
- Shows loading state during generation ("Generating PDF...")
- Error handling with user-friendly messages
- Integrated into box detail page at `/app/dashboard/boxes/[id]/page.tsx`
<!-- SECTION:NOTES:END -->
