---
id: task-25
title: Create shared QRCode props TypeScript interface
status: Done
assignee: []
created_date: '2026-01-08 06:33'
updated_date: '2026-01-08 06:35'
labels:
  - qr-code
  - shared
  - types
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create `packages/ui/src/components/qr-code.types.ts` with shared props interface for both web and mobile QR components.

Props should include:
- value: string (QR content)
- size?: number (default 200)
- level?: "L"|"M"|"Q"|"H" (default "M")
- includeMargin?: boolean (default true)
- className?: string
- testID?: string
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 qr-code.types.ts file created in packages/ui/src/components/
- [x] #2 QRCodeProps interface exported
- [x] #3 All props documented with JSDoc comments
- [x] #4 Type validates in TypeScript strict mode
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created `/packages/ui/src/components/qr-code.types.ts` with comprehensive JSDoc documentation.

All props documented with:
- Purpose and usage examples
- Default values
- Error correction level explanations
- Platform-specific notes (className for web only)

Type validates in TypeScript strict mode.
<!-- SECTION:NOTES:END -->
