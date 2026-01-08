---
id: task-40
title: Visual regression tests for QRCode rendering
status: To Do
assignee: []
created_date: '2026-01-08 06:40'
labels:
  - qr-code
  - testing
  - visual-regression
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create visual regression tests to verify QR codes render correctly and remain scannable.

Tests should:
- Capture screenshots of rendered QR codes (different sizes, error levels)
- Verify QR code visual structure (quiet zone, modules, patterns)
- Test that generated QR codes are actually scannable
- Compare against baseline images for consistency
- Test edge cases (very long URLs, special characters)

Use Vitest's toMatchScreenshot or similar visual testing tools.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Visual tests created for QRCode component
- [ ] #2 Baseline screenshots captured for comparison
- [ ] #3 Tests verify QR codes are scannable
- [ ] #4 Tests cover different sizes and error correction levels
- [ ] #5 CI pipeline configured to run visual tests
<!-- AC:END -->
