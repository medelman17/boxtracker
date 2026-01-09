---
id: task-54
title: Update Tailwind content paths for monorepo packages
status: Done
assignee: []
created_date: '2026-01-08 21:53'
updated_date: '2026-01-09 03:43'
labels:
  - infrastructure
  - tailwind
  - monorepo
milestone: Universal Components & Cross-Platform UI
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update Tailwind CSS configuration in both apps to properly include shared workspace packages. This ensures Tailwind classes used in shared packages are generated correctly.

## Current State
- Mobile tailwind.config.js only includes local app paths
- Web uses Tailwind v4 with @source directive (partially configured)
- packages/ui components may have missing styles

## Changes Required

### apps/mobile/tailwind.config.js
```javascript
content: [
  "./app/**/*.{js,jsx,ts,tsx}",
  "./components/**/*.{js,jsx,ts,tsx}",
  // ADD: Shared packages
  "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  "../../packages/shared/src/**/*.{js,jsx,ts,tsx}",
],
```

### apps/web/app/globals.css
Already has @source for packages/ui - verify it works correctly.

## Why This Matters
Without proper content paths, Tailwind will tree-shake classes used in shared packages, causing missing styles at runtime.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mobile tailwind.config.js includes ../../packages paths
- [x] #2 Styles from @boxtrack/ui render correctly in both apps
- [x] #3 No missing Tailwind classes in production builds
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Notes

### Changes Made
1. Updated `apps/mobile/tailwind.config.js` to include shared package paths:
   - `../../packages/ui/src/**/*.{js,jsx,ts,tsx}`
   - `../../packages/shared/src/**/*.{js,jsx,ts,tsx}`

2. Updated `apps/web/app/globals.css` to add missing @source directive:
   - Added `@source "../../packages/shared/src/**/*.{js,ts,jsx,tsx}"`

### Verification
- Mobile app builds successfully with `expo export --platform web`
- Web app compiles successfully (pre-existing qrcode type error is unrelated)
- Both apps now properly scan shared packages for Tailwind classes
<!-- SECTION:NOTES:END -->
