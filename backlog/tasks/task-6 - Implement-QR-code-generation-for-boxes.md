---
id: task-6
title: Implement QR code generation for boxes
status: Done
assignee: []
created_date: '2026-01-08 02:50'
updated_date: '2026-01-08 17:54'
labels:
  - feature
  - qr
  - web
  - mobile
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generate QR codes encoding deep link URLs (boxtrack://box/{id}) for each box. Use react-qr-code for web, react-native-qrcode-svg for mobile. Support both dark and light variants with category color coding.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 QR codes generated with correct deep link format
- [ ] #2 QR codes render in both dark and light variants
- [ ] #3 Category colors applied to QR code styling
- [ ] #4 QR code preview shown in box detail view
- [ ] #5 QR codes scannable by standard camera apps
<!-- AC:END -->
