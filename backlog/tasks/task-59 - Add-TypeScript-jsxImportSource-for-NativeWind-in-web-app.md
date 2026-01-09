---
id: task-59
title: Add TypeScript jsxImportSource for NativeWind in web app
status: Done
assignee: []
created_date: '2026-01-08 21:54'
updated_date: '2026-01-09 03:43'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Resolution: Not Applicable

After investigation, this task is **not needed** for the current architecture:

### Findings
1. The web app uses **Tailwind CSS v4 directly** with standard `className` props
2. React Native components on web use `StyleSheet.create()` (see `components/rn-web-test.tsx`)
3. gluestack-ui components use their own `tva()` styling abstraction
4. Adding `jsxImportSource: "nativewind"` actually **breaks the build** because:
   - It forces NativeWind's JSX runtime for ALL files including server routes
   - This pulls in React Native code that Turbopack can't parse (Flow type syntax)

### Task Note Confirmation
The task description itself notes: "This is only needed if using NativeWind on web. If using regular Tailwind v4 with gluestack-ui (which has its own styling), this may not be required."

The current architecture uses Tailwind v4 + gluestack-ui, so NativeWind's JSX transform is not needed.

### Acceptance Criteria Status
- AC #1-2: Not implemented (would break build)
- AC #3: Already satisfied - no className TypeScript errors exist
- AC #4: N/A - NativeWind not used on web
<!-- SECTION:NOTES:END -->
