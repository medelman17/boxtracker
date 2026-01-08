---
id: task-54
title: Update Tailwind content paths for monorepo packages
status: To Do
assignee: []
created_date: '2026-01-08 21:53'
updated_date: '2026-01-08 21:55'
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
- [ ] #1 Mobile tailwind.config.js includes ../../packages paths
- [ ] #2 Styles from @boxtrack/ui render correctly in both apps
- [ ] #3 No missing Tailwind classes in production builds
<!-- AC:END -->
