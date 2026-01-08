---
id: task-28
title: Create QR code data URL conversion utility
status: Done
assignee: []
created_date: '2026-01-08 06:33'
updated_date: '2026-01-08 16:20'
labels:
  - web
  - utils
  - qr-code
  - pdf
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create `apps/web/lib/qr-utils.ts` with utility to convert QR SVG to PNG data URL for PDF embedding.

Function should:
- Accept QR content string and size
- Render QRCodeSVG to string
- Convert SVG to canvas
- Return PNG data URL
- Apply Level M error correction
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 qr-utils.ts created in apps/web/lib/
- [x] #2 generateQRCodeDataUrl function exported
- [x] #3 Accepts qrContent and optional size parameter
- [x] #4 Returns valid PNG data URL
- [x] #5 QR code in data URL scans correctly
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created `/apps/web/lib/qr-utils.ts` with comprehensive QR code to data URL conversion.

Implementation:
- generateQRCodeDataUrl(): Renders QR code, converts SVG to PNG data URL
- Uses React.createElement with react-qr-code library
- Converts via canvas for PDF embedding
- generateQRCodeDataUrls(): Batch processing for multiple QR codes
- downloadDataUrl() and downloadBlob() helper functions
- Applies Level M error correction
- Returns PNG data URLs compatible with @react-pdf/renderer
<!-- SECTION:NOTES:END -->
