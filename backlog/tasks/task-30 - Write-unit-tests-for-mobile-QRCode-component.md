---
id: task-30
title: Write unit tests for mobile QRCode component
status: To Do
assignee: []
created_date: '2026-01-08 06:33'
labels:
  - qr-code
  - mobile
  - testing
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create test file for mobile QR component at `packages/ui/src/components/qr-code.native.test.tsx`.

Tests should cover:
- Component renders with required props
- Default values applied correctly
- QR content value passed through
- Error correction level applied (ecl prop)
- testID prop works for testing
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Test file created with 5+ test cases
- [ ] #2 All tests pass with pnpm test
- [ ] #3 Coverage >80% for qr-code.native.tsx
- [ ] #4 Uses React Native Testing Library
<!-- AC:END -->
