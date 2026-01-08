---
id: task-53
title: Add gluestack-ui to Next.js web app
status: To Do
assignee: []
created_date: '2026-01-08 21:53'
updated_date: '2026-01-08 21:55'
labels:
  - ui
  - web
  - infrastructure
  - gluestack
milestone: Universal Components & Cross-Platform UI
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Initialize gluestack-ui in the web app to achieve UI consistency with the mobile app. This enables sharing the same component patterns and design tokens across platforms.

## Current State
- Mobile app has gluestack-ui v3 with 10 components (button, input, modal, toast, etc.)
- Web app uses plain Tailwind CSS v4 with custom components
- No shared component library between web and mobile for interactive UI elements

## Target State
- Both apps use gluestack-ui components with consistent theming
- Shared design tokens (colors, spacing) via CSS variables
- RSC-compatible setup for Next.js App Router

## Technical Requirements
1. Run `npx gluestack-ui init` in apps/web
2. Use the Next.js 15+ RSC-compatible GluestackUIProvider
3. Configure for Tailwind CSS v4 (web uses v4, mobile uses v3 for NativeWind)
4. Add GluestackUIProvider to root layout

## References
- gluestack-ui docs: https://gluestack.io/ui/docs/home/getting-started/installation
- RSC support: Use `@/components/ui/gluestack-ui-provider/index.next15`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 gluestack-ui is initialized in apps/web
- [ ] #2 GluestackUIProvider wraps the app in root layout
- [ ] #3 At least 3 gluestack components added (Button, Input, Modal)
- [ ] #4 Dark mode toggle works correctly
- [ ] #5 No conflicts with existing Tailwind v4 setup
<!-- AC:END -->
