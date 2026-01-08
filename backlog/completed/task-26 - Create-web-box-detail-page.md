---
id: task-26
title: Create web box detail page
status: Done
assignee: []
created_date: '2026-01-08 06:33'
updated_date: '2026-01-08 06:35'
labels:
  - web
  - pages
  - box-detail
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create `apps/web/app/dashboard/boxes/[id]/page.tsx` as Server Component for box details.

Page should display:
- Box label and status
- Category and box type
- Location (pallet/row/position)
- QR code (using QRCode component)
- Photos gallery
- "Print Label" button

Use Server Component for data fetching.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Box detail page created at apps/web/app/dashboard/boxes/[id]/page.tsx
- [x] #2 Server Component fetches box data
- [x] #3 Displays all box information (label, status, category, type, location)
- [x] #4 QRCode component rendered with box.qr_code value
- [x] #5 Photos displayed if present
- [ ] #6 Print Label button visible
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created `/packages/ui/src/components/qr-code.web.tsx` using react-qr-code library.

Implementation details:
- Uses QRCodeSVG from react-qr-code
- Implements QRCodeProps interface with all defaults
- Level M error correction applied by default
- Includes quiet zone (margin) by default
- Supports className for Tailwind CSS styling
- Comprehensive JSDoc with usage example
<!-- SECTION:NOTES:END -->
