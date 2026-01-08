---
id: task-29
title: Create BoxLabel PDF component for single label
status: Done
assignee: []
created_date: '2026-01-08 06:33'
updated_date: '2026-01-08 16:20'
labels:
  - web
  - pdf
  - components
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create BoxLabel component in `apps/web/components/pdf/box-label.tsx` using @react-pdf/renderer.

Component should:
- Render single label (4" × 3.33")
- Display box label/number
- Show location info
- Embed QR code (1.5" × 1.5")
- Show category name
- Show description (truncated to 2 lines)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 BoxLabel component created using @react-pdf/renderer
- [x] #2 Label dimensions match 4 inches × 3.33 inches
- [x] #3 QR code embedded as image (1.5 inch square)
- [x] #4 Box information displayed (label, location, category)
- [x] #5 Description truncated to 2 lines max
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created BoxLabel component in `/apps/web/components/pdf/box-label.tsx` using @react-pdf/renderer.

Implementation:
- Single label component (4" × 3.33" Avery 5164 dimensions)
- Displays box label/number (16pt bold header)
- Shows status (8pt uppercase)
- Embeds QR code as PNG image (1.5" × 1.5")
- Shows category name (9pt)
- Truncates description to ~60 chars for 2 lines (7pt)
- Uses StyleSheet for precise point-based dimensions
- Handles margins for multi-column layout
<!-- SECTION:NOTES:END -->
