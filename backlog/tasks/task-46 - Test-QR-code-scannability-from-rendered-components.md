---
id: task-46
title: Test QR code scannability from rendered components
status: To Do
assignee: []
created_date: '2026-01-08 06:45'
labels:
  - qr-code
  - testing
  - integration
  - scannability
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create tests to verify QR codes rendered by components are actually scannable.

Test approach:
- Render QRCode component with test value
- Capture rendered QR code as image
- Use QR decoding library (jsQR or similar) to decode image
- Verify decoded value matches input value
- Test with different sizes (100px, 200px, 400px)
- Test with different error correction levels (L, M, Q, H)
- Test with edge cases (very long URLs, special characters)

This ensures QR codes work in real-world scanning scenarios.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Test file created with QR decoding
- [ ] #2 Tests verify QR codes decode correctly
- [ ] #3 Tests cover different sizes and error levels
- [ ] #4 Tests cover edge cases (long URLs, special chars)
- [ ] #5 Uses real QR decoding library (jsQR or similar)
<!-- AC:END -->
