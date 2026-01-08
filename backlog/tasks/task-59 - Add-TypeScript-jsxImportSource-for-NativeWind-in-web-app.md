---
id: task-59
title: Add TypeScript jsxImportSource for NativeWind in web app
status: To Do
assignee: []
created_date: '2026-01-08 21:54'
updated_date: '2026-01-08 21:55'
labels:
  - web
  - typescript
  - nativewind
milestone: Universal Components & Cross-Platform UI
dependencies:
  - task-55
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Configure TypeScript in the web app to use NativeWind's JSX transform, required for NativeWind styling to work correctly.

## Current State
- apps/web/tsconfig.json has no jsxImportSource configuration
- NativeWind className props won't work without this

## Required Change

### apps/web/tsconfig.json
```json
{
  "compilerOptions": {
    "jsxImportSource": "nativewind",
    // ... existing options
  }
}
```

### apps/web/nativewind-env.d.ts (create new file)
```typescript
/// <reference types="nativewind/types" />
```

## Note
This is only needed if using NativeWind on web. If using regular Tailwind v4 with gluestack-ui (which has its own styling), this may not be required. Evaluate based on chosen universal component strategy.

## Dependencies
- Task 55 (Configure Next.js for react-native-web) should be completed first to determine if NativeWind on web is needed
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 jsxImportSource set to nativewind in tsconfig.json
- [ ] #2 nativewind-env.d.ts created with type reference
- [ ] #3 No TypeScript errors related to className prop
- [ ] #4 NativeWind styles apply correctly to components
<!-- AC:END -->
