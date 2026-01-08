---
id: task-39
title: Integration test for QRCode platform resolution
status: To Do
assignee: []
created_date: '2026-01-08 06:40'
labels:
  - qr-code
  - testing
  - integration
  - platform
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create integration test to verify QRCode component resolves correctly on both platforms.

Test should verify:
- Web app imports resolve to qr-code.web.tsx implementation
- Mobile app imports resolve to qr-code.native.tsx implementation
- Both platforms can import from '@boxtrack/ui' with same API
- TypeScript types are consistent across platforms
- Props interface works identically on both platforms

This ensures the platform-specific file resolution works as expected.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Integration test created in packages/ui/src/components/
- [ ] #2 Verifies correct platform resolution
- [ ] #3 Tests run on both web and mobile
- [ ] #4 Confirms API consistency across platforms
- [ ] #5 Documentation for running platform-specific tests
<!-- AC:END -->
