---
id: task-57
title: Sync design tokens between web and mobile gluestack themes
status: To Do
assignee: []
created_date: '2026-01-08 21:53'
updated_date: '2026-01-08 21:55'
labels:
  - ui
  - design
  - shared
milestone: Universal Components & Cross-Platform UI
dependencies:
  - task-53
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a shared design token system that ensures consistent colors, spacing, and typography between the web and mobile apps' gluestack-ui configurations.

## Current State
- Mobile has gluestack-ui with config.ts defining CSS variables
- Web app will have its own gluestack config after task-53
- No shared source of truth for design tokens

## Target State
- Single source of truth for design tokens in packages/shared
- Both apps import and use the same token values
- Theme changes propagate to both platforms

## Implementation

### packages/shared/src/design-tokens.ts
```typescript
export const colors = {
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    // ... full palette
    600: "#2563EB",
    900: "#1E3A8A",
  },
  // semantic colors
  success: { ... },
  error: { ... },
  warning: { ... },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
```

### Usage in gluestack config
```typescript
// apps/mobile/components/ui/gluestack-ui-provider/config.ts
import { colors } from "@boxtrack/shared";

export const config = {
  light: {
    "--color-primary-500": colors.primary[500],
    // ...
  }
};
```

## Benefits
- Design consistency across platforms
- Single place to update brand colors
- Easier handoff from design tools
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Design tokens defined in packages/shared
- [ ] #2 Mobile gluestack config imports tokens from shared
- [ ] #3 Web gluestack config imports tokens from shared
- [ ] #4 Color changes in shared propagate to both apps
- [ ] #5 TypeScript types for all token values
<!-- AC:END -->
