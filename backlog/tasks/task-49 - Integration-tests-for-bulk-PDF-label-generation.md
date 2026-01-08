---
id: task-49
title: Integration tests for bulk PDF label generation
status: To Do
assignee: []
created_date: '2026-01-08 17:14'
labels:
  - testing
  - integration-test
  - web
  - pdf
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create integration tests for the bulk PDF generation workflow, including QR code data URL generation, PDF creation, and download functionality.

Test coverage should include:
- Parallel QR code data URL generation for multiple boxes
- PDF document creation with BoxLabelsDocument component
- Correct pagination (6 labels per sheet, 2 columns × 3 rows)
- PDF blob creation and download trigger
- Filename format with timestamp
- Error handling for failed QR generation
- Error handling for failed PDF creation
- Loading states during generation
- Selection clearing after successful generation
- Performance with varying box counts (1, 6, 12, 20+ boxes)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QR code generation tested with mocked generateQRCodeDataUrls
- [ ] #2 PDF creation tested with mocked @react-pdf/renderer
- [ ] #3 Download functionality verified with blob URL creation
- [ ] #4 Error states properly displayed to user
- [ ] #5 Loading states prevent duplicate operations
- [ ] #6 Multi-page PDFs correctly formatted (7+ boxes span 2 pages)
- [ ] #7 Performance acceptable for 50+ boxes (<10 seconds)
<!-- AC:END -->
